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

export interface MissionReward {
  rewardXp: number;
  rewardStars: number;
  rewardCoins: number;
  rewardBadgeId?: string;
}

export const MISSION_REWARDS: Record<string, MissionReward> = {
  'm-g4-c1-m1': { rewardXp: 50,  rewardStars: 3, rewardCoins: 20, rewardBadgeId: 'badge-first-code' },
  'm-g4-c1-m2': { rewardXp: 80,  rewardStars: 3, rewardCoins: 30 },
  'm-g4-c1-m3': { rewardXp: 100, rewardStars: 3, rewardCoins: 40 },
  'm-g4-c1-m4': { rewardXp: 150, rewardStars: 3, rewardCoins: 50, rewardBadgeId: 'badge-hardware-master' },
  'm-g4-c1-m5': { rewardXp: 180, rewardStars: 3, rewardCoins: 50 },
  'm-g4-c2-m1': { rewardXp: 120, rewardStars: 3, rewardCoins: 40 },
};

export interface DailyMissionReward {
  rewardStars: number;
  rewardCoins: number;
}

export const DAILY_MISSION_REWARDS: Record<string, DailyMissionReward> = {
  'dm-1': { rewardStars: 10, rewardCoins: 15 },
  'dm-2': { rewardStars: 20, rewardCoins: 25 },
  'dm-3': { rewardStars: 50, rewardCoins: 50 },
  'dm-4': { rewardStars: 0,  rewardCoins: 0 },
};

/** Streak milestone bonuses — computed server-side, never from client. */
export const STREAK_MILESTONES: Array<{ days: number; badgeId: string; bonusXp: number; bonusCoins: number }> = [
  { days: 3,  badgeId: 'badge-streak-3',  bonusXp: 100, bonusCoins: 50 },
  { days: 7,  badgeId: 'badge-streak-7',  bonusXp: 250, bonusCoins: 150 },
  { days: 14, badgeId: 'badge-streak-14', bonusXp: 500, bonusCoins: 300 },
];

/** Base streak check-in bonus (awarded on every new day check-in). */
export const STREAK_CHECKIN_BONUS = { xp: 50, coins: 30 };

/** Challenge bonus safety limits — client values are clamped to these bounds. */
export const CHALLENGE_LIMITS = { maxStars: 100, maxXp: 1000, maxCoins: 1000 };
