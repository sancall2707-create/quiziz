/**
 * CodeNusa Cloud Functions — Security-Hardened (Realtime Database)
 *
 * Key security principles:
 *   - Identity ALWAYS from request.auth.uid — never from request body.
 *   - Rewards computed server-side from missionRewards config.
 *   - Idempotency via Realtime Database transactions.
 *   - Teacher authorization via custom claims (teacherClassIds).
 *   - Disabled accounts rejected server-side.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { beforeUserCreated } from 'firebase-functions/identity';
import { logger } from 'firebase-functions';
import { setGlobalOptions } from 'firebase-functions/v2/options';

setGlobalOptions({ region: 'asia-southeast1', maxInstances: 10 });
import {
  MISSION_REWARDS,
  DAILY_MISSION_REWARDS,
  STREAK_MILESTONES,
  STREAK_CHECKIN_BONUS,
  CHALLENGE_REWARDS,
} from './missionRewards';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const auth = admin.auth();
const rtdb = admin.database();

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
function num(val: unknown, fallback: number): number {
  return typeof val === 'number' && Number.isFinite(val) ? val : fallback;
}
function strArr(val: unknown): string[] {
  return Array.isArray(val) ? val.filter((s): s is string => typeof s === 'string') : [];
}
function getTodayStr(): string { return new Date().toISOString().split('T')[0]; }
function getYesterdayStr(): string {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// ============================================================
//  beforeUserCreated — sets student custom claim
// ============================================================
export const setStudentClaimOnCreate = beforeUserCreated(
  { region: 'us-central1' },
  async (event) => {
    logger.info(`Setting student claim for new user: ${event.data?.uid ?? 'unknown'}`);
    return { customClaims: { role: 'student' } };
  });

// ============================================================
//  submitProgress — callable: server-authoritative rewards
// ============================================================
interface ProgressPayload {
  type: 'mission_complete' | 'daily_claim' | 'streak_checkin' | 'daily_activity' | 'challenge_bonus';
  payload: Record<string, unknown>;
}

export const submitProgress = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Anda harus masuk untuk menyimpan progres.');
  const uid = request.auth.uid;
  const data = request.data as ProgressPayload;
  if (!data || typeof data.type !== 'string') throw new HttpsError('invalid-argument', 'Permintaan tidak valid.');

  try {
    const userRecord = await auth.getUser(uid);
    if (userRecord.disabled) throw new HttpsError('permission-denied', 'Akun dinonaktifkan.');

    const userRef = rtdb.ref('users/' + uid);

    switch (data.type) {
      case 'mission_complete': {
        const p = data.payload;
        const missionId = isNonEmptyString(p.missionId, 200) ? (p.missionId as string) : null;
        if (!missionId) throw new HttpsError('invalid-argument', 'missionId tidak valid.');
        const reward = MISSION_REWARDS[missionId];
        if (!reward) throw new HttpsError('not-found', 'Misi tidak ditemukan dalam konfigurasi server.');

        const stars = clampInt(p.stars, 0, 3, 0);
        const score = clampInt(p.score, 0, 10000, 0);
        const kobiPosition = (typeof p.kobiPosition === 'string' && p.kobiPosition.length <= 50) ? p.kobiPosition : null;

        let alreadyClaimed = false;
        let notFound = false;
        const txResult = await userRef.transaction((profile: Record<string, unknown> | null) => {
          if (!profile) { notFound = true; return profile; }
          const rewardsClaimed = strArr(profile.rewardsClaimed);
          if (rewardsClaimed.includes(missionId)) { alreadyClaimed = true; return profile; }

          const xpEarned = reward.rewardXp;
          const starsEarned = reward.rewardStars;
          const coinsEarned = reward.rewardCoins;
          const badgeId = reward.rewardBadgeId || null;
          const completed = Array.from(new Set([...strArr(profile.completedMissions), missionId]));
          const updatedClaimed = Array.from(new Set([...rewardsClaimed, missionId]));
          const existingBadges = strArr(profile.badges);
          const badges = badgeId && !existingBadges.includes(badgeId) ? [...existingBadges, badgeId] : existingBadges;
          const newXp = num(profile.xp, 0) + xpEarned;
          const existingScores = (profile.missionScores || {}) as Record<string, unknown>;
          const prevScore = (existingScores[missionId] as { stars?: number; score?: number }) || {};
          return {
            ...profile,
            xp: newXp, level: Math.floor(newXp / 250) + 1,
            stars: num(profile.stars, 0) + starsEarned, coins: num(profile.coins, 0) + coinsEarned,
            completedMissions: completed, rewardsClaimed: updatedClaimed, badges,
            missionScores: { ...existingScores, [missionId]: { stars: Math.max(stars, prevScore.stars || 0), score: Math.max(score, prevScore.score || 0), completedAt: new Date().toISOString() } },
            ...(kobiPosition ? { kobiPosition } : {}),
          };
        });

        if (notFound) throw new HttpsError('not-found', 'Profil pengguna tidak ditemukan.');
        if (alreadyClaimed) return { success: true, alreadyClaimed: true, rewardXp: 0, rewardStars: 0, rewardCoins: 0 };
        const updated = txResult.snapshot.val() as Record<string, unknown>;
        return { success: true, alreadyClaimed: false, rewardXp: reward.rewardXp, rewardStars: reward.rewardStars, rewardCoins: reward.rewardCoins, newXp: updated.xp, newStars: updated.stars, newCoins: updated.coins };
      }

      case 'daily_claim': {
        const p = data.payload;
        const missionId = isNonEmptyString(p.missionId, 200) ? (p.missionId as string) : null;
        if (!missionId) throw new HttpsError('invalid-argument', 'missionId tidak valid.');
        const reward = DAILY_MISSION_REWARDS[missionId];
        if (!reward) throw new HttpsError('not-found', 'Misi harian tidak ditemukan.');

        let alreadyClaimed = false;
        let notFound = false;
        await userRef.transaction((profile: Record<string, unknown> | null) => {
          if (!profile) { notFound = true; return profile; }
          const todayStr = getTodayStr();
          const dailyClaimed = (profile.dailyClaimed || {}) as Record<string, string>;
          if (dailyClaimed[missionId] === todayStr) { alreadyClaimed = true; return profile; }
          return { ...profile, stars: num(profile.stars, 0) + reward.rewardStars, coins: num(profile.coins, 0) + reward.rewardCoins, dailyClaimed: { ...dailyClaimed, [missionId]: todayStr } };
        });

        if (notFound) throw new HttpsError('not-found', 'Profil pengguna tidak ditemukan.');
        if (alreadyClaimed) return { success: true, alreadyClaimed: true };
        return { success: true, alreadyClaimed: false };
      }

      case 'streak_checkin': {
        let alreadyClaimed = false;
        let notFound = false;
        let newStreak = 0;
        await userRef.transaction((profile: Record<string, unknown> | null) => {
          if (!profile) { notFound = true; return profile; }
          const todayStr = getTodayStr();
          const yesterdayStr = getYesterdayStr();
          const existingHistory = strArr(profile.streakHistory);
          const lastActiveDate = profile.lastActiveDate as string | undefined;
          if (existingHistory.includes(todayStr) || lastActiveDate === todayStr) { alreadyClaimed = true; return profile; }

          newStreak = (lastActiveDate === yesterdayStr || (num(profile.streakDays, 0) > 0 && !lastActiveDate)) ? num(profile.streakDays, 0) + 1 : 1;
          const newHistory = Array.from(new Set([...existingHistory, todayStr]));
          const existingBadges = strArr(profile.badges);
          let bonusXp = STREAK_CHECKIN_BONUS.xp, bonusCoins = STREAK_CHECKIN_BONUS.coins;
          const newBadges: string[] = [];
          for (const m of STREAK_MILESTONES) {
            if (newStreak >= m.days && !existingBadges.includes(m.badgeId)) { newBadges.push(m.badgeId); bonusXp += m.bonusXp; bonusCoins += m.bonusCoins; }
          }
          return { ...profile, streakDays: newStreak, streakHistory: newHistory, lastActiveDate: todayStr, lastActive: 'Hari ini', xp: num(profile.xp, 0) + bonusXp, coins: num(profile.coins, 0) + bonusCoins, badges: [...existingBadges, ...newBadges] };
        });

        if (notFound) throw new HttpsError('not-found', 'Profil pengguna tidak ditemukan.');
        if (alreadyClaimed) return { success: true, alreadyClaimed: true };
        return { success: true, alreadyClaimed: false, streakDays: newStreak };
      }

      case 'daily_activity': {
        let notFound = false;
        await userRef.transaction((profile: Record<string, unknown> | null) => {
          if (!profile) { notFound = true; return profile; }
          const todayStr = getTodayStr();
          const yesterdayStr = getYesterdayStr();
          const existingHistory = strArr(profile.streakHistory);
          const lastActiveDate = profile.lastActiveDate as string | undefined;
          const alreadyToday = existingHistory.includes(todayStr) || lastActiveDate === todayStr;
          let newStreak = num(profile.streakDays, 0);
          let newHistory = existingHistory;
          if (!alreadyToday) {
            newStreak = (lastActiveDate === yesterdayStr || (num(profile.streakDays, 0) > 0 && !lastActiveDate)) ? num(profile.streakDays, 0) + 1 : 1;
            newHistory = Array.from(new Set([...existingHistory, todayStr]));
          }
          const existingBadges = strArr(profile.badges);
          let bonusXp = 0, bonusCoins = 0;
          const newBadges: string[] = [];
          for (const m of STREAK_MILESTONES) {
            if (newStreak >= m.days && !existingBadges.includes(m.badgeId)) { newBadges.push(m.badgeId); bonusXp += m.bonusXp; bonusCoins += m.bonusCoins; }
          }
          return { ...profile, streakDays: newStreak, streakHistory: newHistory, lastActiveDate: todayStr, lastActive: 'Hari ini', xp: num(profile.xp, 0) + bonusXp, coins: num(profile.coins, 0) + bonusCoins, badges: [...existingBadges, ...newBadges] };
        });

        if (notFound) throw new HttpsError('not-found', 'Profil pengguna tidak ditemukan.');
        return { success: true };
      }

      case 'challenge_bonus': {
        const p = data.payload;
        const challengeId = isNonEmptyString(p.challengeId, 100) ? (p.challengeId as string) : null;
        if (!challengeId) throw new HttpsError('invalid-argument', 'challengeId tidak valid.');
        const reward = CHALLENGE_REWARDS[challengeId];
        if (!reward) throw new HttpsError('not-found', 'Tantangan tidak ditemukan dalam konfigurasi server.');
        if (!reward.isActive) throw new HttpsError('failed-precondition', 'Tantangan tidak aktif.');

        let alreadyClaimed = false;
        let notFound = false;
        const txResult = await userRef.transaction((profile: Record<string, unknown> | null) => {
          if (!profile) { notFound = true; return profile; }
          const claimedChallenges = strArr(profile.claimedChallenges);
          if (claimedChallenges.includes(challengeId)) { alreadyClaimed = true; return profile; }

          const xpEarned = reward.rewardXp;
          const starsEarned = reward.rewardStars;
          const coinsEarned = reward.rewardCoins;
          const newXp = num(profile.xp, 0) + xpEarned;
          return { ...profile, xp: newXp, level: Math.floor(newXp / 250) + 1, stars: num(profile.stars, 0) + starsEarned, coins: num(profile.coins, 0) + coinsEarned, claimedChallenges: Array.from(new Set([...claimedChallenges, challengeId])) };
        });

        if (notFound) throw new HttpsError('not-found', 'Profil pengguna tidak ditemukan.');
        if (alreadyClaimed) return { success: true, alreadyClaimed: true, rewardXp: 0, rewardStars: 0, rewardCoins: 0 };
        const updated = txResult.snapshot.val() as Record<string, unknown>;
        return { success: true, alreadyClaimed: false, rewardXp: reward.rewardXp, rewardStars: reward.rewardStars, rewardCoins: reward.rewardCoins, newXp: updated.xp, newStars: updated.stars, newCoins: updated.coins };
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
// ============================================================
interface CreateStaffData {
  username: string; name: string; password: string;
  role: 'admin' | 'teacher'; school?: string; teacherClassIds?: string[];
}
function getInternalEmail(username: string): string {
  return `${username.trim().toLowerCase()}@siswa.codenusa.internal`;
}

export const createStaffAccount = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Anda harus masuk.');
  if ((request.auth.token?.role as string) !== 'admin') throw new HttpsError('permission-denied', 'Hanya admin yang dapat membuat akun staf.');

  const { username, name, password, role, school, teacherClassIds } = request.data as CreateStaffData;
  if (!isNonEmptyString(username, 50)) throw new HttpsError('invalid-argument', 'Username wajib diisi (maks 50 karakter).');
  if (!isNonEmptyString(name, 100)) throw new HttpsError('invalid-argument', 'Nama wajib diisi (maks 100 karakter).');
  if (!isNonEmptyString(password, 200) || password.length < 8) throw new HttpsError('invalid-argument', 'Kata sandi minimal 8 karakter.');
  if (role !== 'admin' && role !== 'teacher') throw new HttpsError('invalid-argument', 'Role harus admin atau teacher.');
  const validClassIds = isStringArray(teacherClassIds, 30, 50) ? (teacherClassIds as string[]) : [];

  const email = getInternalEmail(username);
  const todayStr = getTodayStr();

  try {
    const userRecord = await auth.createUser({ email, password, displayName: name });
    const claims: Record<string, unknown> = { role };
    if (role === 'teacher') claims.teacherClassIds = validClassIds;
    await auth.setCustomUserClaims(userRecord.uid, claims);

    try {
      await rtdb.ref('users/' + userRecord.uid).set({
        id: userRecord.uid, name, fullName: name, username: username.trim().toLowerCase(),
        role, email: null, avatar: '', grade: 4,
        school: school || (role === 'admin' ? 'Pusat Kurikulum CodeNusa' : 'SD Harapan Nusantara'),
        accountStatus: 'active', createdAt: new Date().toISOString(),
        xp: 0, level: 1, stars: 0, coins: 0,
        streakDays: 1, streakHistory: [todayStr], lastActive: 'Hari ini', lastActiveDate: todayStr,
        badges: ['badge-mastery'], completedMissions: [], rewardsClaimed: [], missionScores: {},
        kobiPosition: 'node-1',
        kobiCustomization: role === 'admin' ? { skin: 'gold-champion', hat: 'crown', accessory: 'cyber-goggles' } : { skin: 'blue-classic', hat: 'none', accessory: 'none' },
        settings: { soundEnabled: true, narrationVoiceEnabled: false, reduceMotion: false, highContrast: false, dyslexicFont: false, fontSize: 'normal' },
        mustChangePassword: true,
        ...(role === 'teacher' ? { teacherClassIds: validClassIds } : {}),
      });
      if (role === 'teacher' && validClassIds.length > 0) {
        const idx: Record<string, boolean> = {};
        validClassIds.forEach((cid) => { idx[cid] = true; });
        await rtdb.ref('teacherClasses/' + userRecord.uid).set(idx);
      }
    } catch (rtdbErr) {
      logger.error('RTDB profile creation failed, rolling back:', rtdbErr);
      try { await auth.deleteUser(userRecord.uid); } catch (e) { logger.error('Rollback failed:', e); }
      throw new HttpsError('internal', 'Gagal membuat profil. Akun dibatalkan, silakan coba lagi.');
    }
    return { success: true, uid: userRecord.uid };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    if ((err as { code?: string }).code === 'auth/email-already-exists') throw new HttpsError('already-exists', 'Username sudah digunakan.');
    logger.error('createStaffAccount error:', err);
    throw new HttpsError('internal', 'Gagal membuat akun staf.');
  }
});

// ============================================================
//  setUserRole — callable (admin-only)
// ============================================================
interface SetRoleData { uid: string; role: 'admin' | 'teacher' | 'student'; teacherClassIds?: string[]; }

export const setUserRole = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Anda harus masuk.');
  if ((request.auth.token?.role as string) !== 'admin') throw new HttpsError('permission-denied', 'Hanya admin yang dapat mengubah role pengguna.');

  const { uid, role, teacherClassIds } = request.data as SetRoleData;
  if (!isNonEmptyString(uid, 128)) throw new HttpsError('invalid-argument', 'UID tidak valid.');
  if (!['admin', 'teacher', 'student'].includes(role)) throw new HttpsError('invalid-argument', 'Role tidak valid.');
  const validClassIds = isStringArray(teacherClassIds, 30, 50) ? (teacherClassIds as string[]) : [];

  try {
    const user = await auth.getUser(uid);
    const existingClaims = (user.customClaims || {}) as Record<string, unknown>;
    const claims: Record<string, unknown> = { ...existingClaims, role };
    if (role === 'teacher') claims.teacherClassIds = validClassIds;
    else if ('teacherClassIds' in claims) delete claims.teacherClassIds;
    await auth.setCustomUserClaims(uid, claims);

    const updateData: Record<string, unknown> = { role };
    if (role === 'teacher') updateData.teacherClassIds = validClassIds;
    await rtdb.ref('users/' + uid).update(updateData);

    if (role === 'teacher' && validClassIds.length > 0) {
      const idx: Record<string, boolean> = {};
      validClassIds.forEach((cid) => { idx[cid] = true; });
      await rtdb.ref('teacherClasses/' + uid).set(idx);
    } else {
      await rtdb.ref('teacherClasses/' + uid).remove();
    }
    return { success: true };
  } catch (err) {
    logger.error('setUserRole error:', err);
    throw new HttpsError('internal', 'Gagal mengubah role pengguna.');
  }
});

// ============================================================
//  assignTeacherClasses — callable (admin-only)
// ============================================================
interface AssignClassesData { uid: string; classIds: string[]; }

export const assignTeacherClasses = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Anda harus masuk.');
  if ((request.auth.token?.role as string) !== 'admin') throw new HttpsError('permission-denied', 'Hanya admin yang dapat menetapkan kelas guru.');

  const { uid, classIds } = request.data as AssignClassesData;
  if (!isNonEmptyString(uid, 128)) throw new HttpsError('invalid-argument', 'UID tidak valid.');
  if (!isStringArray(classIds, 30, 50)) throw new HttpsError('invalid-argument', 'classIds tidak valid.');

  try {
    const user = await auth.getUser(uid);
    if (user.customClaims?.role !== 'teacher') throw new HttpsError('invalid-argument', 'Target pengguna bukan guru.');

    await auth.setCustomUserClaims(uid, { role: 'teacher', teacherClassIds: classIds });
    await rtdb.ref('users/' + uid).update({ teacherClassIds: classIds });

    const idx: Record<string, boolean> = {};
    classIds.forEach((cid) => { idx[cid] = true; });
    await rtdb.ref('teacherClasses/' + uid).set(idx);
    return { success: true };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    logger.error('assignTeacherClasses error:', err);
    throw new HttpsError('internal', 'Gagal menetapkan kelas guru.');
  }
});

// ============================================================
//  changeStudentGrade — callable (admin or teacher)
// ============================================================
interface ChangeGradeData { targetUid: string; grade: number; section?: string; classId?: string; }

export const changeStudentGrade = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Anda harus masuk.');
  const callerRole = (request.auth.token?.role as string) || 'student';
  if (callerRole !== 'admin' && callerRole !== 'teacher') throw new HttpsError('permission-denied', 'Siswa tidak dapat mengubah kelasnya sendiri.');

  const { targetUid, grade, section, classId } = request.data as ChangeGradeData;
  if (!isNonEmptyString(targetUid, 128)) throw new HttpsError('invalid-argument', 'targetUid tidak valid.');
  const validGrade = clampInt(grade, 1, 6, 4);
  const validSection = (typeof section === 'string' && section.length <= 5) ? section.trim().toUpperCase() : 'A';
  const validClassId = (typeof classId === 'string' && classId.length <= 50) ? classId : `cls-${validGrade}${validSection.toLowerCase()}`;
  const validClassName = `Kelas ${validGrade}${validSection}`;

  try {
    if (callerRole === 'teacher') {
      const studentSnap = await rtdb.ref('users/' + targetUid).get();
      if (!studentSnap.exists()) throw new HttpsError('not-found', 'Siswa tidak ditemukan.');
      const studentData = studentSnap.val() as Record<string, unknown>;
      const callerClassIds = (request.auth.token?.teacherClassIds as string[]) || [];
      if (!callerClassIds.includes(studentData.classId as string)) throw new HttpsError('permission-denied', 'Siswa bukan di kelas yang ditugaskan kepada Anda.');
    }

    const oldSnap = await rtdb.ref('users/' + targetUid).get();
    if (oldSnap.exists()) {
      const oldData = oldSnap.val() as Record<string, unknown>;
      const oldClassId = oldData.classId as string;
      if (oldClassId && oldClassId !== validClassId) {
        await rtdb.ref('classStudents/' + oldClassId + '/' + targetUid).remove();
      }
    }

    await rtdb.ref('users/' + targetUid).update({ grade: validGrade, gradeLevel: validGrade, section: validSection, classId: validClassId, className: validClassName, updatedAt: new Date().toISOString() });
    await rtdb.ref('classStudents/' + validClassId + '/' + targetUid).set(true);
    return { success: true };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    logger.error('changeStudentGrade error:', err);
    throw new HttpsError('internal', 'Gagal mengubah kelas siswa.');
  }
});

// ============================================================
//  disableUser — callable (admin-only)
// ============================================================
interface DisableUserData { uid: string; }

export const disableUser = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Anda harus masuk.');
  if ((request.auth.token?.role as string) !== 'admin') throw new HttpsError('permission-denied', 'Hanya admin yang dapat menonaktifkan akun.');

  const { uid } = request.data as DisableUserData;
  if (!isNonEmptyString(uid, 128)) throw new HttpsError('invalid-argument', 'UID tidak valid.');
  if (uid === request.auth.uid) throw new HttpsError('invalid-argument', 'Anda tidak dapat menonaktifkan akun sendiri.');

  try {
    await auth.updateUser(uid, { disabled: true });
    await auth.revokeRefreshTokens(uid);
    await rtdb.ref('users/' + uid).update({ accountStatus: 'inactive' });
    return { success: true };
  } catch (err) {
    logger.error('disableUser error:', err);
    throw new HttpsError('internal', 'Gagal menonaktifkan akun.');
  }
});
