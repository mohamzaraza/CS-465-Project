import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// IMPORT ORDER MATTERS AND IS NOT COSMETIC.
// chestRanking.js and chestTierAnchors.js import each other, and so do the two
// back files. Entering the cycle through a *Ranking.js module makes Vitest fail
// the whole suite with "Cannot access '__vite_ssr_import_0__' before
// initialization", because Vite's SSR transform has not yet assigned
// CHEST_MULTIPLIER when the anchors module computes CHEST_TIER_SCORES at the
// top level. Entering through the anchors module works. Plain Node tolerates
// either order, which is why the bug only shows up under test.
// Enhancement 2 removes the cycle; until then, do not reorder these.
import {
  CHEST_TIERS_IN_ORDER,
  CHEST_TIER_SCORES,
} from "../src/ranking/chestTierAnchors.js";
import {
  BACK_TIERS_IN_ORDER,
  BACK_TIER_SCORES,
} from "../src/ranking/backTierAnchors.js";
import { computeChestTier } from "../src/ranking/chestRanking.js";
import { computeBackTier } from "../src/ranking/backRanking.js";

// These tests characterize the engines as they behave TODAY. Several recorded
// outputs are wrong; the "known defects" block names them. Nothing here should
// be edited to make a future change pass — a failure means behavior moved, and
// the move has to be deliberate.

const fixture = JSON.parse(
  readFileSync(new URL("./fixtures/ranking-golden.json", import.meta.url), "utf8")
);

// Scores are products and sums of doubles, so they reproduce exactly; the
// tolerance only guards against a future Node rounding difference.
const SCORE_PRECISION = 6;

const computeTier = { chest: computeChestTier, back: computeBackTier };

function expectMatchesFixture(entry) {
  const result = computeTier[entry.muscle](entry.lifts);
  expect(result.muscle, `${entry.id} muscle`).toBe(entry.muscle);
  expect(result.tier, `${entry.id} tier (lifts ${JSON.stringify(entry.lifts)})`).toBe(
    entry.expected.tier
  );
  expect(result.score, `${entry.id} score`).toBeCloseTo(
    entry.expected.score,
    SCORE_PRECISION
  );
}

const groups = [...new Set(fixture.cases.map((c) => `${c.muscle}/${c.group}`))];

describe("ranking golden master", () => {
  it("has a fixture with the recorded number of cases", () => {
    expect(fixture.cases).toHaveLength(fixture.caseCount);
    expect(fixture.cases.length).toBeGreaterThan(700);
    expect(fixture.knownDefects.length).toBeGreaterThan(0);
  });

  it.each(groups)("reproduces every recorded output for %s", (group) => {
    const entries = fixture.cases.filter((c) => `${c.muscle}/${c.group}` === group);
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) expectMatchesFixture(entry);
  });

  it("reaches every tier for both muscles", () => {
    for (const [muscle, tiers] of [
      ["chest", CHEST_TIERS_IN_ORDER],
      ["back", BACK_TIERS_IN_ORDER],
    ]) {
      const reached = new Set(
        fixture.cases.filter((c) => c.muscle === muscle).map((c) => c.expected.tier)
      );
      for (const tier of tiers) expect(reached, `${muscle} ${tier}`).toContain(tier);
    }
  });

  it("matches the recorded anchor score for every tier", () => {
    for (const [muscle, recorded] of Object.entries(fixture.anchorScores)) {
      for (const [tier, score] of Object.entries(recorded)) {
        const anchorCase = fixture.cases.find((c) => c.id === `${muscle}-anchor-${tier}`);
        if (!anchorCase) {
          expect(score, `${muscle} ${tier} has no anchor lifts`).toBe(0);
          continue;
        }
        expect(
          computeTier[muscle](anchorCase.lifts).score,
          `${muscle} ${tier} anchor`
        ).toBeCloseTo(score, SCORE_PRECISION);
      }
    }
  });
});

describe("ranking known values (measured before Enhancement 2)", () => {
  it("scores a mid-level chest set as Novice", () => {
    const result = computeChestTier({
      bench: { weight: 95, reps: 8 },
      incline_db: { weight: 25, reps: 8 },
      cable: { weight: 10, reps: 12 },
    });
    expect(result.tier).toBe("Novice");
    expect(result.score).toBeCloseTo(538, SCORE_PRECISION);
  });

  it("scores a stronger chest set as Heroic", () => {
    const result = computeChestTier({
      bench: { weight: 135, reps: 8 },
      incline_db: { weight: 45, reps: 8 },
      cable: { weight: 20, reps: 12 },
    });
    expect(result.tier).toBe("Heroic");
    expect(result.score).toBeCloseTo(939.6, SCORE_PRECISION);
  });

  it("returns the full tier list in rank order for both muscles", () => {
    expect(CHEST_TIERS_IN_ORDER[0]).toBe("Untrained");
    expect(CHEST_TIERS_IN_ORDER.at(-1)).toBe("Primordial");
    expect(BACK_TIERS_IN_ORDER).toEqual(CHEST_TIERS_IN_ORDER);
  });
});

describe("ranking known defects (recorded, not endorsed)", () => {
  it("reproduces every recorded defect exactly", () => {
    for (const entry of fixture.knownDefects) expectMatchesFixture(entry);
  });

  it("DEFECT: a score below the Recruit anchor still reports Recruit", () => {
    const result = computeChestTier({ incline_db: { weight: 15, reps: 8 } });
    expect(result.tier).toBe("Recruit");
    expect(result.score).toBeCloseTo(158.4, SCORE_PRECISION);
    // The whole point: the score does not reach the tier it is reported as.
    expect(result.score).toBeLessThan(fixture.anchorScores.chest.Recruit);
  });

  it("DEFECT: unbounded reps let 15 lb dumbbells reach Celestial", () => {
    const result = computeChestTier({ incline_db: { weight: 15, reps: 100 } });
    expect(result.tier).toBe("Celestial");
    expect(result.score).toBeCloseTo(1980, SCORE_PRECISION);
  });

  it("DEFECT: the chest Primordial override ignores the score", () => {
    const result = computeChestTier({ bench: { weight: 415, reps: 1 } });
    expect(result.tier).toBe("Primordial");
    expect(result.score).toBeCloseTo(514.6, SCORE_PRECISION);
    expect(result.score).toBeLessThan(fixture.anchorScores.chest.Warrior);
  });

  it("DEFECT: the back Primordial override ignores the score too", () => {
    const result = computeBackTier({ deadlift: { weight: 600, reps: 1 } });
    expect(result.tier).toBe("Primordial");
    expect(result.score).toBeCloseTo(334.8, SCORE_PRECISION);
    expect(result.score).toBeLessThan(fixture.anchorScores.back.Recruit);
  });

  it("DEFECT: nothing bounds the weight or rep count", () => {
    const result = computeChestTier({ bench: { weight: 99999, reps: 99 } });
    expect(result.tier).toBe("Primordial");
    expect(result.score).toBeGreaterThan(515000);
    expect(result.score).toBeCloseTo(515994.84, SCORE_PRECISION);
  });

  it("DEFECT: chest anchor scores are not strictly increasing", () => {
    expect(CHEST_TIER_SCORES.Primordial).toBeLessThan(CHEST_TIER_SCORES.Immortal);
    // Back happens to be ordered correctly, which is why only chest misranks.
    const backScores = BACK_TIERS_IN_ORDER.map((tier) => BACK_TIER_SCORES[tier]);
    expect(backScores).toEqual([...backScores].sort((a, b) => a - b));
  });

  it("DEFECT: 0.02 lb of bench skips nine tiers", () => {
    const below = fixture.cases.find((c) => c.id === "chest-override-below");
    const above = fixture.cases.find((c) => c.id === "chest-override-above");
    expect(computeChestTier(below.lifts).tier).toBe("Novice");
    expect(computeChestTier(above.lifts).tier).toBe("Primordial");
    expect(above.lifts.bench.weight - below.lifts.bench.weight).toBeLessThan(0.02);
  });
});

describe("ranking golden master under plain Node", () => {
  // Vitest only survives the import cycle because this file imports the anchors
  // modules first. Running the checker as a child process proves the fixture
  // also holds under Node's own module semantics, where the cycle resolves
  // differently — a guard this suite cannot provide from the inside.
  it("passes check-ranking-golden.mjs with exit code 0", () => {
    const script = fileURLToPath(
      new URL("../scripts/check-ranking-golden.mjs", import.meta.url)
    );

    let status = 0;
    let output = "";
    try {
      output = execFileSync(process.execPath, [script], { encoding: "utf8" });
    } catch (err) {
      status = err.status ?? 1;
      output = `${err.stdout ?? ""}${err.stderr ?? ""}`;
    }

    expect(output).toContain("Ranking golden master OK");
    expect(status).toBe(0);
  }, 30000);
});
