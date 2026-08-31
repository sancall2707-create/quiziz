/**
 * CodeNusa Cloud Functions — Security-Hardened
 *
 *   setStudentClaimOnCreate — auth trigger: sets `student` custom claim.
 *   submitProgress           — callable: writes protected fields with
 *                              server-side validation (no client-trusted values).
 *   createStaffAccount       — callable (admin-only): creates staff accounts.
 *   setUserRole              — callable (admin-only): changes role claim.
 *   disableUser             — callable (admin-only): disables + revokes tokens.
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
//  Validation helpers — range-check client-supplied numbers
// ============================================================

function clampInt(val: unknown, min: number, max: number, fallback: number): number {
  const n = typeof val === 'number' && Number.isFinite(val) ? Math.floor(val) : fallback;
  return Math.max(min, Math.min(max, n));
}

function isNonEmptyString(val: unknown, maxLen: number): boolean {
  return typeof val === 'string' && val.length > 0 && val.length <= maxLen;
}

function isStringArray(val: unknown, maxLen: number, itemMaxLen: number): boolean {
  return Array.isArray(val) && val.length <= maxLen && val.every((s) => typeof s === 'string' && s.length <= itemMaxLen);
}

// ============================================================
//  onUserCreate — set `student` custom claim for every new user
// ============================================================
export const setStudentClaimOnCreate = onUserCreate(async (event) => {
  const uid = event.data?.uid;
  if (!uid) return;

  try {
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
//  with SERVER-SIDE validation.  Client-supplied reward values
//  are range-clamped, never trusted raw.
//  Identity is ALWAYS request.auth.uid — client cannot target
//  another user's document.
// ============================================================
interface ProgressPayload {
  type: 'mission_complete' | 'daily_claim' | 'streak_checkin' | 'daily_activity' | 'challenge_bonus' | 'change_grade';
  payload: Record<string, unknown>;
}

export const submitProgress = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Anda harus masuk untuk menyimpan progres.');
  }

  // Identity ALWAYS comes from the authenticated token — never from the request body.
  const uid = request.auth.uid;
  const callerRole = (request.auth.token?.role as string) || 'student';

  const data = request.data as ProgressPayload;
  if (!data?.type || typeof data.type !== 'string') {
    throw new HttpsError('invalid-argument', 'Tipe progres tidak valid.');
  }

  // Ensure account is still active
  if (request.auth.token?.disabled === true) {
    throw new HttpsError('permission-denied', 'Akun dinonaktifkan.');
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
        const p = data.payload;
        const missionId = isNonEmptyString(p.missionId, 200) ? (p.missionId as string) : null;
        if (!missionId) throw new HttpsError('invalid-argument', 'missionId tidak valid.');

        // Range-clamp ALL client-supplied reward values
        const stars = clampInt(p.stars, 0, 3, 0);          // max 3 stars per mission
        const score = clampInt(p.score, 0, 10000, 0);
        const xpEarned = clampInt(p.xpEarned, 0, 500, 0);   // max 500 XP per mission
        const coinsEarned = clampInt(p.coinsEarned, 0, 100, 0); // max 100 coins
        const starsEarned = clampInt(p.starsEarned, 0, 3, 0);
        const badgeId = (typeof p.badgeId === 'string' && p.badgeId.length <= 100) ? p.badgeId : null;
        const kobiPosition = (typeof p.kobiPosition === 'string' && p.kobiPosition.length <= 50) ? p.kobiPosition : null;

        // Idempotency: don't double-award if already claimed
        const rewardsClaimed: string[] = Array.isArray(profile.rewardsClaimed) ? profile.rewardsClaimed : [];
        if (rewardsClaimed.includes(missionId)) {
          return { success: true, alreadyClaimed: true };
        }

        const completed: string[] = Array.from(new Set([...(profile.completedMissions || []), missionId]));
        const updatedClaimed = Array.from(new Set([...rewardsClaimed, missionId]));
        const existingBadges: string[] = Array.isArray(profile.badges) ? profile.badges : [];
        const badges = badgeId && !existingBadges.includes(badgeId) ? [...existingBadges, badgeId] : existingBadges;
        const newXp = (profile.xp || 0) + xpEarned;
        const newLevel = Math.floor(newXp / 250) + 1;
        const existingScores = (profile.missionScores || {}) as Record<string, unknown>;
        const prevScore = (existingScores[missionId] as { stars?: number; score?: number }) || {};
        const missionScores = {
          ...existingScores,
          [missionId]: {
            stars: Math.max(stars, prevScore.stars || 0),
            score: Math.max(score, prevScore.score || 0),
            completedAt: new Date().toISOString()
          }
        };

        Object.assign(update, {
          xp: newXp, level: newLevel,
          stars: (profile.stars || 0) + starsEarned,
          coins: (profile.coins || 0) + coinsEarned,
          completedMissions: completed, rewardsClaimed: updatedClaimed,
          badges, missionScores,
          ...(kobiPosition ? { kobiPosition } : {})
        });
        break;
      }

      case 'daily_claim': {
        const p = data.payload;
        const stars = clampInt(p.stars, 0, 50, 0);    // max 50 stars per daily mission
        const coins = clampInt(p.coins, 0, 200, 0);   // max 200 coins
        Object.assign(update, {
          stars: (profile.stars || 0) + stars,
          coins: (profile.coins || 0) + coins
        });
        break;
      }

      case 'streak_checkin': {
        const p = data.payload;
        // Compute streak SERVER-SIDE — do not trust client-supplied streak values
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayStr = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })();
        const existingHistory: string[] = Array.isArray(profile.streakHistory) ? profile.streakHistory : [];
        const lastActiveDate = profile.lastActiveDate as string | undefined;

        const alreadyToday = existingHistory.includes(todayStr) || lastActiveDate === todayStr;
        if (alreadyToday) {
          return { success: true, alreadyClaimed: true };
        }

        let newStreak = 1;
        if (lastActiveDate === yesterdayStr || (profile.streakDays && profile.streakDays > 0 && !lastActiveDate)) {
          newStreak = ((profile.streakDays as number) || 0) + 1;
        }
        const newHistory = Array.from(new Set([...existingHistory, todayStr]));

        // Clamp bonus values
        const bonusXp = clampInt(p.bonusXp, 0, 500, 0);
        const bonusCoins = clampInt(p.bonusCoins, 0, 500, 0);
        const badgeId = (typeof p.badgeId === 'string' && p.badgeId.length <= 100) ? p.badgeId : null;
        const existingBadges: string[] = Array.isArray(profile.badges) ? profile.badges : [];
        const badges = badgeId && !existingBadges.includes(badgeId) ? [...existingBadges, badgeId] : existingBadges;

        Object.assign(update, {
          streakDays: newStreak, streakHistory: newHistory,
          lastActiveDate: todayStr, lastActive: 'Hari ini',
          xp: (profile.xp || 0) + bonusXp,
          coins: (profile.coins || 0) + bonusCoins,
          badges
        });
        break;
      }

      case 'daily_activity': {
        const p = data.payload;
        // Compute streak SERVER-SIDE
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayStr = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })();
        const existingHistory: string[] = Array.isArray(profile.streakHistory) ? profile.streakHistory : [];
        const lastActiveDate = profile.lastActiveDate as string | undefined;
        const alreadyToday = existingHistory.includes(todayStr) || lastActiveDate === todayStr;

        let newStreak = (profile.streakDays as number) || 0;
        let newHistory = existingHistory;
        if (!alreadyToday) {
          if (lastActiveDate === yesterdayStr || (profile.streakDays && profile.streakDays > 0 && !lastActiveDate)) {
            newStreak = ((profile.streakDays as number) || 0) + 1;
          } else {
            newStreak = 1;
          }
          newHistory = Array.from(new Set([...existingHistory, todayStr]));
        }

        // Clamp bonus values
        const bonusXp = clampInt(p.bonusXp, 0, 500, 0);
        const bonusCoins = clampInt(p.bonusCoins, 0, 500, 0);
        // Validate badge IDs
        const newBadges = isStringArray(p.newBadges, 10, 100) ? (p.newBadges as string[]) : [];
        const existingBadges: string[] = Array.isArray(profile.badges) ? profile.badges : [];
        const badges = [...existingBadges, ...newBadges.filter((b) => !existingBadges.includes(b))];

        Object.assign(update, {
          streakDays: newStreak, streakHistory: newHistory,
          lastActiveDate: todayStr, lastActive: 'Hari ini',
          xp: (profile.xp || 0) + bonusXp,
          coins: (profile.coins || 0) + bonusCoins,
          badges
        });
        break;
      }

      case 'challenge_bonus': {
        const p = data.payload;
        const stars = clampInt(p.stars, 0, 100, 0);
        const xp = clampInt(p.xp, 0, 1000, 0);
        const coins = clampInt(p.coins, 0, 1000, 0);
        const newXp = (profile.xp || 0) + xp;
        Object.assign(update, {
          xp: newXp, level: Math.floor(newXp / 250) + 1,
          stars: (profile.stars || 0) + stars,
          coins: (profile.coins || 0) + coins
        });
        break;
      }

      case 'change_grade': {
        if (callerRole !== 'admin' && callerRole !== 'teacher') {
          throw new HttpsError('permission-denied', 'Siswa tidak dapat mengubah kelasnya sendiri.');
        }
        const grade = clampInt(data.payload.grade, 1, 6, 4);
        update.grade = grade;
        break;
      }

      default:
        throw new HttpsError('invalid-argument', `Tipe progres tidak dikenal: ${data.type}`);
    }

    // Never allow password fields in any update
    delete update.passwordHash;
    delete update.password;
    // Never allow role escalation via progress
    delete update.role;

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
//  Handles partial failure: if Firestore write fails after Auth
//  account creation, the Auth account is deleted to prevent
//  orphaned accounts.
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

  // Input validation
  if (!isNonEmptyString(username, 50)) {
    throw new HttpsError('invalid-argument', 'Username wajib diisi (maks 50 karakter).');
  }
  if (!isNonEmptyString(name, 100)) {
    throw new HttpsError('invalid-argument', 'Nama wajib diisi (maks 100 karakter).');
  }
  if (!isNonEmptyString(password, 200) || password.length < 8) {
    throw new HttpsError('invalid-argument', 'Kata sandi minimal 8 karakter.');
  }
  if (role !== 'admin' && role !== 'teacher') {
    throw new HttpsError('invalid-argument', 'Role harus admin atau teacher.');
  }

  const email = getInternalEmail(username);
  const todayStr = new Date().toISOString().split('T')[0];

  let userRecord: admin.auth.UserRecord | null = null;

  try {
    // 1. Create Firebase Auth user
    userRecord = await auth.createUser({ email, password, displayName: name });

    // 2. Set custom claim (admin or teacher — NEVER 'student' here)
    await auth.setCustomUserClaims(userRecord.uid, { role });

    // 3. Create Firestore profile — if this fails, clean up the Auth account
    try {
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
    } catch (firestoreErr) {
      // Partial failure — delete the orphaned Auth account
      logger.error('Firestore profile creation failed, rolling back Auth account:', firestoreErr);
      try { await auth.deleteUser(userRecord.uid); } catch (delErr) { logger.error('Rollback delete failed:', delErr); }
      throw new HttpsError('internal', 'Gagal membuat profil Firestore. Akun dibatalkan, silakan coba lagi.');
    }

    // Return only safe fields — never the password
    return { success: true, uid: userRecord.uid };
  } catch (err: any) {
    if (err instanceof HttpsError) throw err;
    if (err.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Username sudah digunakan.');
    }
    logger.error('createStaffAccount error:', err);
    throw new HttpsError('internal', 'Gagal membuat akun staf.');
  }
});

// ============================================================
//  setUserRole — callable (admin-only)
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
  if (!isNonEmptyString(uid, 128)) {
    throw new HttpsError('invalid-argument', 'UID tidak valid.');
  }
  if (!['admin', 'teacher', 'student'].includes(role)) {
    throw new HttpsError('invalid-argument', 'Role tidak valid. Gunakan: admin, teacher, atau student.');
  }

  try {
    await auth.setCustomUserClaims(uid, { role });
    // Also update the Firestore profile's role field (informational only —
    // authorization always uses the custom claim, never this field)
    await firestore.collection('users').doc(uid).set({ role }, { merge: true });
    return { success: true };
  } catch (err: any) {
    logger.error('setUserRole error:', err);
    throw new HttpsError('internal', 'Gagal mengubah role pengguna.');
  }
});

// ============================================================
//  disableUser — callable (admin-only)
//  Disables the account AND revokes all refresh tokens so existing
//  tokens are invalidated immediately (not after the 1-hour TTL).
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
  if (!isNonEmptyString(uid, 128)) {
    throw new HttpsError('invalid-argument', 'UID tidak valid.');
  }
  if (uid === request.auth.uid) {
    throw new HttpsError('invalid-argument', 'Anda tidak dapat menonaktifkan akun sendiri.');
  }

  try {
    // Disable the account + revoke all refresh tokens immediately
    await auth.updateUser(uid, { disabled: true });
    await auth.revokeRefreshTokens(uid);
    await firestore.collection('users').doc(uid).set({ accountStatus: 'inactive' }, { merge: true });
    return { success: true };
  } catch (err: any) {
    logger.error('disableUser error:', err);
    throw new HttpsError('internal', 'Gagal menonaktifkan akun.');
  }
});
