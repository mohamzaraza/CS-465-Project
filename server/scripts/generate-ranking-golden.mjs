// Records the ranking engines' CURRENT behavior into
// tests/fixtures/ranking-golden-v2.json.
//
// It used to write ranking-golden.json, the v1 baseline taken before Enhancement
// 2 touched anything. Prompt 3 changed behavior on purpose, so v1 can no longer
// be reproduced and this script no longer writes it: v1 stays in git as history,
// regenerable only at commit 50011da. tests/ranking.behavior-changes.test.js is
// what holds the two files against each other and pins the exact difference.
//
// This file still makes no judgement about whether the behavior is correct. Some
// recorded outputs are still wrong (see knownDefects, which now says which
// defects Prompt 3 closed and which are still open); freezing them is the point,
// so that a later change has to prove which outputs it moved on purpose.
//
// Case ids and inputs are deliberately unchanged from v1 wherever the data
// allows, because that is what lets the two fixtures be diffed entry by entry.
// An input that DID have to change (chest's Primordial anchor, and the probes
// derived from it) is listed in INPUTS_CHANGED_SINCE_V1 below.
//
// Plain Node, no dependencies. Run: npm run ranking:golden

import { mkdirSync, writeFileSync } from "node:fs";

import {
  BACK_MULTIPLIER,
  BACK_TIERS_IN_ORDER,
  BACK_TIER_ANCHORS,
  CHEST_MULTIPLIER,
  CHEST_TIERS_IN_ORDER,
  CHEST_TIER_ANCHORS,
  computeBackScore,
  computeBackTier,
  computeChestScore,
  computeChestTier,
  getRankingEngine,
  validateLifts,
} from "../src/ranking/index.js";
// The configs themselves, for the bounds the fixture records. index.js is the
// entry point for ranking BEHAVIOR; this is data about the configuration.
import { RANKING_CONFIGS } from "../src/ranking/rankingConfig.js";

// The four entries whose LIFTS differ from v1, all for the same approved reason:
// chest's Primordial anchor moved, and two threshold probes are derived from it.
// Named here so the behavior-changes test can assert this list is exhaustive
// rather than trusting a diff to be all output.
const INPUTS_CHANGED_SINCE_V1 = [
  "chest-anchor-Primordial",
  "chest-threshold-Primordial-below",
  "chest-threshold-Primordial-above",
  "chest-defect-anchors-not-monotonic",
];

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
    // The lift and 1RM the DELETED Primordial override used to inspect. Kept so
    // the two inputs that straddled it are still recorded under their v1 ids;
    // both are now rejected as incomplete, which is the whole point.
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

// An entry records one of two outcomes, never both: `expected` for input the
// server accepts, `rejected` for input it refuses. Recording the refusal rather
// than dropping the case is what keeps v1's case list diffable against v2 and
// what stops a future change from quietly accepting something again.
function makeCase(id, muscle, group, label, lifts) {
  const checked = validateLifts(muscle, lifts);
  if (!checked.ok) {
    return { id, muscle, group, label, lifts, rejected: { errors: checked.errors } };
  }

  const result = MUSCLES[muscle].computeTier(checked.lifts);
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

  // The two inputs that straddled the DELETED Primordial 1RM override, kept
  // under their v1 ids. In v1 these differed by 0.0194 lb and by nine tiers;
  // now they are both simply incomplete lift sets, and both are rejected.
  const { overrideLift, overrideMin1RM } = MUSCLES[muscle];
  for (const side of ["below", "above"]) {
    const delta = side === "below" ? -THRESHOLD_DELTA : THRESHOLD_DELTA;
    const weight = invertEpley(overrideMin1RM + delta, 1);
    cases.push(
      makeCase(
        `${muscle}-override-${side}`,
        muscle,
        `threshold-${side}`,
        `${overrideLift} 1RM ${THRESHOLD_DELTA} ${side} the removed Primordial override cutoff (${overrideMin1RM})`,
        { [overrideLift]: { weight, reps: 1 } }
      )
    );
  }

  return cases;
}

// (b2) New in v2. The (b) probes above are all single-lift, so every one of them
// is now rejected as incomplete input — which records the rejection but pins
// nothing about where a tier actually starts. These probes are complete lift
// sets: the tier's own anchor with the probe lift's weight solved so the total
// lands exactly ON the tier's threshold, and 0.51 below it.
//
// 0.51, not 0.01, because the boundary moved: rank() classifies a ROUNDED score
// against rounded thresholds, so the first score that misses tier N is N - 0.51
// (which rounds to N - 1), not N - 0.01 (which rounds back up to N).
function roundedThresholdCases(muscle) {
  const cases = [];
  const { probeLift, computeScore, anchors } = MUSCLES[muscle];

  for (const { tier, min } of getRankingEngine(muscle).thresholds) {
    const anchor = structuredClone(anchors[tier]);
    const { reps } = anchor[probeLift];

    // The scorer is linear in the probe lift's weight, so one call at 1 lb gives
    // the slope and one at 0 lb gives everything the other lifts contribute.
    const perLb = computeScore({ [probeLift]: { weight: 1, reps } });
    const base = computeScore({ ...anchor, [probeLift]: { weight: 0, reps } });

    for (const [side, target] of [
      ["at", min],
      ["below", min - 0.51],
    ]) {
      const weight = (target - base) / perLb;
      cases.push(
        makeCase(
          `${muscle}-rounded-${tier}-${side}`,
          muscle,
          `rounded-${side}`,
          `${tier} anchor with ${probeLift} solved so the score rounds to ${Math.round(target)}` +
            `, against a ${tier} threshold of ${min}`,
          { ...anchor, [probeLift]: { weight, reps } }
        )
      );
    }
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

// (e) The defects measured before Enhancement 2 began, each carrying what Prompt
// 3 did about it. `status` is the honest part: "fixed" means the defect is gone,
// "reduced" means the worst inputs are refused but the underlying flaw is still
// there, and "open" means nothing was done. The recorded outcome is still
// whatever the code does today, not what it ought to do.
function knownDefectCases() {
  const entries = [
    {
      id: "chest-defect-sub-recruit-floors-at-recruit",
      muscle: "chest",
      status: "open",
      defect: "A score far below the Recruit anchor still returns Recruit",
      why:
        "rank() seeds the answer with floorTier = 'Recruit' and only ever raises " +
        `it, so anything scoring under the Recruit anchor (${anchorScore("chest", "Recruit")}) ` +
        "is reported as Recruit instead of Untrained.",
      resolution:
        "Not fixed: it was not one of the approved Prompt 3 changes. This input no " +
        "longer reaches the engine at all (one lift out of three), so the defect " +
        "is now demonstrated by chest-open-floor-tier-below-recruit instead.",
      lifts: { incline_db: { weight: 15, reps: 8 } },
    },
    {
      id: "chest-defect-unbounded-volume",
      muscle: "chest",
      status: "reduced",
      defect: "Unbounded reps let a trivial weight outrank a heavy bench",
      why:
        "incline_db scores weight * reps * 1.1 with no rep cap, so 100 reps of a " +
        "15 lb dumbbell outscores the Celestial anchor, whose bench is 315 lb.",
      resolution:
        "Reduced, not closed. Reps are now capped at 30, so this input is refused, " +
        "but volume is still linear in reps up to the cap: see " +
        "chest-open-rep-cap-does-not-close-volume. Closing it means changing the " +
        "formulas, which would move every tier and was out of scope.",
      lifts: { incline_db: { weight: 15, reps: 100 } },
    },
    {
      id: "chest-defect-override-ignores-score",
      muscle: "chest",
      status: "fixed",
      defect: "The Primordial override ignores the score entirely",
      why:
        "A single bench rep at 415 lb promotes to Primordial even though " +
        `the resulting score sits below the Warrior anchor (${anchorScore("chest", "Warrior")}).`,
      resolution:
        "Fixed: the override rule is deleted, so Primordial is earned by score " +
        `(${anchorScore("chest", "Primordial")}) like every other tier. This input ` +
        "is also refused now, because a bench alone is not a chest lift set.",
      lifts: { bench: { weight: 415, reps: 1 } },
    },
    {
      id: "chest-defect-no-input-bounds",
      muscle: "chest",
      status: "fixed",
      defect: "No upper bound on weight or reps",
      why:
        "Nothing rejects physically impossible input, so a 99999 lb bench for 99 " +
        "reps is scored and stored rather than refused.",
      resolution: "Fixed: every lift carries weight and rep bounds, and this input breaks both.",
      lifts: { bench: { weight: 99999, reps: 99 } },
    },
    {
      id: "chest-defect-anchors-not-monotonic",
      muscle: "chest",
      status: "fixed",
      defect: "Chest anchor scores are not strictly increasing",
      why:
        "The v1 Primordial anchor (bench 405x1, incline_db 115x4, cable 55x10) " +
        `scored 1703.4, below Immortal's ${anchorScore("chest", "Immortal")}, and the ` +
        "ladder hid it by excluding the tier the override owned.",
      resolution:
        "Fixed: the anchor is now bench 415x4, incline_db 115x8, cable 55x12, scoring " +
        `${anchorScore("chest", "Primordial")}. Startup validation would now refuse ` +
        "the old value. NOTE: this entry's lifts are the anchor itself, so its input " +
        "differs from v1.",
      lifts: structuredClone(CHEST_TIER_ANCHORS.Primordial),
    },
    {
      id: "back-defect-override-ignores-score",
      muscle: "back",
      status: "fixed",
      defect: "Back repeats the chest override defect",
      why:
        "A 600 lb deadlift single promotes to Primordial at a score below back's " +
        `own Recruit anchor (${anchorScore("back", "Recruit")}).`,
      resolution:
        "Fixed: the override is deleted. Back's Primordial anchor already scored " +
        `${anchorScore("back", "Primordial")}, above Immortal's ` +
        `${anchorScore("back", "Immortal")}, so no anchor had to move.`,
      lifts: { deadlift: { weight: 600, reps: 1 } },
    },

    // Added in v2: what is still wrong, with input the server actually accepts.
    {
      id: "chest-open-floor-tier-below-recruit",
      muscle: "chest",
      status: "open",
      defect: "A complete but very light set is still reported as Recruit",
      why:
        "The same floorTier defect as above, now shown with valid input: a set this " +
        `light scores far under the Recruit anchor (${anchorScore("chest", "Recruit")}) ` +
        "and is still called Recruit rather than Untrained.",
      resolution: "Open. Not an approved Prompt 3 change.",
      lifts: {
        bench: { weight: 45, reps: 1 },
        incline_db: { weight: 15, reps: 1 },
        cable: { weight: 5, reps: 1 },
      },
    },
    {
      id: "chest-open-rep-cap-does-not-close-volume",
      muscle: "chest",
      status: "open",
      defect: "The rep cap reduces the volume exploit but does not close it",
      why:
        "Every weight here is the Heroic anchor's, but claimed for 30 reps instead " +
        `of 8 or 12. Heroic scores ${anchorScore("chest", "Heroic")}; this reaches ` +
        "Primordial, because volume is linear in reps all the way to the cap.",
      resolution:
        "Open by decision: closing it means changing the formulas, which would move " +
        "every tier. The cap only removes the absurd inputs above 30 reps.",
      lifts: {
        bench: { weight: 135, reps: 30 },
        incline_db: { weight: 45, reps: 30 },
        cable: { weight: 20, reps: 30 },
      },
    },
    {
      id: "back-open-rep-cap-does-not-close-volume",
      muscle: "back",
      status: "open",
      defect: "Back has the same residual volume exploit",
      why:
        `Heroic-anchor weights (Heroic scores ${anchorScore("back", "Heroic")}) claimed ` +
        "for 30 reps each reach Primordial, and back leans on volume harder than " +
        "chest does: its lat_pulldown factor is 1.6.",
      resolution: "Open by decision, for the same reason as chest's.",
      lifts: {
        lat_pulldown: { weight: 130, reps: 30 },
        db_row: { weight: 65, reps: 30 },
        deadlift: { weight: 225, reps: 30 },
      },
    },
  ];

  return entries.map((entry) => {
    const outcome = makeCase(entry.id, entry.muscle, "knownDefect", entry.defect, entry.lifts);
    return {
      id: entry.id,
      muscle: entry.muscle,
      status: entry.status,
      defect: entry.defect,
      why: entry.why,
      resolution: entry.resolution,
      lifts: entry.lifts,
      ...(outcome.rejected ? { rejected: outcome.rejected } : { expected: outcome.expected }),
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
      ...roundedThresholdCases(muscle),
      ...randomCases(muscle, rng),
      ...singleLiftCases(muscle),
      ...edgeCases(muscle)
    );
  }

  // Both values, because they are two different things now: the score the anchor
  // lifts actually produce, and the integer threshold rank() compares against.
  const anchorScores = {};
  const thresholds = {};
  for (const muscle of Object.keys(MUSCLES)) {
    anchorScores[muscle] = Object.fromEntries(
      MUSCLES[muscle].tiersInOrder.map((tier) => [tier, anchorScore(muscle, tier)])
    );
    thresholds[muscle] = Object.fromEntries(
      getRankingEngine(muscle).thresholds.map(({ tier, min }) => [tier, min])
    );
  }

  // The limits every entry marked `rejected` was rejected against, recorded so
  // the fixture explains itself without the reader opening rankingConfig.js.
  const bounds = {};
  for (const config of RANKING_CONFIGS) {
    bounds[config.muscle] = Object.fromEntries(
      config.lifts.map((lift) => [lift.key, lift.bounds])
    );
  }

  return {
    // Deliberately no timestamp: the file has to be byte-identical between runs
    // so that regenerating it produces an empty diff when nothing changed.
    generator: "server/scripts/generate-ranking-golden.mjs",
    version: 2,
    purpose:
      "Golden master of the chest and back ranking engines after the Prompt 3 " +
      "behavior fixes: input validation, the Primordial ladder, one rounding. " +
      "Expected values are recorded output, not desired output; see knownDefects, " +
      "and see ranking-golden.json for the v1 baseline this replaced.",
    seed: SEED,
    multipliers: { chest: CHEST_MULTIPLIER, back: BACK_MULTIPLIER },
    anchorScores,
    thresholds,
    bounds,
    inputsChangedSinceV1: INPUTS_CHANGED_SINCE_V1,
    caseCount: cases.length,
    cases,
    knownDefects: knownDefectCases(),
  };
}

const fixture = build();
const outUrl = new URL("../tests/fixtures/ranking-golden-v2.json", import.meta.url);
mkdirSync(new URL("../tests/fixtures/", import.meta.url), { recursive: true });
// "\n" explicitly: the file must not pick up CRLF from the platform, or two
// runs on different machines would not be byte-identical.
writeFileSync(outUrl, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");

const rejected = [...fixture.cases, ...fixture.knownDefects].filter((c) => c.rejected).length;
console.log(
  `Wrote tests/fixtures/ranking-golden-v2.json - ` +
    `${fixture.caseCount} cases (${rejected} of them now rejected as invalid input), ` +
    `${fixture.knownDefects.length} known defects.`
);
