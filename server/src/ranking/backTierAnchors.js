import { computeBackScore } from "./backRanking.js";

export const BACK_MULTIPLIER = 1.2;

// Tier order (same as chest)
export const BACK_TIERS_IN_ORDER = [
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

// A = Lat pulldown, B = DB Row, C = Deadlift
// These are the ANCHOR lifts for each tier.
// can adjust these numbers later; the scoring logic will adapt automatically.
export const BACK_TIER_ANCHORS = {
  Untrained: null,

  Recruit: {
    lat_pulldown: { weight: 40, reps: 8 },
    db_row:       { weight: 20, reps: 10 },
    deadlift:     { weight: 95, reps: 5 },
  },

  Novice: {
    lat_pulldown: { weight: 70, reps: 8 },
    db_row:       { weight: 35, reps: 10 },
    deadlift:     { weight: 135, reps: 5 },
  },

  Warrior: {
    lat_pulldown: { weight: 100, reps: 8 },
    db_row:       { weight: 50, reps: 8 },
    deadlift:     { weight: 185, reps: 5 },
  },

  Heroic: {
    lat_pulldown: { weight: 130, reps: 8 },
    db_row:       { weight: 65, reps: 8 },
    deadlift:     { weight: 225, reps: 5 },
  },

  Champion: {
    lat_pulldown: { weight: 150, reps: 8 },
    db_row:       { weight: 75, reps: 8 },
    deadlift:     { weight: 275, reps: 3 },
  },

  Titan: {
    lat_pulldown: { weight: 170, reps: 8 },
    db_row:       { weight: 85, reps: 8 },
    deadlift:     { weight: 315, reps: 3 },
  },

  Olympian: {
    lat_pulldown: { weight: 190, reps: 8 },
    db_row:       { weight: 95, reps: 8 },
    deadlift:     { weight: 365, reps: 3 },
  },

  Divine: {
    lat_pulldown: { weight: 210, reps: 8 },
    db_row:       { weight: 100, reps: 8 },
    deadlift:     { weight: 405, reps: 3 },
  },

  Celestial: {
    lat_pulldown: { weight: 230, reps: 8 },
    db_row:       { weight: 110, reps: 8 },
    deadlift:     { weight: 455, reps: 2 },
  },

  Immortal: {
    lat_pulldown: { weight: 250, reps: 8 },
    db_row:       { weight: 120, reps: 8 },
    deadlift:     { weight: 500, reps: 1 },
  },

  // Mostly ceremonial; real Primordial promotion is via deadlift 1RM check.
  Primordial: {
    lat_pulldown: { weight: 260, reps: 8 },
    db_row:       { weight: 130, reps: 8 },
    deadlift:     { weight: 600, reps: 1 },
  },
};

export const BACK_TIER_SCORES = Object.fromEntries(
  BACK_TIERS_IN_ORDER.map((tier) => {
    const anchor = BACK_TIER_ANCHORS[tier];
    if (!anchor) return [tier, 0];
    return [tier, computeBackScore(anchor)];
  })
);

console.log("Back Scores Per Tier: ",BACK_TIER_SCORES);