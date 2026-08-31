"use strict";
/**
 * Server-side authoritative reward configuration.
 *
 * The client NEVER sends reward values (xpEarned, starsEarned, coinsEarned, badgeId).
 * It only sends identifiers (missionId, dailyMissionId). The Cloud Function
 * looks up the rewards from this config and applies them.
 *
 * For a fully dynamic setup these could live in a Firestore `missionConfig`
 * collection, but for CodeNusa's fixed curriculum this constant map is the
 * most reliable source — it deploys with the function and cannot be modified
 * by any client.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHALLENGE_REWARDS = exports.STREAK_CHECKIN_BONUS = exports.STREAK_MILESTONES = exports.DAILY_MISSION_REWARDS = exports.MISSION_REWARDS = void 0;
exports.MISSION_REWARDS = {
    'm-g4-c1-m1': { rewardXp: 50, rewardStars: 3, rewardCoins: 20, rewardBadgeId: 'badge-first-code' },
    'm-g4-c1-m2': { rewardXp: 80, rewardStars: 3, rewardCoins: 30 },
    'm-g4-c1-m3': { rewardXp: 100, rewardStars: 3, rewardCoins: 40 },
    'm-g4-c1-m4': { rewardXp: 150, rewardStars: 3, rewardCoins: 50, rewardBadgeId: 'badge-hardware-master' },
    'm-g4-c1-m5': { rewardXp: 180, rewardStars: 3, rewardCoins: 50 },
    'm-g4-c2-m1': { rewardXp: 120, rewardStars: 3, rewardCoins: 40 },
};
exports.DAILY_MISSION_REWARDS = {
    'dm-1': { rewardStars: 10, rewardCoins: 15 },
    'dm-2': { rewardStars: 20, rewardCoins: 25 },
    'dm-3': { rewardStars: 50, rewardCoins: 50 },
    'dm-4': { rewardStars: 0, rewardCoins: 0 },
};
/** Streak milestone bonuses — computed server-side, never from client. */
exports.STREAK_MILESTONES = [
    { days: 3, badgeId: 'badge-streak-3', bonusXp: 100, bonusCoins: 50 },
    { days: 7, badgeId: 'badge-streak-7', bonusXp: 250, bonusCoins: 150 },
    { days: 14, badgeId: 'badge-streak-14', bonusXp: 500, bonusCoins: 300 },
];
/** Base streak check-in bonus (awarded on every new day check-in). */
exports.STREAK_CHECKIN_BONUS = { xp: 50, coins: 30 };
exports.CHALLENGE_REWARDS = {
    'ch-easy-1': { rewardXp: 35, rewardStars: 2, rewardCoins: 20, isActive: true },
    'ch-easy-2': { rewardXp: 35, rewardStars: 2, rewardCoins: 20, isActive: true },
    'ch-easy-3': { rewardXp: 40, rewardStars: 2, rewardCoins: 20, isActive: true },
    'ch-med-1': { rewardXp: 60, rewardStars: 3, rewardCoins: 30, isActive: true },
    'ch-med-2': { rewardXp: 65, rewardStars: 3, rewardCoins: 30, isActive: true },
    'ch-med-3': { rewardXp: 65, rewardStars: 3, rewardCoins: 30, isActive: true },
    'ch-hard-1': { rewardXp: 100, rewardStars: 5, rewardCoins: 50, isActive: true },
    'ch-hard-2': { rewardXp: 110, rewardStars: 5, rewardCoins: 50, isActive: true },
    'ch-hard-3': { rewardXp: 120, rewardStars: 5, rewardCoins: 50, isActive: true },
};
//# sourceMappingURL=missionRewards.js.map