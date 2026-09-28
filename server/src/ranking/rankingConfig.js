// Pure data: one entry per rankable muscle. This module imports nothing, which
// is what removes the old chestRanking <-> chestTierAnchors cycle, and it is
// why formulas are named by string rather than referenced directly — the engine
// resolves the name and rejects one it does not know.
//
// Adding a muscle is an edit to this file alone. Nothing here is executable, so
// a mistake shows up as a validation error at startup, not as a wrong rank.
//
// The numbers are the ones the engines ran on before this refactor: multipliers
// 1.2 for both muscles, and the anchor lifts exactly as chestTierAnchors.js and
// backTierAnchors.js stored them.

// Every muscle currently shares this ladder, but it is repeated per muscle
// rather than shared, because a muscle is allowed to have its own tier names.
const TIERS_IN_ORDER = [
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

// The tiers the score ladder is actually built from: everything except the
// zero tier (no anchor lifts) and the override tier (reached by a 1RM check,
// not by score). Slicing rather than re-listing keeps the two in step.
const SCORED_TIERS = TIERS_IN_ORDER.slice(1, -1);

export const CHEST_CONFIG = {
  muscle: "chest",
  multiplier: 1.2,

  // Order matters: the engine accumulates in this order, and the original
  // computeChestScore added bench, then incline_db, then cable. Floating-point
  // addition is not associative, so reordering this would move scores.
  lifts: [
    { key: "bench", formula: "epley1RM", factor: 1 },
    { key: "incline_db", formula: "volume", factor: 1.1 },
    { key: "cable", formula: "volume", factor: 0.9 },
  ],

  tierOrder: TIERS_IN_ORDER,
  zeroTier: "Untrained",

  // Seeded as the answer when the score clears no threshold. This reproduces
  // the original `let bestTier = "Recruit"`, which is defect 1 in the change
  // log: a score below the Recruit anchor is still reported as Recruit.
  // Prompt 3 decides what to do about it.
  floorTier: "Recruit",
  ladder: SCORED_TIERS,

  anchors: {
    Untrained: null,

    Recruit: {
      bench: { weight: 45, reps: 10 },
      incline_db: { weight: 15, reps: 10 },
      cable: { weight: 5, reps: 12 },
    },

    Novice: {
      bench: { weight: 65, reps: 10 },
      incline_db: { weight: 25, reps: 8 },
      cable: { weight: 10, reps: 12 },
    },

    Warrior: {
      bench: { weight: 95, reps: 8 },
      incline_db: { weight: 35, reps: 8 },
      cable: { weight: 15, reps: 12 },
    },

    Heroic: {
      bench: { weight: 135, reps: 8 },
      incline_db: { weight: 45, reps: 8 },
      cable: { weight: 20, reps: 12 },
    },

    Champion: {
      bench: { weight: 185, reps: 5 },
      incline_db: { weight: 55, reps: 8 },
      cable: { weight: 25, reps: 12 },
    },

    Titan: {
      bench: { weight: 225, reps: 5 },
      incline_db: { weight: 65, reps: 8 },
      cable: { weight: 30, reps: 12 },
    },

    Olympian: {
      bench: { weight: 255, reps: 3 },
      incline_db: { weight: 75, reps: 8 },
      cable: { weight: 35, reps: 10 },
    },

    Divine: {
      bench: { weight: 275, reps: 3 },
      incline_db: { weight: 85, reps: 8 },
      cable: { weight: 40, reps: 10 },
    },

    Celestial: {
      bench: { weight: 315, reps: 4 },
      incline_db: { weight: 95, reps: 8 },
      cable: { weight: 45, reps: 10 },
    },

    Immortal: {
      bench: { weight: 365, reps: 4 },
      incline_db: { weight: 105, reps: 8 },
      cable: { weight: 50, reps: 12 },
    },

    // Dead data, kept so the exported anchor table is unchanged: Primordial is
    // the override tier, so this anchor is never scored into the ladder. It is
    // also the reason it CAN'T be: at 1703.4 it scores below Immortal's 2253.2,
    // which would break a strictly-increasing ladder.
    Primordial: {
      bench: { weight: 405, reps: 1 },
      incline_db: { weight: 115, reps: 4 },
      cable: { weight: 55, reps: 10 },
    },
  },

  // Preserved exactly as it behaves today, defect and all: the check is on one
  // lift's unfactored 1RM and ignores the score entirely, so a bench single at
  // 415 lb reaches the top tier on a score below the Warrior anchor. Recorded
  // as defect 3; Prompt 3 fixes it.
  override: { tier: "Primordial", lift: "bench", formula: "epley1RM", min: 415 },
};

export const BACK_CONFIG = {
  muscle: "back",
  multiplier: 1.2,

  // Original order in computeBackScore: lat_pulldown, db_row, deadlift.
  lifts: [
    { key: "lat_pulldown", formula: "volume", factor: 1.6 },
    { key: "db_row", formula: "volume", factor: 1.2 },
    // Epley first, then 0.45 — deadlift is scored as a fraction of a full 1RM
    // because it is not purely a back lift.
    { key: "deadlift", formula: "epley1RM", factor: 0.45 },
  ],

  tierOrder: TIERS_IN_ORDER,
  zeroTier: "Untrained",
  floorTier: "Recruit",
  ladder: SCORED_TIERS,

  anchors: {
    Untrained: null,

    Recruit: {
      lat_pulldown: { weight: 40, reps: 8 },
      db_row: { weight: 20, reps: 10 },
      deadlift: { weight: 95, reps: 5 },
    },

    Novice: {
      lat_pulldown: { weight: 70, reps: 8 },
      db_row: { weight: 35, reps: 10 },
      deadlift: { weight: 135, reps: 5 },
    },

    Warrior: {
      lat_pulldown: { weight: 100, reps: 8 },
      db_row: { weight: 50, reps: 8 },
      deadlift: { weight: 185, reps: 5 },
    },

    Heroic: {
      lat_pulldown: { weight: 130, reps: 8 },
      db_row: { weight: 65, reps: 8 },
      deadlift: { weight: 225, reps: 5 },
    },

    Champion: {
      lat_pulldown: { weight: 150, reps: 8 },
      db_row: { weight: 75, reps: 8 },
      deadlift: { weight: 275, reps: 3 },
    },

    Titan: {
      lat_pulldown: { weight: 170, reps: 8 },
      db_row: { weight: 85, reps: 8 },
      deadlift: { weight: 315, reps: 3 },
    },

    Olympian: {
      lat_pulldown: { weight: 190, reps: 8 },
      db_row: { weight: 95, reps: 8 },
      deadlift: { weight: 365, reps: 3 },
    },

    Divine: {
      lat_pulldown: { weight: 210, reps: 8 },
      db_row: { weight: 100, reps: 8 },
      deadlift: { weight: 405, reps: 3 },
    },

    Celestial: {
      lat_pulldown: { weight: 230, reps: 8 },
      db_row: { weight: 110, reps: 8 },
      deadlift: { weight: 455, reps: 2 },
    },

    Immortal: {
      lat_pulldown: { weight: 250, reps: 8 },
      db_row: { weight: 120, reps: 8 },
      deadlift: { weight: 500, reps: 1 },
    },

    // Mostly ceremonial; real Primordial promotion is via the deadlift 1RM
    // check below. Unlike chest's, this anchor does sit above Immortal's, but
    // it is still outside the ladder because the override owns the tier.
    Primordial: {
      lat_pulldown: { weight: 260, reps: 8 },
      db_row: { weight: 130, reps: 8 },
      deadlift: { weight: 600, reps: 1 },
    },
  },

  // Same shape and same defect as chest's, on the deadlift instead.
  override: { tier: "Primordial", lift: "deadlift", formula: "epley1RM", min: 600 },
};

export const RANKING_CONFIGS = [CHEST_CONFIG, BACK_CONFIG];
