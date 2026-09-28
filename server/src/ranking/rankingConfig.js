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
// backTierAnchors.js stored them — with one approved exception, the chest
// Primordial anchor, noted where it is defined.

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

// The tiers the score ladder is actually built from: everything except the zero
// tier, which has no anchor lifts. Primordial used to be excluded too, because a
// 1RM override rule owned it; that rule is gone and the tier is now earned by
// score like every other. Slicing rather than re-listing keeps the two in step.
const SCORED_TIERS = TIERS_IN_ORDER.slice(1);

// Rep counts are bounded the same way for every lift: a whole number from 1 to
// 30. The cap matters because `volume` is linear in reps with nothing to damp
// it, so an unbounded rep count is an unbounded score. 30 is far above a real
// working set, which is the point — it rejects the absurd without touching
// anybody's real numbers. It does NOT close the volume exploit; see the
// "Behavior changes (Prompt 3)" section of ENHANCEMENT_2_CHANGELOG.md.
const REP_BOUNDS = { min: 1, max: 30 };

export const CHEST_CONFIG = {
  muscle: "chest",
  multiplier: 1.2,

  // Order matters: the engine accumulates in this order, and the original
  // computeChestScore added bench, then incline_db, then cable. Floating-point
  // addition is not associative, so reordering this would move scores.
  //
  // Each lift carries its own input bounds, so adding a muscle never means
  // editing the validator. The weight maxima are deliberately generous — roughly
  // two to three times the heaviest weight the golden-master generator produces
  // for that lift — because their job is to refuse the physically impossible
  // (a 99999 lb bench), not to judge anyone's training.
  lifts: [
    {
      key: "bench",
      formula: "epley1RM",
      factor: 1,
      bounds: { weight: { min: 1, max: 1000 }, reps: REP_BOUNDS },
    },
    {
      key: "incline_db",
      formula: "volume",
      factor: 1.1,
      bounds: { weight: { min: 1, max: 300 }, reps: REP_BOUNDS },
    },
    {
      key: "cable",
      formula: "volume",
      factor: 0.9,
      bounds: { weight: { min: 1, max: 300 }, reps: REP_BOUNDS },
    },
  ],

  tierOrder: TIERS_IN_ORDER,
  zeroTier: "Untrained",

  // Seeded as the answer when the score clears no threshold. This reproduces
  // the original `let bestTier = "Recruit"`, which is defect 1 in the change
  // log: a score below the Recruit anchor is still reported as Recruit. Prompt 3
  // deliberately left it alone — it was not one of the approved changes — so it
  // is still open. Note the knock-on: now that a valid set must have every lift
  // at 1 lb or more for 1 rep or more, no valid input can score 0, so zeroTier
  // is only reachable through a direct engine call.
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

    // Changed in Prompt 3, with approval, and the only anchor that moved. It was
    // bench 405x1 / incline_db 115x4 / cable 55x10, which scores 1703.4 — BELOW
    // Immortal's 2253.2. That inversion was invisible only because a 1RM override
    // rule owned this tier and the ladder skipped it; with the override deleted,
    // Primordial has to be earned by score, so its anchor has to sit on top.
    //
    // These lifts were not picked to hit a number. Celestial -> Immortal steps
    // +50 lb bench, +10 lb incline_db, +5 lb cable at reps 4/8/12, so Primordial
    // repeats that step once more. Result: 2491.6, a gap of +238.4 over Immortal,
    // which sits inside the range the rest of the ladder already uses (gaps
    // 116.4 to 335.6). The 415 lb bench is the weight the deleted override asked
    // for, now as a 4-rep set inside a complete lift set instead of a single that
    // ignored the other two lifts.
    Primordial: {
      bench: { weight: 415, reps: 4 },
      incline_db: { weight: 115, reps: 8 },
      cable: { weight: 55, reps: 12 },
    },
  },
};

export const BACK_CONFIG = {
  muscle: "back",
  multiplier: 1.2,

  // Original order in computeBackScore: lat_pulldown, db_row, deadlift.
  lifts: [
    {
      key: "lat_pulldown",
      formula: "volume",
      factor: 1.6,
      bounds: { weight: { min: 1, max: 600 }, reps: REP_BOUNDS },
    },
    {
      key: "db_row",
      formula: "volume",
      factor: 1.2,
      bounds: { weight: { min: 1, max: 300 }, reps: REP_BOUNDS },
    },
    // Epley first, then 0.45 — deadlift is scored as a fraction of a full 1RM
    // because it is not purely a back lift.
    {
      key: "deadlift",
      formula: "epley1RM",
      factor: 0.45,
      bounds: { weight: { min: 1, max: 1500 }, reps: REP_BOUNDS },
    },
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

    // Unchanged in Prompt 3: back's Primordial anchor already scored 5826.0,
    // above Immortal's 5501.4, so deleting the deadlift override was enough to
    // make it a real, earnable tier. Only chest's anchor had to move.
    Primordial: {
      lat_pulldown: { weight: 260, reps: 8 },
      db_row: { weight: 130, reps: 8 },
      deadlift: { weight: 600, reps: 1 },
    },
  },
};

export const RANKING_CONFIGS = [CHEST_CONFIG, BACK_CONFIG];
