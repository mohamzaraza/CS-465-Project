// Records the ranking engines' CURRENT behavior into
// tests/fixtures/ranking-golden.json, before Enhancement 2 changes anything.
//
// This file makes no judgement about whether the behavior is correct. Several
// of the recorded outputs are wrong (see knownDefects); freezing them is the
// point, so that a refactor has to prove which outputs it changed on purpose.
//
// Plain Node, no dependencies. Run: npm run ranking:golden

import { mkdirSync, writeFileSync } from "node:fs";

// The anchors modules are imported BEFORE the ranking modules on purpose.
// chestRanking.js and chestTierAnchors.js import each other (same for back).
// Entering the cycle through the ranking module leaves CHEST_MULTIPLIER
// unassigned while the anchors module's top-level CHEST_TIER_SCORES is being
// computed. Plain Node tolerates either entry order because the exported
// functions are hoisted declarations; Vite/Vitest does not. Keep this order
// everywhere until the cycle is removed.
import {
  CHEST_MULTIPLIER,
  CHEST_TIERS_IN_ORDER,
  CHEST_TIER_ANCHORS,
} from "../src/ranking/chestTierAnchors.js";
import {
  BACK_MULTIPLIER,
  BACK_TIERS_IN_ORDER,
  BACK_TIER_ANCHORS,
} from "../src/ranking/backTierAnchors.js";
import {
  computeChestScore,
  computeChestTier,
} from "../src/ranking/chestRanking.js";
import {
  computeBackScore,
  computeBackTier,
} from "../src/ranking/backRanking.js";

const SEED = 20250928;
const RANDOM_CASES_PER_MUSCLE = 300;

// How far either side of a threshold the "just below" / "just above" inputs
// sit. Large enough to dwarf double-precision error at these magnitudes
// (~1e-13), small enough that nothing else can sit between the two inputs.
const THRESHOLD_DELTA = 0.01;

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) so the fixture is reproducible without a dependency
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Per-muscle description of the engine under test
// ---------------------------------------------------------------------------
const MUSCLES = {
  chest: {
    computeTier: computeChestTier,
    computeScore: computeChestScore,
    multiplier: CHEST_MULTIPLIER,
    tiersInOrder: CHEST_TIERS_IN_ORDER,
    anchors: CHEST_TIER_ANCHORS,
    // Lift used to place an input on an exact score threshold. Its score is
    // linear in weight, so one probe call gives the slope.
    probeLift: "incline_db",
    // Lift the Primordial override inspects, and the 1RM it demands.
    overrideLift: "bench",
    overrideMin1RM: 415,
    // Ranges for the seeded random cases (weights in lb).
    lifts: {
      bench: { min: 45, max: 500 },
      incline_db: { min: 10, max: 150 },
      cable: { min: 5, max: 100 },
    },
  },
  back: {
    computeTier: computeBackTier,
    computeScore: computeBackScore,
    multiplier: BACK_MULTIPLIER,
    tiersInOrder: BACK_TIERS_IN_ORDER,
    anchors: BACK_TIER_ANCHORS,
    probeLift: "lat_pulldown",
    overrideLift: "deadlift",
    overrideMin1RM: 600,
    // Ranges chosen to span every back anchor with headroom: the anchors run
    // lat_pulldown 40-260, db_row 20-130, deadlift 95-600.
    lifts: {
      lat_pulldown: { min: 30, max: 300 },
      db_row: { min: 15, max: 150 },
      deadlift: { min: 95, max: 650 },
    },
  },
};

const REPS_MIN = 1;
const REPS_MAX = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Mirrors the engines' private epley1RM, which they do not export. Used only
// to place an input on the Primordial override boundary; every expectation in
// the fixture still comes from calling the engine itself.
function invertEpley(target1RM, reps) {
  return target1RM / (1 + reps / 30);
}

function anchorScore(muscle, tier) {
  const anchor = MUSCLES[muscle].anchors[tier];
  if (!anchor) return 0;
  return MUSCLES[muscle].computeScore(anchor);
}

function makeCase(id, muscle, group, label, lifts) {
  const result = MUSCLES[muscle].computeTier(lifts);
  return {
    id,
    muscle,
    group,
    label,
    lifts,
    expected: { tier: result.tier, score: result.score },
  };
}

// Weight that makes `probeLift` alone score exactly `target`, at `reps` reps.
// The scorer is linear in weight, so one call at weight 1 gives the slope and
// no scoring constant has to be copied out of the engine by hand.
function weightForScore(muscle, target, reps) {
  const { probeLift, computeScore } = MUSCLES[muscle];
  const perLb = computeScore({ [probeLift]: { weight: 1, reps } });
  return target / perLb;
}

// ---------------------------------------------------------------------------
// Case builders
// ---------------------------------------------------------------------------

// (a) Every tier's anchor lifts, exactly as the engine stores them.
function anchorCases(muscle) {
  const cases = [];
  for (const tier of MUSCLES[muscle].tiersInOrder) {
    const anchor = MUSCLES[muscle].anchors[tier];
    if (!anchor) continue; // Untrained has no anchor lifts
    cases.push(
      makeCase(
        `${muscle}-anchor-${tier}`,
        muscle,
        "anchor",
        `${tier} anchor lifts`,
        structuredClone(anchor)
      )
    );
  }
  return cases;
}

// (b) For each tier, one input just below and one just above its anchor score,
// plus the two inputs that straddle the Primordial 1RM override.
function thresholdCases(muscle) {
  const cases = [];
  const reps = 10;

  for (const tier of MUSCLES[muscle].tiersInOrder) {
    const target = anchorScore(muscle, tier);
    if (target <= 0) continue; // Untrained

    const { probeLift } = MUSCLES[muscle];
    for (const side of ["below", "above"]) {
      const delta = side === "below" ? -THRESHOLD_DELTA : THRESHOLD_DELTA;
      const weight = weightForScore(muscle, target + delta, reps);
      cases.push(
        makeCase(
          `${muscle}-threshold-${tier}-${side}`,
          muscle,
          `threshold-${side}`,
          `${probeLift} alone scoring ${THRESHOLD_DELTA} ${side} the ${tier} anchor (${target})`,
          { [probeLift]: { weight, reps } }
        )
      );
    }
  }

  // The Primordial promotion is a 1RM check on one lift, not a score check, so
  // it needs its own boundary pair.
  const { overrideLift, overrideMin1RM } = MUSCLES[muscle];
  for (const side of ["below", "above"]) {
    const delta = side === "below" ? -THRESHOLD_DELTA : THRESHOLD_DELTA;
    const weight = invertEpley(overrideMin1RM + delta, 1);
    cases.push(
      makeCase(
        `${muscle}-override-${side}`,
        muscle,
        `threshold-${side}`,
        `${overrideLift} 1RM ${THRESHOLD_DELTA} ${side} the Primordial override cutoff (${overrideMin1RM})`,
        { [overrideLift]: { weight, reps: 1 } }
      )
    );
  }

  return cases;
}

// (c) Seeded random realistic lift sets.
function randomCases(muscle, rng) {
  const cases = [];
  const liftNames = Object.keys(MUSCLES[muscle].lifts);

  const randInt = (min, max) => min + Math.floor(rng() * (max - min + 1));

  for (let i = 0; i < RANDOM_CASES_PER_MUSCLE; i += 1) {
    // Presence is drawn before the weights so the number of rng() calls per
    // case is constant and the stream stays stable if the ranges ever change.
    const present = liftNames.map(() => rng() > 0.2);
    if (!present.some(Boolean)) present[i % liftNames.length] = true;

    const lifts = {};
    liftNames.forEach((name, index) => {
      const { min, max } = MUSCLES[muscle].lifts[name];
      const weight = randInt(min, max);
      const reps = randInt(REPS_MIN, REPS_MAX);
      if (present[index]) lifts[name] = { weight, reps };
    });

    cases.push(
      makeCase(
        `${muscle}-random-${String(i).padStart(3, "0")}`,
        muscle,
        "random",
        `seeded random lift set ${i}`,
        lifts
      )
    );
  }

  return cases;
}

// (d) One lift at a time, across each lift's range.
function singleLiftCases(muscle) {
  const cases = [];
  for (const [name, range] of Object.entries(MUSCLES[muscle].lifts)) {
    const weights = [range.min, Math.round((range.min + range.max) / 2), range.max];
    for (const weight of weights) {
      for (const reps of [1, 8, REPS_MAX]) {
        cases.push(
          makeCase(
            `${muscle}-single-${name}-${weight}x${reps}`,
            muscle,
            "single-lift",
            `${name} ${weight} lb x ${reps} reps, no other lifts`,
            { [name]: { weight, reps } }
          )
        );
      }
    }
  }
  return cases;
}

// Degenerate inputs. Not in the brief, but a golden master that does not cover
// them cannot tell whether a refactor changed how they are handled.
function edgeCases(muscle) {
  const [liftA] = Object.keys(MUSCLES[muscle].lifts);
  const entries = [
    ["empty", "no lifts at all", {}],
    ["unknown-lift", "only a lift key the engine does not score", { not_a_lift: { weight: 100, reps: 10 } }],
    ["zero-weight", `${liftA} at 0 lb`, { [liftA]: { weight: 0, reps: 10 } }],
    ["zero-reps", `${liftA} at 0 reps`, { [liftA]: { weight: 100, reps: 0 } }],
    ["negative-weight", `${liftA} at a negative weight`, { [liftA]: { weight: -100, reps: 10 } }],
    ["negative-reps", `${liftA} at negative reps`, { [liftA]: { weight: 100, reps: -10 } }],
    ["fractional", `${liftA} at a fractional weight and rep count`, { [liftA]: { weight: 42.5, reps: 7.5 } }],
  ];

  return entries.map(([suffix, label, lifts]) =>
    makeCase(`${muscle}-edge-${suffix}`, muscle, "edge", label, lifts)
  );
}

// (e) The defects measured before Enhancement 2 began. Each entry says what is
// wrong; the expected values are still whatever the code does today.
function knownDefectCases() {
  const entries = [
    {
      id: "chest-defect-sub-recruit-floors-at-recruit",
      muscle: "chest",
      defect: "A score far below the Recruit anchor still returns Recruit",
      why:
        "computeChestTier seeds bestTier = 'Recruit' and never reconsiders it, so " +
        `anything scoring under the Recruit anchor (${anchorScore("chest", "Recruit")}) ` +
        "is reported as Recruit instead of Untrained.",
      lifts: { incline_db: { weight: 15, reps: 8 } },
    },
    {
      id: "chest-defect-unbounded-volume",
      muscle: "chest",
      defect: "Unbounded reps let a trivial weight outrank a heavy bench",
      why:
        "incline_db scores weight * reps * 1.1 with no rep cap, so 100 reps of a " +
        "15 lb dumbbell outscores the Celestial anchor, whose bench is 315 lb.",
      lifts: { incline_db: { weight: 15, reps: 100 } },
    },
    {
      id: "chest-defect-override-ignores-score",
      muscle: "chest",
      defect: "The Primordial override ignores the score entirely",
      why:
        "A single bench triple-check at 415 lb promotes to Primordial even though " +
        `the resulting score sits below the Warrior anchor (${anchorScore("chest", "Warrior")}).`,
      lifts: { bench: { weight: 415, reps: 1 } },
    },
    {
      id: "chest-defect-no-input-bounds",
      muscle: "chest",
      defect: "No upper bound on weight or reps",
      why:
        "Nothing rejects physically impossible input, so a 99999 lb bench for 99 " +
        "reps is scored and stored rather than refused.",
      lifts: { bench: { weight: 99999, reps: 99 } },
    },
    {
      id: "chest-defect-anchors-not-monotonic",
      muscle: "chest",
      defect: "Chest anchor scores are not strictly increasing",
      why:
        `The Primordial anchor scores ${anchorScore("chest", "Primordial")}, below ` +
        `Immortal's ${anchorScore("chest", "Immortal")}. The loop's ` +
        "'anchorScore >= bestAnchor' guard hides the inversion instead of failing, " +
        "and the Primordial anchor is dead data because the loop skips that tier.",
      lifts: structuredClone(CHEST_TIER_ANCHORS.Primordial),
    },
    {
      id: "back-defect-override-ignores-score",
      muscle: "back",
      defect: "Back repeats the chest override defect",
      why:
        "A 600 lb deadlift single promotes to Primordial at a score below back's " +
        `own Recruit anchor (${anchorScore("back", "Recruit")}).`,
      lifts: { deadlift: { weight: 600, reps: 1 } },
    },
  ];

  return entries.map((entry) => {
    const result = MUSCLES[entry.muscle].computeTier(entry.lifts);
    return {
      id: entry.id,
      muscle: entry.muscle,
      defect: entry.defect,
      why: entry.why,
      lifts: entry.lifts,
      expected: { tier: result.tier, score: result.score },
    };
  });
}

// ---------------------------------------------------------------------------
// Build and write
// ---------------------------------------------------------------------------
function build() {
  const cases = [];

  for (const muscle of Object.keys(MUSCLES)) {
    // One PRNG per muscle so adding cases to one muscle cannot shift the other.
    const rng = mulberry32(SEED + (muscle === "chest" ? 0 : 1));
    cases.push(
      ...anchorCases(muscle),
      ...thresholdCases(muscle),
      ...randomCases(muscle, rng),
      ...singleLiftCases(muscle),
      ...edgeCases(muscle)
    );
  }

  const anchorScores = {};
  for (const muscle of Object.keys(MUSCLES)) {
    anchorScores[muscle] = Object.fromEntries(
      MUSCLES[muscle].tiersInOrder.map((tier) => [tier, anchorScore(muscle, tier)])
    );
  }

  return {
    // Deliberately no timestamp: the file has to be byte-identical between runs
    // so that regenerating it produces an empty diff when nothing changed.
    generator: "server/scripts/generate-ranking-golden.mjs",
    purpose:
      "Golden master of the chest and back ranking engines as they behaved " +
      "before Enhancement 2. Expected values are recorded output, not desired " +
      "output; see knownDefects.",
    seed: SEED,
    multipliers: { chest: CHEST_MULTIPLIER, back: BACK_MULTIPLIER },
    anchorScores,
    caseCount: cases.length,
    cases,
    knownDefects: knownDefectCases(),
  };
}

const fixture = build();
const outUrl = new URL("../tests/fixtures/ranking-golden.json", import.meta.url);
mkdirSync(new URL("../tests/fixtures/", import.meta.url), { recursive: true });
// "\n" explicitly: the file must not pick up CRLF from the platform, or two
// runs on different machines would not be byte-identical.
writeFileSync(outUrl, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");

console.log(
  `Wrote tests/fixtures/ranking-golden.json - ` +
    `${fixture.caseCount} cases, ${fixture.knownDefects.length} known defects.`
);
