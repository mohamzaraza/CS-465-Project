// Property test tying the pieces together. The golden master pins specific
// answers; this checks the rules every answer must obey, over thousands of
// random but VALID lift sets drawn from each muscle's own configured bounds:
//   1. validateLifts accepts every set drawn inside the bounds,
//   2. rank() returns a whole-number score,
//   3. findTier on the stored score re-derives the stored tier,
//   4. raising any one lift's weight or reps never lowers the score.
//
// Seeded so a failure reproduces exactly; no dependency needed for that.

import { describe, expect, it } from "vitest";
import { RANKING_CONFIGS } from "../src/ranking/rankingConfig.js";
import { getRankingEngine, rankLifts, validateLifts } from "../src/ranking/index.js";
import { findTier } from "../src/ranking/rankingEngine.js";

const SETS_PER_MUSCLE = 3000;

// mulberry32: small, fast, and good enough to spread inputs across the bounds.
function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

// Weights are mostly whole pounds, sometimes quarter pounds, so the property
// also covers fractional plates, and a few land exactly on a bound.
function randomWeight(random, { min, max }) {
  const roll = random();
  if (roll < 0.05) return min;
  if (roll < 0.1) return max;
  if (roll < 0.3) return Math.min(max, min + Math.floor(random() * (max - min) * 4) / 4);
  return randomInt(random, min, max);
}

function randomLifts(random, config) {
  const lifts = {};
  for (const { key, bounds } of config.lifts) {
    lifts[key] = {
      weight: randomWeight(random, bounds.weight),
      reps: randomInt(random, bounds.reps.min, bounds.reps.max),
    };
  }
  return lifts;
}

// A copy with one field of one lift raised, clamped to its bound so the result
// is still valid input.
function raised(lifts, key, field, amount, max) {
  const entry = lifts[key];
  return { ...lifts, [key]: { ...entry, [field]: Math.min(max, entry[field] + amount) } };
}

describe.each(RANKING_CONFIGS)("ranking properties for $muscle", (config) => {
  const { muscle, floorTier } = config;
  const { thresholds } = getRankingEngine(muscle);
  const random = seededRandom(0x5eed + muscle.length);
  const sets = Array.from({ length: SETS_PER_MUSCLE }, () => randomLifts(random, config));

  it("validateLifts accepts every set drawn inside the configured bounds", () => {
    for (const lifts of sets) {
      const checked = validateLifts(muscle, lifts);
      expect(checked, JSON.stringify(lifts)).toEqual({ ok: true, lifts });
    }
  });

  it("rank() returns a whole-number score whose tier findTier re-derives", () => {
    for (const lifts of sets) {
      const { score, tier } = rankLifts(muscle, lifts);
      expect(Number.isInteger(score), JSON.stringify(lifts)).toBe(true);
      expect(findTier(thresholds, score, floorTier), JSON.stringify(lifts)).toBe(tier);
    }
  });

  it("never lowers the score when one lift's weight or reps goes up", () => {
    for (const lifts of sets) {
      const before = rankLifts(muscle, lifts).score;
      for (const { key, bounds } of config.lifts) {
        const step = randomInt(random, 1, 25);
        const heavier = raised(lifts, key, "weight", step, bounds.weight.max);
        const moreReps = raised(lifts, key, "reps", 1, bounds.reps.max);
        for (const next of [heavier, moreReps]) {
          expect(validateLifts(muscle, next).ok).toBe(true);
          expect(rankLifts(muscle, next).score, JSON.stringify({ lifts, next })).toBeGreaterThanOrEqual(
            before
          );
        }
      }
    }
  });
});
