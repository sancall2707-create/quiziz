/**
 * CodeNusa Cloud Functions
 *
 * Security-critical backend operations that MUST run server-side with the
 * Firebase Admin SDK because they bypass Firestore Rules:
 *
 *   onUserCreate   — auth trigger: sets the `student` custom claim on every new user.
 *   submitProgress — callable: writes protected fields (xp, stars, coins, level,
 *                    badges, streak, grade) that Firestore Rules deny to clients.
 *   createStaffAccount — callable (admin-only): creates admin/teacher accounts
 *                    and sets their custom claims.
 *   setUserRole    — callable (admin-only): changes a user's role claim.
 *   disableUser    — callable (admin-only): disables a user account.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onUserCreate } from 'firebase-functions/v2/auth';
import { logger } from 'firebase-functions';

// Initialize Admin SDK once
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

// Firestore database ID must match the app's config
const FIRESTORE_DB_ID = 'ai-studio-codenusa-deaefbe9-a722-44d6-9e2c-1855cb2c502e';
const firestore = db.collection('users').databaseId
  ? admin.firestore().database(FIRESTORE_DB_ID)
  : admin.firestore();

// ============================================================
//  onUserCreate — set `student` custom claim for every new user
//  so Firestore Rules can rely on request.auth.token.role.
// ============================================================
export const setStudentClaimOnCreate = onUserCreate(async (event) => {
  const uid = event.data?.uid;
  if (!uid) return;

  try {
    // Only set if no role claim exists (don't overwrite admin/teacher claims)
    const user = await auth.getUser(uid);
    if (user.customClaims?.role) {
      logger.info(`User ${uid} already has role claim: ${user.customClaims.role}`);
      return;
    }
    await auth.setCustomUserClaims(uid, { role: 'student' });
    logger.info(`Set student claim for ${uid}`);
  } catch (err) {
    logger.error('Failed to set student claim:', err);
  }
});

// ============================================================
//  submitProgress — callable: update protected user fields
//  Students cannot write xp/stars/coins/level/badges/grade
//  directly (Firestore Rules block it). This function validates
//  and applies the update server-side.
// ============================================================
interface ProgressPayload {
  type: 'mission_complete' | 'daily_claim' | 'streak_checkin' | 'daily_activity' | 'challenge_bonus' | 'change_grade';
  payload: Record<string, unknown>;
}

export const submitProgress = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Anda harus masuk untuk menyimpan progres.');
  }

  const uid = request.auth.uid;
  const callerRole = (request.auth.token?.role as string) || 'student';

  const data = request.data as ProgressPayload;
  if (!data?.type) {
    throw new HttpsError('invalid-argument', 'Tipe progres wajib diisi.');
  }

  try {
    const userRef = firestore.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Profil pengguna tidak ditemukan.');
    }
    const profile = userSnap.data() as Record<string, unknown>;

    const update: Record<string, unknown> = {};

    switch (data.type) {
      case 'mission_complete': {
        const { missionId, stars, score, xpEarned, coinsEarned, starsEarned, badgeId, kobiPosition } = data.payload as any;
        const completed: string[] = Array.from(new Set([...(profile.completedMissions || []), missionId]));
        const rewardsClaimed: string[] = Array.from(new Set([...(profile.rewardsClaimed || []), missionId]));
        const badges: string[] = badgeId && !(profile.badges || []).includes(badgeId) ? [...(profile.badges || []), badgeId] : (profile.badges || []);
        const newXp = (profile.xp || 0) + (xpEarned || 0);
        const newLevel = Math.floor(newXp / 250) + 1;
        const missionScores = { ...(profile.missionScores || {}), [missionId]: { stars: Math.max(stars, (profile.missionScores?.[missionId]?.stars || 0)), score: Math.max(score, (profile.missionScores?.[missionId]?.score || 0)), completedAt: new Date().toISOString() } };
        Object.assign(update, {
          xp: newXp, level: newLevel,
          stars: (profile.stars || 0) + (starsEarned || 0),
          coins: (profile.coins || 0) + (coinsEarned || 0),
          completedMissions: completed, rewardsClaimed,
          badges, missionScores, kobiPosition: kobiPosition || profile.kobiPosition
        });
        break;
      }
      case 'daily_claim': {
        const { stars, coins } = data.payload as any;
        Object.assign(update, {
          stars: (profile.stars || 0) + (stars || 0),
          coins: (profile.coins || 0) + (coins || 0)
        });
        break;
      }
      case 'streak_checkin': {
        const { streakDays, streakHistory, lastActiveDate, bonusXp, bonusCoins, badgeId } = data.payload as any;
        const badges: string[] = badgeId && !(profile.badges || []).includes(badgeId) ? [...(profile.badges || []), badgeId] : (profile.badges || []);
        Object.assign(update, {
          streakDays, streakHistory, lastActiveDate, lastActive: 'Hari ini',
          xp: (profile.xp || 0) + (bonusXp || 0),
          coins: (profile.coins || 0) + (bonusCoins || 0),
          badges
        });
        break;
      }
      case 'daily_activity': {
        const { bonusCoins, bonusXp, newBadges, streakDays, streakHistory, lastActiveDate } = data.payload as any;
        const existingBadges: string[] = (profile.badges || []);
        const badges = [...existingBadges, ...(newBadges || []).filter((b: string) => !existingBadges.includes(b))];
        Object.assign(update, {
          streakDays, streakHistory, lastActiveDate, lastActive: 'Hari ini',
          xp: (profile.xp || 0) + (bonusXp || 0),
          coins: (profile.coins || 0) + (bonusCoins || 0),
          badges
        });
        break;
      }
      case 'challenge_bonus': {
        const { stars, xp, coins } = data.payload as any;
        const newXp = (profile.xp || 0) + (xp || 0);
        Object.assign(update, {
          xp: newXp, level: Math.floor(newXp / 250) + 1,
          stars: (profile.stars || 0) + (stars || 0),
          coins: (profile.coins || 0) + (coins || 0)
        });
        break;
      }
      case 'change_grade': {
        // Only admin/teacher can persist grade changes
        if (callerRole !== 'admin' && callerRole !== 'teacher') {
          throw new HttpsError('permission-denied', 'Siswa tidak dapat mengubah kelasnya sendiri.');
        }
        update.grade = data.payload.grade;
        break;
      }
      default:
        throw new HttpsError('invalid-argument', `Tipe progres tidak dikenal: ${data.type}`);
    }

    // Never allow passwordHash in any update
    delete update.passwordHash;
    delete update.password;

    await userRef.set(update, { merge: true });
    return { success: true };
  } catch (err) {
    logger.error('submitProgress error:', err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', 'Gagal menyimpan progres.');
  }
});

// ============================================================
//  createStaffAccount — callable (admin-only)
//  Creates an admin or teacher account with a custom claim.
//  NO admin creation from public frontend — only existing admins
//  can call this.
// ============================================================
interface CreateStaffData {
  username: string;
  name: string;
  password: string;
  role: 'admin' | 'teacher';
  school?: string;
}

function getInternalEmail(username: string): string {
  return `${username.trim().toLowerCase()}@siswa.codenusa.internal`;
}

export const createStaffAccount = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Anda harus masuk.');
  }
  const callerRole = (request.auth.token?.role as string) || 'student';
  if (callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Hanya admin yang dapat membuat akun staf.');
  }

  const { username, name, password, role, school } = request.data as CreateStaffData;

  if (!username || !name || !password) {
    throw new HttpsError('invalid-argument', 'Username, nama, dan kata sandi wajib diisi.');
  }
  if (password.length < 8) {
    throw new HttpsError('invalid-argument', 'Kata sandi minimal 8 karakter.');
  }
  if (role !== 'admin' && role !== 'teacher') {
    throw new HttpsError('invalid-argument', 'Role harus admin atau teacher.');
  }

  const email = getInternalEmail(username);

  try {
    // 1. Create Firebase Auth user
    const userRecord = await auth.createUser({ email, password, displayName: name });

    // 2. Set custom claim
    await auth.setCustomUserClaims(userRecord.uid, { role });

    // 3. Create Firestore profile
    const todayStr = new Date().toISOString().split('T')[0];
    await firestore.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      name, fullName: name, username: username.trim().toLowerCase(),
      role, email: null,
      avatar: '',
      grade: 4,
      school: school || (role === 'admin' ? 'Pusat Kurikulum CodeNusa' : 'SD Harapan Nusantara'),
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
      xp: 0, level: 1, stars: 0, coins: 0,
      streakDays: 1, streakHistory: [todayStr],
      lastActive: 'Hari ini', lastActiveDate: todayStr,
      badges: ['badge-mastery'],
      completedMissions: [], rewardsClaimed: [], missionScores: {},
      kobiPosition: 'node-1',
      kobiCustomization: role === 'admin'
        ? { skin: 'gold-champion', hat: 'crown', accessory: 'cyber-goggles' }
        : { skin: 'blue-classic', hat: 'none', accessory: 'none' },
      settings: { soundEnabled: true, narrationVoiceEnabled: false, reduceMotion: false, highContrast: false, dyslexicFont: false, fontSize: 'normal' },
      mustChangePassword: true
    });

    return { success: true, uid: userRecord.uid };
  } catch (err: any) {
    logger.error('createStaffAccount error:', err);
    if (err.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Username sudah digunakan.');
    }
    throw new HttpsError('internal', 'Gagal membuat akun staf: ' + (err.message || ''));
  }
});

// ============================================================
//  setUserRole — callable (admin-only)
//  Changes a user's role via custom claims.
// ============================================================
interface SetRoleData {
  uid: string;
  role: 'admin' | 'teacher' | 'student';
}

export const setUserRole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Anda harus masuk.');
  }
  const callerRole = (request.auth.token?.role as string) || 'student';
  if (callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Hanya admin yang dapat mengubah role pengguna.');
  }

  const { uid, role } = request.data as SetRoleData;
  if (!uid || !role) {
    throw new HttpsError('invalid-argument', 'UID dan role wajib diisi.');
  }
  if (!['admin', 'teacher', 'student'].includes(role)) {
    throw new HttpsError('invalid-argument', 'Role tidak valid.');
  }

  try {
    await auth.setCustomUserClaims(uid, { role });
    // Also update the Firestore profile's role field (informational)
    await firestore.collection('users').doc(uid).set({ role }, { merge: true });
    return { success: true };
  } catch (err: any) {
    logger.error('setUserRole error:', err);
    throw new HttpsError('internal', 'Gagal mengubah role: ' + (err.message || ''));
  }
});

// ============================================================
//  disableUser — callable (admin-only)
//  Disables a user account in Firebase Auth.
// ============================================================
interface DisableUserData {
  uid: string;
}

export const disableUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Anda harus masuk.');
  }
  const callerRole = (request.auth.token?.role as string) || 'student';
  if (callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Hanya admin yang dapat menonaktifkan akun.');
  }

  const { uid } = request.data as DisableUserData;
  if (!uid) {
    throw new HttpsError('invalid-argument', 'UID wajib diisi.');
  }
  if (uid === request.auth.uid) {
    throw new HttpsError('invalid-argument', 'Anda tidak dapat menonaktifkan akun sendiri.');
  }

  try {
    await auth.updateUser(uid, { disabled: true });
    await firestore.collection('users').doc(uid).set({ accountStatus: 'inactive' }, { merge: true });
    return { success: true };
  } catch (err: any) {
    logger.error('disableUser error:', err);
    throw new HttpsError('internal', 'Gagal menonaktifkan akun: ' + (err.message || ''));
  }
});
