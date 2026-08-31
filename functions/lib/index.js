"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.disableUser = exports.changeStudentGrade = exports.assignTeacherClasses = exports.setUserRole = exports.createStaffAccount = exports.submitProgress = exports.setStudentClaimOnCreate = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const identity_1 = require("firebase-functions/identity");
const firebase_functions_1 = require("firebase-functions");
const firestore_1 = require("firebase-admin/firestore");
const options_1 = require("firebase-functions/v2/options");
// Set default region for callable functions — must match frontend's
// getFunctions(app, 'asia-southeast1').  Blocking Auth functions
// (beforeUserCreated) override to us-central1 as required by Identity Platform.
(0, options_1.setGlobalOptions)({ region: 'asia-southeast1', maxInstances: 10 });
const missionRewards_1 = require("./missionRewards");
// Initialize Admin SDK once
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const auth = admin.auth();
// Use the same named Firestore database as the frontend
const FIRESTORE_DB_ID = 'ai-studio-codenusa-deaefbe9-a722-44d6-9e2c-1855cb2c502e';
const firestore = (0, firestore_1.getFirestore)(FIRESTORE_DB_ID);
// ============================================================
//  Validation helpers
// ============================================================
function isNonEmptyString(val, maxLen) {
    return typeof val === 'string' && val.length > 0 && val.length <= maxLen;
}
function isStringArray(val, maxLen, itemMaxLen) {
    return Array.isArray(val) && val.length <= maxLen && val.every((s) => typeof s === 'string' && s.length <= itemMaxLen);
}
function clampInt(val, min, max, fallback) {
    const n = typeof val === 'number' && Number.isFinite(val) ? Math.floor(val) : fallback;
    return Math.max(min, Math.min(max, n));
}
/** Safely extract a number from an unknown Firestore field. */
function num(val, fallback) {
    return typeof val === 'number' && Number.isFinite(val) ? val : fallback;
}
/** Safely extract a string array from an unknown Firestore field. */
function strArr(val) {
    return Array.isArray(val) ? val.filter((s) => typeof s === 'string') : [];
}
function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}
function getYesterdayStr() {
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
exports.setStudentClaimOnCreate = (0, identity_1.beforeUserCreated)({ region: 'us-central1' }, async (event) => {
    // Set the student custom claim. Since this runs before the user is saved,
    // there are no existing claims to check — always set student for public
    // registrations.
    firebase_functions_1.logger.info(`Setting student claim for new user: ${event.data?.uid ?? 'unknown'}`);
    return {
        customClaims: { role: 'student' },
    };
});
exports.submitProgress = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Anda harus masuk untuk menyimpan progres.');
    }
    const uid = request.auth.uid;
    const data = request.data;
    if (!data || typeof data.type !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'Permintaan tidak valid.');
    }
    try {
        // Verify account is still active (server-side check — doesn't rely on
        // frontend logout). Token revocation handles most cases, but a cached
        // token could still arrive within the TTL window.
        const userRecord = await auth.getUser(uid);
        if (userRecord.disabled) {
            throw new https_1.HttpsError('permission-denied', 'Akun dinonaktifkan.');
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
                const missionId = isNonEmptyString(p.missionId, 200) ? p.missionId : null;
                if (!missionId)
                    throw new https_1.HttpsError('invalid-argument', 'missionId tidak valid.');
                // Look up reward config server-side
                const reward = missionRewards_1.MISSION_REWARDS[missionId];
                if (!reward) {
                    throw new https_1.HttpsError('not-found', 'Misi tidak ditemukan dalam konfigurasi server.');
                }
                // Performance metrics from client (range-clamped, not authoritative)
                const stars = clampInt(p.stars, 0, 3, 0);
                const score = clampInt(p.score, 0, 10000, 0);
                const kobiPosition = (typeof p.kobiPosition === 'string' && p.kobiPosition.length <= 50) ? p.kobiPosition : null;
                // Atomic transaction — prevents race condition on duplicate claims
                const result = await firestore.runTransaction(async (tx) => {
                    const snap = await tx.get(userRef);
                    if (!snap.exists)
                        throw new https_1.HttpsError('not-found', 'Profil pengguna tidak ditemukan.');
                    const profile = snap.data();
                    // Idempotency: check if reward already claimed
                    const rewardsClaimed = strArr(profile.rewardsClaimed);
                    if (rewardsClaimed.includes(missionId)) {
                        return { success: true, alreadyClaimed: true, rewardXp: 0, rewardStars: 0, rewardCoins: 0 };
                    }
                    // Compute rewards from server config
                    const xpEarned = reward.rewardXp;
                    const starsEarned = reward.rewardStars;
                    const coinsEarned = reward.rewardCoins;
                    const badgeId = reward.rewardBadgeId || null;
                    const completed = Array.from(new Set([...strArr(profile.completedMissions), missionId]));
                    const updatedClaimed = Array.from(new Set([...rewardsClaimed, missionId]));
                    const existingBadges = strArr(profile.badges);
                    const badges = badgeId && !existingBadges.includes(badgeId) ? [...existingBadges, badgeId] : existingBadges;
                    const newXp = num(profile.xp, 0) + xpEarned;
                    const newLevel = Math.floor(newXp / 250) + 1;
                    const existingScores = (profile.missionScores || {});
                    const prevScore = existingScores[missionId] || {};
                    const missionScores = {
                        ...existingScores,
                        [missionId]: {
                            stars: Math.max(stars, prevScore.stars || 0),
                            score: Math.max(score, prevScore.score || 0),
                            completedAt: new Date().toISOString(),
                        },
                    };
                    const update = {
                        xp: newXp, level: newLevel,
                        stars: num(profile.stars, 0) + starsEarned,
                        coins: num(profile.coins, 0) + coinsEarned,
                        completedMissions: completed, rewardsClaimed: updatedClaimed,
                        badges, missionScores,
                    };
                    if (kobiPosition)
                        update.kobiPosition = kobiPosition;
                    tx.set(userRef, update, { merge: true });
                    return {
                        success: true, alreadyClaimed: false,
                        rewardXp: xpEarned, rewardStars: starsEarned, rewardCoins: coinsEarned,
                        newXp, newStars: num(profile.stars, 0) + starsEarned, newCoins: num(profile.coins, 0) + coinsEarned,
                    };
                });
                return result;
            }
            // ========================================================
            //  daily_claim — rewards from DAILY_MISSION_REWARDS config.
            //  Uses transaction for idempotency.
            // ========================================================
            case 'daily_claim': {
                const p = data.payload;
                const missionId = isNonEmptyString(p.missionId, 200) ? p.missionId : null;
                if (!missionId)
                    throw new https_1.HttpsError('invalid-argument', 'missionId tidak valid.');
                const reward = missionRewards_1.DAILY_MISSION_REWARDS[missionId];
                if (!reward) {
                    throw new https_1.HttpsError('not-found', 'Misi harian tidak ditemukan.');
                }
                const result = await firestore.runTransaction(async (tx) => {
                    const snap = await tx.get(userRef);
                    if (!snap.exists)
                        throw new https_1.HttpsError('not-found', 'Profil pengguna tidak ditemukan.');
                    const profile = snap.data();
                    // Idempotency: check if this daily mission was already claimed today
                    const todayStr = getTodayStr();
                    const dailyClaimed = (profile.dailyClaimed || {});
                    if (dailyClaimed[missionId] === todayStr) {
                        return { success: true, alreadyClaimed: true };
                    }
                    const update = {
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
                const result = await firestore.runTransaction(async (tx) => {
                    const snap = await tx.get(userRef);
                    if (!snap.exists)
                        throw new https_1.HttpsError('not-found', 'Profil pengguna tidak ditemukan.');
                    const profile = snap.data();
                    const todayStr = getTodayStr();
                    const yesterdayStr = getYesterdayStr();
                    const existingHistory = strArr(profile.streakHistory);
                    const lastActiveDate = profile.lastActiveDate;
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
                    let bonusXp = missionRewards_1.STREAK_CHECKIN_BONUS.xp;
                    let bonusCoins = missionRewards_1.STREAK_CHECKIN_BONUS.coins;
                    const newBadgesToAdd = [];
                    for (const milestone of missionRewards_1.STREAK_MILESTONES) {
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
                const result = await firestore.runTransaction(async (tx) => {
                    const snap = await tx.get(userRef);
                    if (!snap.exists)
                        throw new https_1.HttpsError('not-found', 'Profil pengguna tidak ditemukan.');
                    const profile = snap.data();
                    const todayStr = getTodayStr();
                    const yesterdayStr = getYesterdayStr();
                    const existingHistory = strArr(profile.streakHistory);
                    const lastActiveDate = profile.lastActiveDate;
                    const alreadyToday = existingHistory.includes(todayStr) || lastActiveDate === todayStr;
                    let newStreak = num(profile.streakDays, 0);
                    let newHistory = existingHistory;
                    if (!alreadyToday) {
                        if (lastActiveDate === yesterdayStr || (num(profile.streakDays, 0) > 0 && !lastActiveDate)) {
                            newStreak = num(profile.streakDays, 0) + 1;
                        }
                        else {
                            newStreak = 1;
                        }
                        newHistory = Array.from(new Set([...existingHistory, todayStr]));
                    }
                    // Compute milestone bonus from server config
                    const existingBadges = strArr(profile.badges);
                    let bonusXp = 0;
                    let bonusCoins = 0;
                    const newBadgesToAdd = [];
                    for (const milestone of missionRewards_1.STREAK_MILESTONES) {
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
            //  challenge_bonus — SERVER-AUTHORITATIVE rewards.
            //  Client sends ONLY challengeId. Rewards are looked up
            //  from CHALLENGE_REWARDS config. Idempotency via
            //  claimedChallenges array in Firestore transaction.
            // ========================================================
            case 'challenge_bonus': {
                const p = data.payload;
                const challengeId = isNonEmptyString(p.challengeId, 100) ? p.challengeId : null;
                if (!challengeId)
                    throw new https_1.HttpsError('invalid-argument', 'challengeId tidak valid.');
                // Look up reward config server-side — never trust client values
                const reward = missionRewards_1.CHALLENGE_REWARDS[challengeId];
                if (!reward) {
                    throw new https_1.HttpsError('not-found', 'Tantangan tidak ditemukan dalam konfigurasi server.');
                }
                if (!reward.isActive) {
                    throw new https_1.HttpsError('failed-precondition', 'Tantangan tidak aktif.');
                }
                const result = await firestore.runTransaction(async (tx) => {
                    const snap = await tx.get(userRef);
                    if (!snap.exists)
                        throw new https_1.HttpsError('not-found', 'Profil pengguna tidak ditemukan.');
                    const profile = snap.data();
                    // Idempotency: check if challenge reward already claimed
                    const claimedChallenges = strArr(profile.claimedChallenges);
                    if (claimedChallenges.includes(challengeId)) {
                        return { success: true, alreadyClaimed: true };
                    }
                    // Compute rewards from server config
                    const xpEarned = reward.rewardXp;
                    const starsEarned = reward.rewardStars;
                    const coinsEarned = reward.rewardCoins;
                    const newXp = num(profile.xp, 0) + xpEarned;
                    const updatedClaimed = Array.from(new Set([...claimedChallenges, challengeId]));
                    tx.set(userRef, {
                        xp: newXp, level: Math.floor(newXp / 250) + 1,
                        stars: num(profile.stars, 0) + starsEarned,
                        coins: num(profile.coins, 0) + coinsEarned,
                        claimedChallenges: updatedClaimed,
                    }, { merge: true });
                    return { success: true, alreadyClaimed: false };
                });
                return result;
            }
            default:
                throw new https_1.HttpsError('invalid-argument', 'Tipe progres tidak dikenal.');
        }
    }
    catch (err) {
        firebase_functions_1.logger.error('submitProgress error:', err);
        if (err instanceof https_1.HttpsError)
            throw err;
        throw new https_1.HttpsError('internal', 'Gagal menyimpan progres.');
    }
});
function getInternalEmail(username) {
    return `${username.trim().toLowerCase()}@siswa.codenusa.internal`;
}
exports.createStaffAccount = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Anda harus masuk.');
    }
    const callerRole = request.auth.token?.role || 'student';
    if (callerRole !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Hanya admin yang dapat membuat akun staf.');
    }
    const { username, name, password, role, school, teacherClassIds } = request.data;
    if (!isNonEmptyString(username, 50)) {
        throw new https_1.HttpsError('invalid-argument', 'Username wajib diisi (maks 50 karakter).');
    }
    if (!isNonEmptyString(name, 100)) {
        throw new https_1.HttpsError('invalid-argument', 'Nama wajib diisi (maks 100 karakter).');
    }
    if (!isNonEmptyString(password, 200) || password.length < 8) {
        throw new https_1.HttpsError('invalid-argument', 'Kata sandi minimal 8 karakter.');
    }
    if (role !== 'admin' && role !== 'teacher') {
        throw new https_1.HttpsError('invalid-argument', 'Role harus admin atau teacher.');
    }
    const validClassIds = isStringArray(teacherClassIds, 30, 50) ? teacherClassIds : [];
    const email = getInternalEmail(username);
    const todayStr = getTodayStr();
    let userRecord = null;
    try {
        userRecord = await auth.createUser({ email, password, displayName: name });
        // Set custom claims — include teacherClassIds for teachers
        const claims = { role };
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
        }
        catch (firestoreErr) {
            firebase_functions_1.logger.error('Firestore profile creation failed, rolling back Auth account:', firestoreErr);
            try {
                await auth.deleteUser(userRecord.uid);
            }
            catch (delErr) {
                firebase_functions_1.logger.error('Rollback delete failed:', delErr);
            }
            throw new https_1.HttpsError('internal', 'Gagal membuat profil Firestore. Akun dibatalkan, silakan coba lagi.');
        }
        return { success: true, uid: userRecord.uid };
    }
    catch (err) {
        if (err instanceof https_1.HttpsError)
            throw err;
        const errAny = err;
        if (errAny.code === 'auth/email-already-exists') {
            throw new https_1.HttpsError('already-exists', 'Username sudah digunakan.');
        }
        firebase_functions_1.logger.error('createStaffAccount error:', err);
        throw new https_1.HttpsError('internal', 'Gagal membuat akun staf.');
    }
});
exports.setUserRole = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Anda harus masuk.');
    }
    const callerRole = request.auth.token?.role || 'student';
    if (callerRole !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Hanya admin yang dapat mengubah role pengguna.');
    }
    const { uid, role, teacherClassIds } = request.data;
    if (!isNonEmptyString(uid, 128)) {
        throw new https_1.HttpsError('invalid-argument', 'UID tidak valid.');
    }
    if (!['admin', 'teacher', 'student'].includes(role)) {
        throw new https_1.HttpsError('invalid-argument', 'Role tidak valid. Gunakan: admin, teacher, atau student.');
    }
    const validClassIds = isStringArray(teacherClassIds, 30, 50) ? teacherClassIds : [];
    try {
        // Preserve ALL existing custom claims — only update role + teacherClassIds
        const user = await auth.getUser(uid);
        const existingClaims = (user.customClaims || {});
        const claims = { ...existingClaims, role };
        if (role === 'teacher') {
            claims.teacherClassIds = validClassIds;
        }
        else if ('teacherClassIds' in claims) {
            // Remove teacherClassIds when demoting away from teacher
            delete claims.teacherClassIds;
        }
        await auth.setCustomUserClaims(uid, claims);
        const updateData = { role };
        if (role === 'teacher') {
            updateData.teacherClassIds = validClassIds;
        }
        await firestore.collection('users').doc(uid).set(updateData, { merge: true });
        return { success: true };
    }
    catch (err) {
        firebase_functions_1.logger.error('setUserRole error:', err);
        throw new https_1.HttpsError('internal', 'Gagal mengubah role pengguna.');
    }
});
exports.assignTeacherClasses = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Anda harus masuk.');
    }
    const callerRole = request.auth.token?.role || 'student';
    if (callerRole !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Hanya admin yang dapat menetapkan kelas guru.');
    }
    const { uid, classIds } = request.data;
    if (!isNonEmptyString(uid, 128)) {
        throw new https_1.HttpsError('invalid-argument', 'UID tidak valid.');
    }
    if (!isStringArray(classIds, 30, 50)) {
        throw new https_1.HttpsError('invalid-argument', 'classIds tidak valid (maks 30 kelas).');
    }
    try {
        // Verify the target user is a teacher
        const user = await auth.getUser(uid);
        if (user.customClaims?.role !== 'teacher') {
            throw new https_1.HttpsError('invalid-argument', 'Target pengguna bukan guru.');
        }
        await auth.setCustomUserClaims(uid, { role: 'teacher', teacherClassIds: classIds });
        await firestore.collection('users').doc(uid).set({ teacherClassIds: classIds }, { merge: true });
        return { success: true };
    }
    catch (err) {
        if (err instanceof https_1.HttpsError)
            throw err;
        firebase_functions_1.logger.error('assignTeacherClasses error:', err);
        throw new https_1.HttpsError('internal', 'Gagal menetapkan kelas guru.');
    }
});
exports.changeStudentGrade = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Anda harus masuk.');
    }
    const callerRole = request.auth.token?.role || 'student';
    if (callerRole !== 'admin' && callerRole !== 'teacher') {
        throw new https_1.HttpsError('permission-denied', 'Siswa tidak dapat mengubah kelasnya sendiri.');
    }
    const { targetUid, grade, section, classId } = request.data;
    if (!isNonEmptyString(targetUid, 128)) {
        throw new https_1.HttpsError('invalid-argument', 'targetUid tidak valid.');
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
                throw new https_1.HttpsError('not-found', 'Siswa tidak ditemukan.');
            }
            const studentData = studentSnap.data();
            const teacherClassIds = request.auth.token?.teacherClassIds || [];
            const studentClassId = studentData.classId;
            if (!studentClassId || !teacherClassIds.includes(studentClassId)) {
                throw new https_1.HttpsError('permission-denied', 'Siswa bukan dari kelas yang Anda ampu.');
            }
        }
        await firestore.collection('users').doc(targetUid).set({
            grade: validGrade, gradeLevel: validGrade,
            section: validSection, classId: validClassId, className: validClassName,
            updatedAt: new Date().toISOString(),
        }, { merge: true });
        return { success: true };
    }
    catch (err) {
        if (err instanceof https_1.HttpsError)
            throw err;
        firebase_functions_1.logger.error('changeStudentGrade error:', err);
        throw new https_1.HttpsError('internal', 'Gagal mengubah kelas siswa.');
    }
});
exports.disableUser = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Anda harus masuk.');
    }
    const callerRole = request.auth.token?.role || 'student';
    if (callerRole !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Hanya admin yang dapat menonaktifkan akun.');
    }
    const { uid } = request.data;
    if (!isNonEmptyString(uid, 128)) {
        throw new https_1.HttpsError('invalid-argument', 'UID tidak valid.');
    }
    if (uid === request.auth.uid) {
        throw new https_1.HttpsError('invalid-argument', 'Anda tidak dapat menonaktifkan akun sendiri.');
    }
    try {
        await auth.updateUser(uid, { disabled: true });
        await auth.revokeRefreshTokens(uid);
        await firestore.collection('users').doc(uid).set({ accountStatus: 'inactive' }, { merge: true });
        return { success: true };
    }
    catch (err) {
        firebase_functions_1.logger.error('disableUser error:', err);
        throw new https_1.HttpsError('internal', 'Gagal menonaktifkan akun.');
    }
});
//# sourceMappingURL=index.js.map