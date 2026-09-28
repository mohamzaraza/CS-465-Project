// The characterization suite asserts fixture scores with toBeCloseTo, which is
// the right tolerance for a golden master that has to survive a future Node
// release. This file is the stricter companion: it asserts every recorded score
// with toBe, i.e. Object.is, i.e. bit equality.
//
// That is a claim about the refactor, not about the engine's maths: Enhancement
// 2 reorganised the code around a config and a binary search, and every
// arithmetic operation was kept in its original order, so the doubles have to
// come out identical. If a later change makes one of these fail while the
// toBeCloseTo version still passes, the arithmetic moved by a few ulps and that
// needs to be a deliberate decision, not a surprise.
//
// The fixture is now v2: Prompt 3 changed behavior on purpose, so v1 can no
// longer be reproduced and lives on only as the "before" side of
// ranking.behavior-changes.test.js. The claim above is unchanged — v2 scores are
// v1 scores rounded, and the rounding is the only step added to the arithmetic.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  BACK_TIER_ANCHORS,
  CHEST_TIER_ANCHORS,
  computeBackScore,
  computeBackTier,
  computeChestScore,
  computeChestTier,
  validateLifts,
} from "../src/ranking/index.js";

const fixture = JSON.parse(
  readFileSync(new URL("./fixtures/ranking-golden-v2.json", import.meta.url), "utf8")
);

const computeTier = { chest: computeChestTier, back: computeBackTier };
const computeScore = { chest: computeChestScore, back: computeBackScore };
const anchorsOf = { chest: CHEST_TIER_ANCHORS, back: BACK_TIER_ANCHORS };

const entries = [...fixture.cases, ...fixture.knownDefects];

// An entry records either a score or a refusal. Both are checked bit-for-bit:
// the refusal messages are part of the contract now, and a changed one means the
// client's error text changed.
function expectReproducedExactly(entry) {
  const checked = validateLifts(entry.muscle, entry.lifts);

  if (entry.rejected) {
    expect(checked.ok, `${entry.id} should be rejected`).toBe(false);
    expect(checked.errors, `${entry.id} rejection messages`).toEqual(entry.rejected.errors);
    return;
  }

  expect(checked.ok, `${entry.id} should be accepted`).toBe(true);
  const result = computeTier[entry.muscle](checked.lifts);
  expect(result.muscle, `${entry.id} muscle`).toBe(entry.muscle);
  expect(result.tier, `${entry.id} tier`).toBe(entry.expected.tier);
  // toBe on a number is Object.is: no tolerance at all.
  expect(result.score, `${entry.id} score`).toBe(entry.expected.score);
}

describe("ranking golden master, to the last bit", () => {
  it("covers every fixture entry", () => {
    expect(entries).toHaveLength(fixture.caseCount + fixture.knownDefects.length);
    expect(entries.length).toBeGreaterThan(700);
  });

  // Grouped like the characterization suite so the output stays readable; the
  // per-assertion label is what names the failing case.
  const groups = [...new Set(fixture.cases.map((c) => `${c.muscle}/${c.group}`))];

  it.each(groups)("reproduces every outcome in %s bit-for-bit", (group) => {
    const groupEntries = fixture.cases.filter((c) => `${c.muscle}/${c.group}` === group);
    expect(groupEntries.length).toBeGreaterThan(0);

    for (const entry of groupEntries) expectReproducedExactly(entry);
  });

  it("reproduces every known defect bit-for-bit", () => {
    for (const entry of fixture.knownDefects) expectReproducedExactly(entry);
  });

  it("reproduces every recorded anchor score exactly", () => {
    // anchorScores holds the raw doubles the anchor lifts produce; `thresholds`
    // holds those values rounded, which is what rank() compares against. Both are
    // asserted, because the rounding is what a future change is most likely to
    // get subtly wrong.
    for (const [muscle, tiers] of Object.entries(fixture.anchorScores)) {
      for (const [tier, expected] of Object.entries(tiers)) {
        const anchor = anchorsOf[muscle][tier];
        // Untrained has no anchor lifts and is recorded as 0.
        const actual = anchor ? computeScore[muscle](anchor) : 0;
        expect(actual, `${muscle} ${tier} anchor`).toBe(expected);

        if (anchor) {
          expect(fixture.thresholds[muscle][tier], `${muscle} ${tier} threshold`).toBe(
            Math.round(expected)
          );
          expect(computeTier[muscle](anchor).score, `${muscle} ${tier} rank score`).toBe(
            Math.round(expected)
          );
        }
      }
    }
  });

  it("reproduces the recorded multipliers exactly", () => {
    // The dead src/config/muscleMultipliers.js claimed back was 1.25. It was
    // imported by nothing and it was wrong; the fixture records what ran.
    expect(fixture.multipliers.chest).toBe(1.2);
    expect(fixture.multipliers.back).toBe(1.2);

    // Derived from the engine rather than read from a constant, so a config typo
    // cannot satisfy this by agreeing with itself.
    const perLb = computeChestScore({ incline_db: { weight: 1, reps: 1 } });
    expect(perLb).toBe(1.1 * fixture.multipliers.chest);
  });
});
