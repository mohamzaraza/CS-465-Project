// Unit tests for the two pieces the config-driven engine is built from:
// findTier (the binary search) and createRankingEngine (the config validator and
// threshold precomputation). The golden master proves the engine still produces
// yesterday's answers; this file proves the parts are right on their own terms,
// including on inputs the two real configs never produce.

import { describe, expect, it } from "vitest";

import { createRankingEngine, findTier } from "../src/ranking/rankingEngine.js";
import { getRankingEngine } from "../src/ranking/index.js";

// ---------------------------------------------------------------------------
// findTier
// ---------------------------------------------------------------------------

// The behavior findTier has to match: walk the ladder low to high and keep the
// last tier the score cleared. This is what the two original engines did, minus
// their rescoring of every anchor, so it is the right reference.
function findTierLinear(thresholds, score, floorTier) {
  let best = floorTier;
  for (const threshold of thresholds) {
    if (threshold.min <= score) best = threshold.tier;
  }
  return best;
}

// Seeded so a failure is reproducible; mulberry32, same generator the fixture
// script uses, kept local so this file needs no dependency.
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

// The next representable double below x. Used to prove the search really uses
// `min <= score` and not `min < score`: one ulp is the smallest difference that
// exists, so nothing weaker can pass.
function nextDown(x) {
  if (x === 0) return -Number.MIN_VALUE;
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, x);
  view.setBigUint64(0, view.getBigUint64(0) + (x > 0 ? -1n : 1n));
  return view.getFloat64(0);
}

const FLOOR = "Floor";

function ladderOf(mins) {
  return mins.map((min, index) => ({ tier: `T${index}`, min }));
}

describe("findTier", () => {
  const chestThresholds = getRankingEngine("chest").thresholds;
  const backThresholds = getRankingEngine("back").thresholds;

  it.each([
    ["chest (10 tiers)", chestThresholds],
    ["back (10 tiers)", backThresholds],
    ["one tier", ladderOf([100])],
    ["two tiers", ladderOf([100, 200])],
    ["an even ladder", ladderOf([1, 2, 3, 4, 5, 6, 7, 8])],
    ["an odd ladder", ladderOf([1, 2, 3, 4, 5, 6, 7])],
    ["negative and zero minimums", ladderOf([-50, -10, 0, 10, 50])],
  ])("matches a linear scan over 4000 seeded random scores: %s", (_label, thresholds) => {
    const rng = mulberry32(20250928);
    const lowest = thresholds[0].min;
    const highest = thresholds.at(-1).min;
    // Span the whole ladder plus a margin either side, so well below the floor
    // and well above the top are both sampled often.
    const span = (highest - lowest || 1) * 1.5;
    const start = lowest - span * 0.25;

    for (let i = 0; i < 4000; i += 1) {
      const score = start + rng() * span;
      expect(
        findTier(thresholds, score, FLOOR),
        `score ${score}`
      ).toBe(findTierLinear(thresholds, score, FLOOR));
    }
  });

  it("matches a linear scan when scores land exactly on threshold values", () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 1000; i += 1) {
      const thresholds = chestThresholds;
      const pick = thresholds[Math.floor(rng() * thresholds.length)];
      for (const score of [pick.min, nextDown(pick.min), pick.min * (1 + Number.EPSILON)]) {
        expect(findTier(thresholds, score, FLOOR), `score ${score}`).toBe(
          findTierLinear(thresholds, score, FLOOR)
        );
      }
    }
  });

  it("returns a tier when the score sits exactly on its threshold", () => {
    const thresholds = ladderOf([100, 200, 300]);
    expect(findTier(thresholds, 100, FLOOR)).toBe("T0");
    expect(findTier(thresholds, 200, FLOOR)).toBe("T1");
    expect(findTier(thresholds, 300, FLOOR)).toBe("T2");
  });

  it("drops to the tier below when the score is one ulp under a threshold", () => {
    const thresholds = ladderOf([100, 200, 300]);
    expect(findTier(thresholds, nextDown(100), FLOOR)).toBe(FLOOR);
    expect(findTier(thresholds, nextDown(200), FLOOR)).toBe("T0");
    expect(findTier(thresholds, nextDown(300), FLOOR)).toBe("T1");
  });

  it("returns the floor tier for anything below the lowest threshold", () => {
    const thresholds = ladderOf([100, 200, 300]);
    for (const score of [99.99, 0, -1, -Infinity, Number.MIN_VALUE]) {
      expect(findTier(thresholds, score, FLOOR), `score ${score}`).toBe(FLOOR);
    }
  });

  it("returns the top tier for anything above the highest threshold", () => {
    const thresholds = ladderOf([100, 200, 300]);
    for (const score of [300.0001, 1e9, Number.MAX_VALUE, Infinity]) {
      expect(findTier(thresholds, score, FLOOR), `score ${score}`).toBe("T2");
    }
  });

  it("returns the floor tier for an empty ladder or a NaN score", () => {
    expect(findTier([], 1000, FLOOR)).toBe(FLOOR);
    // Every comparison against NaN is false, so no threshold is ever cleared.
    expect(findTier(ladderOf([100, 200]), NaN, FLOOR)).toBe(FLOOR);
  });

  it("needs at most ceil(log2(n + 1)) comparisons", () => {
    // Counted through a proxy rather than asserted about wall-clock time, so the
    // complexity claim in the change log is actually tested.
    for (const size of [1, 2, 3, 7, 8, 10, 1000]) {
      const mins = Array.from({ length: size }, (_, i) => (i + 1) * 10);
      let comparisons = 0;
      const counted = mins.map((min, index) => ({
        tier: `T${index}`,
        get min() {
          comparisons += 1;
          return min;
        },
      }));

      const budget = Math.ceil(Math.log2(size + 1));
      for (const score of [0, 5, 15, mins.at(-1), mins.at(-1) + 1]) {
        comparisons = 0;
        findTier(counted, score, FLOOR);
        expect(comparisons, `n=${size}, score=${score}`).toBeLessThanOrEqual(budget);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// createRankingEngine
// ---------------------------------------------------------------------------

// A deliberately fictional muscle. The numbers are round placeholders chosen to
// make the thresholds easy to read (200 / 400 / 600), NOT fitness data: nothing
// here describes a real exercise or a real strength standard.
//
// It carried an `override` rule until Prompt 3 deleted that feature, and a
// fifth tier ("Over") that only the override could reach. Both are gone, and the
// config now carries the input bounds every lift needs.
const TEST_BOUNDS = { weight: { min: 1, max: 1000 }, reps: { min: 1, max: 30 } };

function testConfig(overrides = {}) {
  return {
    muscle: "test_muscle",
    multiplier: 2,
    lifts: [
      { key: "lift_a", formula: "volume", factor: 1, bounds: TEST_BOUNDS },
      { key: "lift_b", formula: "epley1RM", factor: 0.5, bounds: TEST_BOUNDS },
    ],
    tierOrder: ["Zero", "Low", "Mid", "High"],
    zeroTier: "Zero",
    floorTier: "Low",
    ladder: ["Low", "Mid", "High"],
    anchors: {
      Zero: null,
      Low: { lift_a: { weight: 10, reps: 10 } },
      Mid: { lift_a: { weight: 20, reps: 10 } },
      High: { lift_a: { weight: 30, reps: 10 } },
    },
    ...overrides,
  };
}

describe("createRankingEngine builds a third muscle from data alone", () => {
  // The whole point of the refactor: no new engine file, no new formula, no
  // change to rankingEngine.js — just a config object.
  const engine = createRankingEngine(testConfig());

  it("precomputes a sorted threshold ladder", () => {
    expect(engine.thresholds).toEqual([
      { tier: "Low", min: 200 },
      { tier: "Mid", min: 400 },
      { tier: "High", min: 600 },
    ]);
  });

  it("scores with the configured formulas, factors and multiplier", () => {
    // volume: (10 * 10) * 1 * 2
    expect(engine.score({ lift_a: { weight: 10, reps: 10 } })).toBe(200);
    // epley1RM: (100 * (1 + 10 / 30)) * 0.5 * 2
    expect(engine.score({ lift_b: { weight: 100, reps: 10 } })).toBe(
      100 * (1 + 10 / 30) * 0.5 * 2
    );
    expect(engine.score({})).toBe(0);
    expect(engine.score({ not_a_lift: { weight: 999, reps: 99 } })).toBe(0);
  });

  it.each([
    [{ lift_a: { weight: 25, reps: 10 } }, "Mid", 500],
    [{ lift_a: { weight: 10, reps: 10 } }, "Low", 200],
    [{ lift_a: { weight: 5, reps: 10 } }, "Low", 100],
    [{ lift_a: { weight: 500, reps: 10 } }, "High", 10000],
    [{}, "Zero", 0],
    [{ lift_a: { weight: -10, reps: 10 } }, "Zero", 0],
  ])("ranks %j as %s", (lifts, tier, score) => {
    expect(engine.rank(lifts)).toEqual({ muscle: "test_muscle", tier, score });
  });

  it("returns the zero tier for a non-positive or NaN score", () => {
    expect(engine.rank({ lift_b: { weight: 0, reps: 1 } }).tier).toBe("Zero");
    expect(engine.rank({ lift_a: { weight: -10, reps: 10 } })).toEqual({
      muscle: "test_muscle",
      tier: "Zero",
      score: 0,
    });
    // A score that rounds to zero is a zero score, not the floor tier: it is the
    // rounded value that gets stored, and 0 has to mean one thing.
    expect(engine.rank({ lift_a: { weight: 0.1, reps: 1 } })).toEqual({
      muscle: "test_muscle",
      tier: "Zero",
      score: 0,
    });
  });

  it("scores the top tier by score alone, with no override rule to shortcut it", () => {
    // The old config promoted a 500 lb single on lift_b straight to a tier
    // outside the ladder. That rule is deleted: a big single is worth its score.
    const result = engine.rank({ lift_b: { weight: 500, reps: 1 } });
    expect(result.tier).toBe("Mid");
    expect(result.score).toBe(Math.round(500 * (1 + 1 / 30) * 0.5 * 2));
    expect(engine.rank({ lift_b: { weight: 5000, reps: 1 } }).tier).toBe("High");
  });

  it("validates against the bounds in its own config", () => {
    expect(engine.validate({ lift_a: { weight: 10, reps: 10 } }).ok).toBe(false);
    expect(
      engine.validate({
        lift_a: { weight: 10, reps: 10 },
        lift_b: { weight: 100, reps: 5 },
      })
    ).toEqual({
      ok: true,
      lifts: { lift_a: { weight: 10, reps: 10 }, lift_b: { weight: 100, reps: 5 } },
    });
  });

  it("rounds the score once and classifies the tier from the rounded value", () => {
    // lift_a scores weight * reps * 1 * 2, so 100.3 lb x 1 rep is 200.6.
    const result = engine.rank({ lift_a: { weight: 100.3, reps: 1 } });
    expect(result.score).toBe(201);
    expect(Number.isInteger(result.score)).toBe(true);
    expect(findTier(engine.thresholds, result.score, "Low")).toBe(result.tier);
  });
});

describe("createRankingEngine validation", () => {
  it("accepts both real configs (already proven by importing index.js)", () => {
    // 11 since Prompt 3: Primordial is a ladder tier now, not an override tier.
    expect(getRankingEngine("chest").thresholds).toHaveLength(11);
    expect(getRankingEngine("back").thresholds).toHaveLength(11);
  });

  it("throws when ladder thresholds are not strictly increasing", () => {
    const config = testConfig({
      anchors: {
        ...testConfig().anchors,
        Mid: { lift_a: { weight: 5, reps: 10 } }, // 100, below Low's 200
      },
    });
    expect(() => createRankingEngine(config)).toThrow(/test_muscle/);
    expect(() => createRankingEngine(config)).toThrow(/strictly increase/);
    expect(() => createRankingEngine(config)).toThrow(/"Mid"/);
    expect(() => createRankingEngine(config)).toThrow(/"Low"/);
  });

  it("throws when two ladder tiers score the same (increase must be strict)", () => {
    const config = testConfig({
      anchors: { ...testConfig().anchors, Mid: { lift_a: { weight: 10, reps: 10 } } },
    });
    expect(() => createRankingEngine(config)).toThrow(/strictly increase/);
  });

  it("throws when a tier is duplicated in the ladder", () => {
    const config = testConfig({ ladder: ["Low", "Mid", "Mid", "High"] });
    expect(() => createRankingEngine(config)).toThrow(/test_muscle/);
    expect(() => createRankingEngine(config)).toThrow(/duplicated in the ladder/);
    expect(() => createRankingEngine(config)).toThrow(/"Mid"/);
  });

  it("throws when a tier is duplicated in the tier order", () => {
    const config = testConfig({ tierOrder: ["Zero", "Low", "Mid", "Mid", "High", "Over"] });
    expect(() => createRankingEngine(config)).toThrow(/duplicated in tierOrder/);
    expect(() => createRankingEngine(config)).toThrow(/"Mid"/);
  });

  it("does not point at the deleted override rule when a tier is unreachable", () => {
    const config = testConfig({ ladder: ["Low", "High"] });
    expect(() => createRankingEngine(config)).not.toThrow(/override/);
  });

  it("throws when a tier in the order is missing from the ladder", () => {
    // "Mid" is still listed as a tier but nothing can ever return it. Before
    // Prompt 3 an override tier was the one legitimate exception to this; now
    // there are only two ways out of rank(), so there are no exceptions.
    const config = testConfig({ ladder: ["Low", "High"] });
    expect(() => createRankingEngine(config)).toThrow(/test_muscle/);
    expect(() => createRankingEngine(config)).toThrow(/can never be returned/);
    expect(() => createRankingEngine(config)).toThrow(/"Mid"/);
  });

  it("throws when a ladder tier is missing from the tier order", () => {
    const config = testConfig({ ladder: ["Low", "Mid", "Nope"] });
    expect(() => createRankingEngine(config)).toThrow(/missing from tierOrder/);
    expect(() => createRankingEngine(config)).toThrow(/"Nope"/);
  });

  it("throws when the ladder does not follow the tier order", () => {
    const config = testConfig({ ladder: ["Mid", "Low", "High"] });
    expect(() => createRankingEngine(config)).toThrow(/must follow tierOrder/);
  });

  it("throws when an anchor uses a lift the muscle does not score", () => {
    const config = testConfig({
      anchors: { ...testConfig().anchors, Mid: { lift_c: { weight: 20, reps: 10 } } },
    });
    expect(() => createRankingEngine(config)).toThrow(/test_muscle/);
    expect(() => createRankingEngine(config)).toThrow(/unknown lift key/);
    expect(() => createRankingEngine(config)).toThrow(/"lift_c"/);
    expect(() => createRankingEngine(config)).toThrow(/"Mid"/);
  });

  it("throws when a lift names an unknown formula", () => {
    const config = testConfig({
      lifts: [{ key: "lift_a", formula: "bogus_formula", factor: 1 }],
    });
    expect(() => createRankingEngine(config)).toThrow(/test_muscle/);
    expect(() => createRankingEngine(config)).toThrow(/unknown formula "bogus_formula"/);
    // The message lists what is available, so the fix does not need the source.
    expect(() => createRankingEngine(config)).toThrow(/epley1RM/);
  });

  it("throws when a config brings back the deleted override rule", () => {
    // The rule was removed on purpose. Re-adding it as data would otherwise be
    // silently ignored, which is the worst of both outcomes: the config would
    // claim a promotion path that no longer exists.
    const config = testConfig({
      override: { tier: "High", lift: "lift_b", formula: "epley1RM", min: 500 },
    });
    expect(() => createRankingEngine(config)).toThrow(/unknown config key\(s\) "override"/);
    expect(() => createRankingEngine(config)).toThrow(/test_muscle/);
  });

  it("throws for any unknown key, on the config or on a lift", () => {
    expect(() => createRankingEngine(testConfig({ mutliplier: 3 }))).toThrow(
      /unknown config key\(s\) "mutliplier"/
    );
    expect(() =>
      createRankingEngine(
        testConfig({
          lifts: [{ key: "lift_a", formula: "volume", factor: 1, bounds: TEST_BOUNDS, min: 5 }],
        })
      )
    ).toThrow(/lift "lift_a" sets unknown key\(s\) "min"/);
  });

  it("throws when a lift has no usable input bounds", () => {
    const withBounds = (bounds) =>
      testConfig({ lifts: [{ key: "lift_a", formula: "volume", factor: 1, bounds }] });

    expect(() => createRankingEngine(withBounds(undefined))).toThrow(
      /lift "lift_a" needs input bounds for weight and reps/
    );
    expect(() => createRankingEngine(withBounds({ reps: { min: 1, max: 30 } }))).toThrow(
      /lift "lift_a" needs weight bounds with a min and a max/
    );
    expect(() =>
      createRankingEngine(withBounds({ weight: { min: 1, max: "lots" }, reps: { min: 1, max: 30 } }))
    ).toThrow(/finite weight max/);
    expect(() =>
      createRankingEngine(withBounds({ weight: { min: 500, max: 10 }, reps: { min: 1, max: 30 } }))
    ).toThrow(/weight min of 500 above its max of 10/);
    expect(() =>
      createRankingEngine(withBounds({ weight: { min: 0, max: 100 }, reps: { min: 1, max: 30 } }))
    ).toThrow(/needs a weight min above 0, got 0/);
    expect(() =>
      createRankingEngine(withBounds({ weight: { min: 1, max: 100 }, reps: { min: 1, max: 30.5 } }))
    ).toThrow(/whole-number reps max, got 30.5/);
  });

  it.each([0, -1, -0.5, NaN, Infinity, -Infinity, "2", null, undefined])(
    "throws when the multiplier is %s",
    (multiplier) => {
      expect(() => createRankingEngine(testConfig({ multiplier }))).toThrow(
        /multiplier must be a positive finite number/
      );
    }
  );

  it("throws when a lift factor is not finite", () => {
    const config = testConfig({ lifts: [{ key: "lift_a", formula: "volume", factor: NaN }] });
    expect(() => createRankingEngine(config)).toThrow(/finite factor/);
  });

  // lift_b has no anchor, so the ladder check cannot notice a bad factor on it;
  // only this check stops a heavier lift_b from scoring lower.
  it.each([0, -1, -0.5])("throws when a lift factor is %s", (factor) => {
    const [liftA, liftB] = testConfig().lifts;
    const config = testConfig({ lifts: [liftA, { ...liftB, factor }] });
    expect(() => createRankingEngine(config)).toThrow(/positive finite factor/);
  });

  it("throws when a ladder tier has no anchor lifts", () => {
    const config = testConfig({ anchors: { ...testConfig().anchors, Mid: null } });
    expect(() => createRankingEngine(config)).toThrow(/tier "Mid" has no anchor lifts/);
  });

  it("throws for a missing or malformed config", () => {
    expect(() => createRankingEngine(undefined)).toThrow(/expected an object/);
    expect(() => createRankingEngine(testConfig({ muscle: "" }))).toThrow(/non-empty string/);
    expect(() => createRankingEngine(testConfig({ lifts: [] }))).toThrow(/non-empty array/);
    expect(() => createRankingEngine(testConfig({ ladder: [] }))).toThrow(/non-empty array/);
  });

  it("names the muscle in every error, so a startup crash says which config is wrong", () => {
    const config = testConfig({ multiplier: 0 });
    expect(() => createRankingEngine(config)).toThrow(/ranking config for "test_muscle"/);
  });
});
