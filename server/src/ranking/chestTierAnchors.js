import { computeChestScore } from "./chestRanking.js";

export const CHEST_MULTIPLIER = 1.2; 

// Tiers in strict rank order
export const CHEST_TIERS_IN_ORDER = [
  "Untrained",
  "Recruit",
  "Novice",
  "Warrior",
  "Heroic",
  "Champion",
  "Titan",
  "Olympian",
  "Divine",
  "Celestial",
  "Immortal",
  "Primordial",
];

// Strength anchors for each tier
export const CHEST_TIER_ANCHORS = {
  Untrained: null,

  Recruit: {
    bench:      { weight: 45, reps: 10 },
    incline_db: { weight: 15, reps: 10 },
    cable:      { weight: 5,  reps: 12 },
  },

  Novice: {
    bench:      { weight: 65, reps: 10 },
    incline_db: { weight: 25, reps: 8 },
    cable:      { weight: 10, reps: 12 },
  },

  Warrior: {
    bench:      { weight: 95, reps: 8 },
    incline_db: { weight: 35, reps: 8 },
    cable:      { weight: 15, reps: 12 },
  },

  Heroic: {
    bench:      { weight: 135, reps: 8 },
    incline_db: { weight: 45, reps: 8 },
    cable:      { weight: 20, reps: 12 },
  },

  Champion: {
    bench:      { weight: 185, reps: 5 },
    incline_db: { weight: 55, reps: 8 },
    cable:      { weight: 25, reps: 12 },
  },

  Titan: {
    bench:      { weight: 225, reps: 5 },
    incline_db: { weight: 65, reps: 8 },
    cable:      { weight: 30, reps: 12 },
  },

  Olympian: {
    bench:      { weight: 255, reps: 3 },
    incline_db: { weight: 75, reps: 8 },
    cable:      { weight: 35, reps: 10 },
  },

  Divine: {
    bench:      { weight: 275, reps: 3 },
    incline_db: { weight: 85, reps: 8 },
    cable:      { weight: 40, reps: 10 },
  },

  Celestial: {
    bench:      { weight: 315, reps: 4 },
    incline_db: { weight: 95, reps: 8 },
    cable:      { weight: 45, reps: 10 },
  },

  Immortal: {
    bench:      { weight: 365, reps: 4 },
    incline_db: { weight: 105, reps: 8 },
    cable:      { weight: 50, reps: 12 },
  },

  Primordial: {
    bench:      { weight: 405, reps: 1 },
    incline_db: { weight: 115, reps: 4 },
    cable:      { weight: 55, reps: 10 },
  },
};

export const CHEST_TIER_SCORES = Object.fromEntries(
  CHEST_TIERS_IN_ORDER.map((tier) => {
    const anchor = CHEST_TIER_ANCHORS[tier];
    if (!anchor) return [tier, 0];
    return [tier, computeChestScore(anchor)];
  })
);


console.log("Chest Scores Per Tier: ",CHEST_TIER_SCORES);
