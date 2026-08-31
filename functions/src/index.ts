/**
 * CodeNusa Cloud Functions — Security-Hardened (Phase 2)
 *
 * Key security principles:
 *   - Identity ALWAYS from request.auth.uid — never from request body.
 *   - Rewards computed server-side from missionRewards config — client sends
 *     only identifiers (missionId, score, stars as performance metrics).
 *   - Idempotency via Firestore transactions — no reward duplication.
 *   - Teacher authorization via custom claims (teacherClassIds).
 *   - Disabled accounts rejected server-side (auth.getUser + accountStatus).
 *   - All input validated: schema, type, length, enum.
 *   - No stack traces or internals leaked in error messages.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { beforeUserCreated } from 'firebase-functions/identity';
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import type { Transaction } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2/options';

// Set default region for callable functions — must match frontend's
// getFunctions(app, 'asia-southeast1').  Blocking Auth functions
// (beforeUserCreated) override to us-central1 as required by Identity Platform.
setGlobalOptions({ region: 'asia-southeast1', maxInstances: 10 });
import {
  MISSION_REWARDS,
  DAILY_MISSION_REWARDS,
  STREAK_MILESTONES,
  STREAK_CHECKIN_BONUS,
  CHALLENGE_LIMITS,
} from './missionRewards';

// Initialize Admin SDK once
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const auth = admin.auth();

// Use the same named Firestore database as the frontend
const FIRESTORE_DB_ID = 'ai-studio-codenusa-deaefbe9-a722-44d6-9e2c-1855cb2c502e';
const firestore = getFirestore(FIRESTORE_DB_ID);

// ============================================================
//  Validation helpers
// ============================================================

function isNonEmptyString(val: unknown, maxLen: number): boolean {
  return typeof val === 'string' && val.length > 0 && val.length <= maxLen;
}

function isStringArray(val: unknown, maxLen: number, itemMaxLen: number): boolean {
  return Array.isArray(val) && val.length <= maxLen && val.every((s) => typeof s === 'string' && s.length <= itemMaxLen);
}

function clampInt(val: unknown, min: number, max: number, fallback: number): number {
  const n = typeof val === 'number' && Number.isFinite(val) ? Math.floor(val) : fallback;
  return Math.max(min, Math.min(max, n));
}

/** Safely extract a number from an unknown Firestore field. */
function num(val: unknown, fallback: number): number {
  return typeof val === 'number' && Number.isFinite(val) ? val : fallback;
}

/** Safely extract a string array from an unknown Firestore field. */
function strArr(val: unknown): string[] {
  return Array.isArray(val) ? val.filter((s): s is string => typeof s === 'string') : [];
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// ============================================================
//  beforeUserCreated — blocking function that sets the `student`
//  custom claim BEFORE the user is saved. This eliminates the
//  race condition: the claim is available immediately when
//  onAuthStateChanged fires after registration.
//
//  This ONLY fires for client-side registrations (createUserWithEmailAndPassword).
//  Admin SDK createUser (used by createStaffAccount) does NOT trigger this.
//  Public registration always produces role=student — no client input trusted.
// ============================================================
export const setStudentClaimOnCreate = beforeUserCreated(
  { region: 'us-central1' },
  async (event) => {
  // Set the student custom claim. Since this runs before the user is saved,
  // there are no existing claims to check — always set student for public
  // registrations.
  logger.info(`Setting student claim for new user: ${event.data?.uid ?? 'unknown'}`);
  return {
    customClaims: { role: 'student' },
  };
});

// ============================================================
//  submitProgress — callable: update protected user fields
//  with SERVER-SIDE reward calculation and atomic transactions.
//
//  Client sends ONLY identifiers and performance metrics.
//  Rewards (xp, coins, stars, badges) are computed from
//  server-side config — never trusted from the client.
// ============================================================
interface ProgressPayload {
  type: 'mission_complete' | 'daily_claim' | 'streak_checkin' | 'daily_activity' | 'challenge_bonus';
  payload: Record<string, unknown>;
}

export const submitProgress = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Anda harus masuk untuk menyimpan progres.');
  }

  const uid = request.auth.uid;

  const data = request.data as ProgressPayload;
  if (!data || typeof data.type !== 'string') {
    throw new HttpsError('invalid-argument', 'Permintaan tidak valid.');
  }

  try {
    // Verify account is still active (server-side check — doesn't rely on
    // frontend logout). Token revocation handles most cases, but a cached
    // token could still arrive within the TTL window.
    const userRecord = await auth.getUser(uid);
    if (userRecord.disabled) {
      throw new HttpsError('permission-denied', 'Akun dinonaktifkan.');
    }

    const userRef = firestore.collection('users').doc(uid);

    switch (data.type) {
      // ========================================================
      //  mission_complete — uses Firestore transaction for
      //  atomicity and idempotency. Rewards come from
      //  MISSION_REWARDS config, NOT from the client.
      // ========================================================
      case 'mission_complete': {
        const p = data.payload;
        const missionId = isNonEmptyString(p.missionId, 200) ? (p.missionId as string) : null;
        if (!missionId) throw new HttpsError('invalid-argument', 'missionId tidak valid.');

        // Look up reward config server-side
        const reward = MISSION_REWARDS[missionId];
        if (!reward) {
          throw new HttpsError('not-found', 'Misi tidak ditemukan dalam konfigurasi server.');
        }

        // Performance metrics from client (range-clamped, not authoritative)
        const stars = clampInt(p.stars, 0, 3, 0);
        const score = clampInt(p.score, 0, 10000, 0);
        const kobiPosition = (typeof p.kobiPosition === 'string' && p.kobiPosition.length <= 50) ? p.kobiPosition : null;

        // Atomic transaction — prevents race condition on duplicate claims
        const result = await firestore.runTransaction(async (tx: Transaction) => {
          const snap = await tx.get(userRef);
          if (!snap.exists) throw new HttpsError('not-found', 'Profil pengguna tidak ditemukan.');

          const profile = snap.data() as Record<string, unknown>;

          // Idempotency: check if reward already claimed
          const rewardsClaimed = strArr(profile.rewardsClaimed);
          if (rewardsClaimed.includes(missionId)) {
            return { success: true, alreadyClaimed: true };
          }

          // Compute rewards from server config
          const xpEarned = reward.rewardXp;
          const starsEarned = reward.rewardStars;
          const coinsEarned = reward.rewardCoins;
          const badgeId = reward.rewardBadgeId || null;

          const completed: string[] = Array.from(new Set([...strArr(profile.completedMissions), missionId]));
          const updatedClaimed = Array.from(new Set([...rewardsClaimed, missionId]));
          const existingBadges = strArr(profile.badges);
          const badges = badgeId && !existingBadges.includes(badgeId) ? [...existingBadges, badgeId] : existingBadges;
          const newXp = num(profile.xp, 0) + xpEarned;
          const newLevel = Math.floor(newXp / 250) + 1;
          const existingScores = (profile.missionScores || {}) as Record<string, unknown>;
          const prevScore = (existingScores[missionId] as { stars?: number; score?: number }) || {};
          const missionScores = {
            ...existingScores,
            [missionId]: {
              stars: Math.max(stars, prevScore.stars || 0),
              score: Math.max(score, prevScore.score || 0),
              completedAt: new Date().toISOString(),
            },
          };

          const update: Record<string, unknown> = {
            xp: newXp, level: newLevel,
            stars: num(profile.stars, 0) + starsEarned,
            coins: num(profile.coins, 0) + coinsEarned,
            completedMissions: completed, rewardsClaimed: updatedClaimed,
            badges, missionScores,
          };
          if (kobiPosition) update.kobiPosition = kobiPosition;

          tx.set(userRef, update, { merge: true });
          return { success: true, alreadyClaimed: false };
        });

        return result;
      }

      // ========================================================
      //  daily_claim — rewards from DAILY_MISSION_REWARDS config.
      //  Uses transaction for idempotency.
      // ========================================================
      case 'daily_claim': {
        const p = data.payload;
        const missionId = isNonEmptyString(p.missionId, 200) ? (p.missionId as string) : null;
        if (!missionId) throw new HttpsError('invalid-argument', 'missionId tidak valid.');

        const reward = DAILY_MISSION_REWARDS[missionId];
        if (!reward) {
          throw new HttpsError('not-found', 'Misi harian tidak ditemukan.');
        }

        const result = await firestore.runTransaction(async (tx: Transaction) => {
          const snap = await tx.get(userRef);
          if (!snap.exists) throw new HttpsError('not-found', 'Profil pengguna tidak ditemukan.');
          const profile = snap.data() as Record<string, unknown>;

          // Idempotency: check if this daily mission was already claimed today
          const todayStr = getTodayStr();
          const dailyClaimed = (profile.dailyClaimed || {}) as Record<string, string>;
          if (dailyClaimed[missionId] === todayStr) {
            return { success: true, alreadyClaimed: true };
          }

          const update: Record<string, unknown> = {
            stars: num(profile.stars, 0) + reward.rewardStars,
            coins: num(profile.coins, 0) + reward.rewardCoins,
            dailyClaimed: { ...dailyClaimed, [missionId]: todayStr },
          };

          tx.set(userRef, update, { merge: true });
          return { success: true, alreadyClaimed: false };
        });

        return result;
      }

      // ========================================================
      //  streak_checkin — streak computed server-side, bonus
      //  from STREAK config. Uses transaction.
      // ========================================================
      case 'streak_checkin': {
        const result = await firestore.runTransaction(async (tx: Transaction) => {
          const snap = await tx.get(userRef);
          if (!snap.exists) throw new HttpsError('not-found', 'Profil pengguna tidak ditemukan.');
          const profile = snap.data() as Record<string, unknown>;

          const todayStr = getTodayStr();
          const yesterdayStr = getYesterdayStr();
          const existingHistory = strArr(profile.streakHistory);
          const lastActiveDate = profile.lastActiveDate as string | undefined;

          const alreadyToday = existingHistory.includes(todayStr) || lastActiveDate === todayStr;
          if (alreadyToday) {
            return { success: true, alreadyClaimed: true };
          }

          let newStreak = 1;
          if (lastActiveDate === yesterdayStr || (num(profile.streakDays, 0) > 0 && !lastActiveDate)) {
            newStreak = num(profile.streakDays, 0) + 1;
          }
          const newHistory = Array.from(new Set([...existingHistory, todayStr]));

          // Compute milestone bonus from server config
          const existingBadges = strArr(profile.badges);
          let bonusXp = STREAK_CHECKIN_BONUS.xp;
          let bonusCoins = STREAK_CHECKIN_BONUS.coins;
          const newBadgesToAdd: string[] = [];

          for (const milestone of STREAK_MILESTONES) {
            if (newStreak >= milestone.days && !existingBadges.includes(milestone.badgeId)) {
              newBadgesToAdd.push(milestone.badgeId);
              bonusXp += milestone.bonusXp;
              bonusCoins += milestone.bonusCoins;
            }
          }

          const badges = [...existingBadges, ...newBadgesToAdd];

          tx.set(userRef, {
            streakDays: newStreak, streakHistory: newHistory,
            lastActiveDate: todayStr, lastActive: 'Hari ini',
            xp: num(profile.xp, 0) + bonusXp,
            coins: num(profile.coins, 0) + bonusCoins,
            badges,
          }, { merge: true });

          return { success: true, alreadyClaimed: false, streakDays: newStreak };
        });

        return result;
      }

      // ========================================================
      //  daily_activity — streak computed server-side, bonus
      //  from config. Uses transaction.
      // ========================================================
      case 'daily_activity': {
        const result = await firestore.runTransaction(async (tx: Transaction) => {
          const snap = await tx.get(userRef);
          if (!snap.exists) throw new HttpsError('not-found', 'Profil pengguna tidak ditemukan.');
          const profile = snap.data() as Record<string, unknown>;

          const todayStr = getTodayStr();
          const yesterdayStr = getYesterdayStr();
          const existingHistory = strArr(profile.streakHistory);
          const lastActiveDate = profile.lastActiveDate as string | undefined;
          const alreadyToday = existingHistory.includes(todayStr) || lastActiveDate === todayStr;

          let newStreak = num(profile.streakDays, 0);
          let newHistory = existingHistory;
          if (!alreadyToday) {
            if (lastActiveDate === yesterdayStr || (num(profile.streakDays, 0) > 0 && !lastActiveDate)) {
              newStreak = num(profile.streakDays, 0) + 1;
            } else {
              newStreak = 1;
            }
            newHistory = Array.from(new Set([...existingHistory, todayStr]));
          }

          // Compute milestone bonus from server config
          const existingBadges = strArr(profile.badges);
          let bonusXp = 0;
          let bonusCoins = 0;
          const newBadgesToAdd: string[] = [];

          for (const milestone of STREAK_MILESTONES) {
            if (newStreak >= milestone.days && !existingBadges.includes(milestone.badgeId)) {
              newBadgesToAdd.push(milestone.badgeId);
              bonusXp += milestone.bonusXp;
              bonusCoins += milestone.bonusCoins;
            }
          }

          const badges = [...existingBadges, ...newBadgesToAdd];

          tx.set(userRef, {
            streakDays: newStreak, streakHistory: newHistory,
            lastActiveDate: todayStr, lastActive: 'Hari ini',
            xp: num(profile.xp, 0) + bonusXp,
            coins: num(profile.coins, 0) + bonusCoins,
            badges,
          }, { merge: true });

          return { success: true };
        });

        return result;
      }

      // ========================================================
      //  challenge_bonus — range-clamped (no full server config
      //  available for dynamic challenges). Client values are
      //  bounded to safe maximums.
      // ========================================================
      case 'challenge_bonus': {
        const p = data.payload;
        const stars = clampInt(p.stars, 0, CHALLENGE_LIMITS.maxStars, 0);
        const xp = clampInt(p.xp, 0, CHALLENGE_LIMITS.maxXp, 0);
        const coins = clampInt(p.coins, 0, CHALLENGE_LIMITS.maxCoins, 0);

        const result = await firestore.runTransaction(async (tx: Transaction) => {
          const snap = await tx.get(userRef);
          if (!snap.exists) throw new HttpsError('not-found', 'Profil pengguna tidak ditemukan.');
          const profile = snap.data() as Record<string, unknown>;

          const newXp = num(profile.xp, 0) + xp;
          tx.set(userRef, {
            xp: newXp, level: Math.floor(newXp / 250) + 1,
            stars: num(profile.stars, 0) + stars,
            coins: num(profile.coins, 0) + coins,
          }, { merge: true });
          return { success: true };
        });

        return result;
      }

      default:
        throw new HttpsError('invalid-argument', 'Tipe progres tidak dikenal.');
    }
  } catch (err) {
    logger.error('submitProgress error:', err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', 'Gagal menyimpan progres.');
  }
});

// ============================================================
//  createStaffAccount — callable (admin-only)
//  Creates an admin or teacher account with custom claims.
//  Handles partial failure with Auth account rollback.
//  Accepts optional teacherClassIds for teacher role.
// ============================================================
interface CreateStaffData {
  username: string;
  name: string;
  password: string;
  role: 'admin' | 'teacher';
  school?: string;
  teacherClassIds?: string[];
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

  const { username, name, password, role, school, teacherClassIds } = request.data as CreateStaffData;

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
  const validClassIds = isStringArray(teacherClassIds, 30, 50) ? (teacherClassIds as string[]) : [];

  const email = getInternalEmail(username);
  const todayStr = getTodayStr();

  let userRecord: admin.auth.UserRecord | null = null;

  try {
    userRecord = await auth.createUser({ email, password, displayName: name });

    // Set custom claims — include teacherClassIds for teachers
    const claims: Record<string, unknown> = { role };
    if (role === 'teacher') {
      claims.teacherClassIds = validClassIds;
    }
    await auth.setCustomUserClaims(userRecord.uid, claims);

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
        mustChangePassword: true,
        ...(role === 'teacher' ? { teacherClassIds: validClassIds } : {}),
      });
    } catch (firestoreErr) {
      logger.error('Firestore profile creation failed, rolling back Auth account:', firestoreErr);
      try { await auth.deleteUser(userRecord.uid); } catch (delErr) { logger.error('Rollback delete failed:', delErr); }
      throw new HttpsError('internal', 'Gagal membuat profil Firestore. Akun dibatalkan, silakan coba lagi.');
    }

    return { success: true, uid: userRecord.uid };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    const errAny = err as { code?: string };
    if (errAny.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Username sudah digunakan.');
    }
    logger.error('createStaffAccount error:', err);
    throw new HttpsError('internal', 'Gagal membuat akun staf.');
  }
});

// ============================================================
//  setUserRole — callable (admin-only)
//  Changes a user's role via custom claims.
//  Also updates teacherClassIds if role becomes teacher.
// ============================================================
interface SetRoleData {
  uid: string;
  role: 'admin' | 'teacher' | 'student';
  teacherClassIds?: string[];
}

export const setUserRole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Anda harus masuk.');
  }
  const callerRole = (request.auth.token?.role as string) || 'student';
  if (callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Hanya admin yang dapat mengubah role pengguna.');
  }

  const { uid, role, teacherClassIds } = request.data as SetRoleData;
  if (!isNonEmptyString(uid, 128)) {
    throw new HttpsError('invalid-argument', 'UID tidak valid.');
  }
  if (!['admin', 'teacher', 'student'].includes(role)) {
    throw new HttpsError('invalid-argument', 'Role tidak valid. Gunakan: admin, teacher, atau student.');
  }

  const validClassIds = isStringArray(teacherClassIds, 30, 50) ? (teacherClassIds as string[]) : [];

  try {
    const claims: Record<string, unknown> = { role };
    if (role === 'teacher') {
      claims.teacherClassIds = validClassIds;
    }
    await auth.setCustomUserClaims(uid, claims);
    const updateData: Record<string, unknown> = { role };
    if (role === 'teacher') {
      updateData.teacherClassIds = validClassIds;
    }
    await firestore.collection('users').doc(uid).set(updateData, { merge: true });
    return { success: true };
  } catch (err) {
    logger.error('setUserRole error:', err);
    throw new HttpsError('internal', 'Gagal mengubah role pengguna.');
  }
});

// ============================================================
//  assignTeacherClasses — callable (admin-only)
//  Assigns class IDs to a teacher via custom claims.
//  This is the authoritative source for teacher class access.
// ============================================================
interface AssignClassesData {
  uid: string;
  classIds: string[];
}

export const assignTeacherClasses = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Anda harus masuk.');
  }
  const callerRole = (request.auth.token?.role as string) || 'student';
  if (callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Hanya admin yang dapat menetapkan kelas guru.');
  }

  const { uid, classIds } = request.data as AssignClassesData;
  if (!isNonEmptyString(uid, 128)) {
    throw new HttpsError('invalid-argument', 'UID tidak valid.');
  }
  if (!isStringArray(classIds, 30, 50)) {
    throw new HttpsError('invalid-argument', 'classIds tidak valid (maks 30 kelas).');
  }

  try {
    // Verify the target user is a teacher
    const user = await auth.getUser(uid);
    if (user.customClaims?.role !== 'teacher') {
      throw new HttpsError('invalid-argument', 'Target pengguna bukan guru.');
    }

    await auth.setCustomUserClaims(uid, { role: 'teacher', teacherClassIds: classIds });
    await firestore.collection('users').doc(uid).set({ teacherClassIds: classIds }, { merge: true });
    return { success: true };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    logger.error('assignTeacherClasses error:', err);
    throw new HttpsError('internal', 'Gagal menetapkan kelas guru.');
  }
});

// ============================================================
//  changeStudentGrade — callable (admin or teacher)
//  Admin can change any student's grade.
//  Teacher can only change grades for students in their
//  assigned classes (verified via custom claims).
//  Students cannot change their own grade.
// ============================================================
interface ChangeGradeData {
  targetUid: string;
  grade: number;
  section?: string;
  classId?: string;
}

export const changeStudentGrade = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Anda harus masuk.');
  }
  const callerRole = (request.auth.token?.role as string) || 'student';
  if (callerRole !== 'admin' && callerRole !== 'teacher') {
    throw new HttpsError('permission-denied', 'Siswa tidak dapat mengubah kelasnya sendiri.');
  }

  const { targetUid, grade, section, classId } = request.data as ChangeGradeData;
  if (!isNonEmptyString(targetUid, 128)) {
    throw new HttpsError('invalid-argument', 'targetUid tidak valid.');
  }
  const validGrade = clampInt(grade, 1, 6, 4);
  const validSection = (typeof section === 'string' && section.length <= 5) ? section.trim().toUpperCase() : 'A';
  const validClassId = (typeof classId === 'string' && classId.length <= 50) ? classId : `cls-${validGrade}${validSection.toLowerCase()}`;
  const validClassName = `Kelas ${validGrade}${validSection}`;

  try {
    // Teacher authorization: verify student is in their class
    if (callerRole === 'teacher') {
      const studentSnap = await firestore.collection('users').doc(targetUid).get();
      if (!studentSnap.exists) {
        throw new HttpsError('not-found', 'Siswa tidak ditemukan.');
      }
      const studentData = studentSnap.data() as Record<string, unknown>;
      const teacherClassIds = (request.auth.token?.teacherClassIds as string[]) || [];
      const studentClassId = studentData.classId as string;
      if (!studentClassId || !teacherClassIds.includes(studentClassId)) {
        throw new HttpsError('permission-denied', 'Siswa bukan dari kelas yang Anda ampu.');
      }
    }

    await firestore.collection('users').doc(targetUid).set({
      grade: validGrade, gradeLevel: validGrade,
      section: validSection, classId: validClassId, className: validClassName,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return { success: true };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    logger.error('changeStudentGrade error:', err);
    throw new HttpsError('internal', 'Gagal mengubah kelas siswa.');
  }
});

// ============================================================
//  disableUser — callable (admin-only)
//  Disables account + revokes refresh tokens + updates
//  Firestore status. Server-side check in submitProgress
//  also rejects disabled users via auth.getUser().
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
    await auth.updateUser(uid, { disabled: true });
    await auth.revokeRefreshTokens(uid);
    await firestore.collection('users').doc(uid).set({ accountStatus: 'inactive' }, { merge: true });
    return { success: true };
  } catch (err) {
    logger.error('disableUser error:', err);
    throw new HttpsError('internal', 'Gagal menonaktifkan akun.');
  }
});
