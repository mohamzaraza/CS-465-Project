// Prompt 3 made rank() round once and classify from the rounded value. The
// property this buys is the one Enhancement 3 depends on: a stored score is
// enough to re-derive the tier it was stored with. The database column is an
// integer, so anything else means a row whose tier and score disagree.

import { describe, expect, it } from "vitest";

import { findTier } from "../src/ranking/rankingEngine.js";
import { getRankingEngine, rankLifts, validateLifts } from "../src/ranking/index.js";
import { BACK_CONFIG, CHEST_CONFIG, RANKING_CONFIGS } from "../src/ranking/rankingConfig.js";

// mulberry32, the generator the fixture script uses, kept local so this file
// needs no dependency. Seeded, so a failure is reproducible.
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

const CASES_PER_MUSCLE = 3000;

// Draws inside each lift's own configured bounds, so every generated set is
// valid by construction — and asserted to be, below, so a bounds change cannot
// silently turn this into a test of invalid input.
function randomLifts(config, rng) {
  const lifts = {};
  for (const lift of config.lifts) {
    const { weight, reps } = lift.bounds;
    // Quarter-pound steps: fractional weights are legal, and a score that lands
    // near a .5 boundary is exactly what this test needs to sample.
    const raw = weight.min + rng() * (weight.max - weight.min);
    lifts[lift.key] = {
      weight: Math.round(raw * 4) / 4,
      reps: reps.min + Math.floor(rng() * (reps.max - reps.min + 1)),
    };
  }
  return lifts;
}

describe.each(RANKING_CONFIGS.map((config) => [config.muscle, config]))(
  "rounding property: %s",
  (muscle, config) => {
    const engine = getRankingEngine(muscle);

    it(`re-derives the tier from the stored score for ${CASES_PER_MUSCLE} random valid sets`, () => {
      const rng = mulberry32(20250928);
      const tiersSeen = new Set();

      for (let i = 0; i < CASES_PER_MUSCLE; i += 1) {
        const lifts = randomLifts(config, rng);
        const label = JSON.stringify(lifts);

        // The premise: these are valid inputs. If this ever fails, the rest of
        // the assertions are meaningless, so it is checked rather than assumed.
        expect(validateLifts(muscle, lifts).ok, `expected valid: ${label}`).toBe(true);

        const result = rankLifts(muscle, lifts);

        // The property itself: the stored integer is enough to recover the tier.
        expect(findTier(engine.thresholds, result.score, config.floorTier), label).toBe(
          result.tier
        );

        tiersSeen.add(result.tier);
      }

      // A test that only ever produced Recruit would pass the property while
      // proving nothing about the ladder.
      expect(tiersSeen.size).toBeGreaterThan(5);
    });

    it("returns a whole number that is the rounded raw score", () => {
      const rng = mulberry32(7);
      for (let i = 0; i < 500; i += 1) {
        const lifts = randomLifts(config, rng);
        const result = rankLifts(muscle, lifts);

        expect(Number.isInteger(result.score), JSON.stringify(lifts)).toBe(true);
        expect(result.score).toBe(Math.round(engine.score(lifts)));
      }
    });

    it("has an all-integer, strictly increasing threshold ladder", () => {
      const mins = engine.thresholds.map((threshold) => threshold.min);
      expect(mins.every(Number.isInteger)).toBe(true);
      for (let i = 1; i < mins.length; i += 1) {
        expect(mins[i], `${engine.thresholds[i].tier}`).toBeGreaterThan(mins[i - 1]);
      }
    });

    it("covers every tier in the ladder, so the property was tested against all of them", () => {
      // Scored straight from each tier's own anchor: the anchor is defined as the
      // first set that reaches its tier, so this must hold exactly.
      for (const { tier, min } of engine.thresholds) {
        const result = rankLifts(muscle, config.anchors[tier]);
        expect(result.tier, `${tier} anchor`).toBe(tier);
        expect(result.score, `${tier} anchor`).toBe(min);
      }
    });
  }
);

describe("the boundary the rounding creates", () => {
  const engine = getRankingEngine("chest");
  const immortal = engine.thresholds.find((threshold) => threshold.tier === "Immortal");

  // incline_db is scored as weight * reps * 1.1 * 1.2, so its weight is a
  // continuous dial on the total: enough to land a score anywhere.
  function chestSetScoring(target) {
    const perLb = engine.score({ incline_db: { weight: 1, reps: 8 } });
    const base = engine.score({
      bench: { weight: 300, reps: 4 },
      cable: { weight: 40, reps: 10 },
    });
    return {
      bench: { weight: 300, reps: 4 },
      incline_db: { weight: (target - base) / perLb, reps: 8 },
      cable: { weight: 40, reps: 10 },
    };
  }

  it("promotes at exactly the rounded threshold, not half a point earlier", () => {
    const justUnder = rankLifts("chest", chestSetScoring(immortal.min - 0.5001));
    const atIt = rankLifts("chest", chestSetScoring(immortal.min));

    expect(justUnder.score).toBe(immortal.min - 1);
    expect(justUnder.tier).toBe("Celestial");
    expect(atIt.score).toBe(immortal.min);
    expect(atIt.tier).toBe("Immortal");
  });

  it("rounds a score half a point below the threshold up into the tier", () => {
    // Honest about what rounding does rather than pretending the boundary is
    // exact: a raw 2252.6 is stored as 2253 and IS Immortal.
    const result = rankLifts("chest", chestSetScoring(immortal.min - 0.4));
    expect(result.score).toBe(immortal.min);
    expect(result.tier).toBe("Immortal");
    expect(findTier(engine.thresholds, result.score, "Recruit")).toBe("Immortal");
  });
});

describe("startup validation of the rounded ladder", () => {
  // The risk rounding introduces: two anchors that differ as doubles but not as
  // integers. Without this check one of the two tiers would be unreachable.
  it("refuses a config whose anchors collide only after rounding", async () => {
    const { createRankingEngine } = await import("../src/ranking/rankingEngine.js");

    const raw = createRankingEngine(CHEST_CONFIG).score;
    const config = structuredClone(CHEST_CONFIG);

    // Novice scores 497.6. Solve for the cable weight that puts Warrior 0.3
    // above it: still strictly increasing as doubles, identical as integers.
    const perLb = raw({ cable: { weight: 1, reps: 12 } });
    const target = raw(CHEST_CONFIG.anchors.Novice) + 0.3;
    const base = raw({ bench: { weight: 65, reps: 10 }, incline_db: { weight: 25, reps: 8 } });
    config.anchors.Warrior = {
      bench: { weight: 65, reps: 10 },
      incline_db: { weight: 25, reps: 8 },
      cable: { weight: (target - base) / perLb, reps: 12 },
    };

    expect(raw(config.anchors.Warrior)).toBeGreaterThan(raw(CHEST_CONFIG.anchors.Novice));
    expect(Math.round(raw(config.anchors.Warrior))).toBe(
      Math.round(raw(CHEST_CONFIG.anchors.Novice))
    );

    expect(() => createRankingEngine(config)).toThrow(/strictly increase after rounding/);
    expect(() => createRankingEngine(config)).toThrow(/"Warrior"/);
    expect(() => createRankingEngine(config)).toThrow(/"Novice"/);
  });

  it("would refuse the v1 chest Primordial anchor, which scored below Immortal", async () => {
    const { createRankingEngine } = await import("../src/ranking/rankingEngine.js");

    const config = structuredClone(CHEST_CONFIG);
    config.anchors.Primordial = {
      bench: { weight: 405, reps: 1 },
      incline_db: { weight: 115, reps: 4 },
      cable: { weight: 55, reps: 10 },
    };

    expect(() => createRankingEngine(config)).toThrow(/strictly increase after rounding/);
    expect(() => createRankingEngine(config)).toThrow(/"Primordial" scores 1703/);
    expect(() => createRankingEngine(config)).toThrow(/"Immortal" scores 2253/);
  });

  it("both real configs pass, with Primordial now inside the ladder", () => {
    for (const config of [CHEST_CONFIG, BACK_CONFIG]) {
      const ladder = getRankingEngine(config.muscle).thresholds.map((t) => t.tier);
      expect(ladder).toContain("Primordial");
      expect(ladder).toHaveLength(config.tierOrder.length - 1); // all but Untrained
      expect(ladder.at(-1)).toBe("Primordial");
    }
  });
});
