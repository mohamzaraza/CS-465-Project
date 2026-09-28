import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

import {
  BACK_TIERS_IN_ORDER,
  BACK_TIER_ANCHORS,
  CHEST_TIERS_IN_ORDER,
  CHEST_TIER_ANCHORS,
  computeBackScore,
  computeBackTier,
  computeChestScore,
  computeChestTier,
  getRankingEngine,
} from "../src/ranking/index.js";

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

// The engines used to export precomputed CHEST_TIER_SCORES / BACK_TIER_SCORES
// tables, which existed only to feed an import-time console.log. Enhancement 2
// deleted them. Rebuilding the same table here from the anchor data keeps the
// assertions below on exactly the values they were written against.
function anchorScoreTable(tiers, anchors, computeScore) {
  return Object.fromEntries(
    tiers.map((tier) => [tier, anchors[tier] ? computeScore(anchors[tier]) : 0])
  );
}

const CHEST_TIER_SCORES = anchorScoreTable(
  CHEST_TIERS_IN_ORDER,
  CHEST_TIER_ANCHORS,
  computeChestScore
);
const BACK_TIER_SCORES = anchorScoreTable(
  BACK_TIERS_IN_ORDER,
  BACK_TIER_ANCHORS,
  computeBackScore
);

// A set whose recorded tier and score are asserted below; reused by the
// import-order tests, which need a call whose answer is already pinned.
const MID_CHEST_SET = {
  bench: { weight: 95, reps: 8 },
  incline_db: { weight: 25, reps: 8 },
  cable: { weight: 10, reps: 12 },
};

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
    const result = computeChestTier(MID_CHEST_SET);
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

  it("the inversion survives only because Primordial is outside the ladder", () => {
    // What the engine now guarantees: the tiers it actually searches strictly
    // increase, for both muscles. The chest inversion above is still there, but
    // it can only hide in the override tier, which the ladder excludes.
    for (const muscle of ["chest", "back"]) {
      const mins = getRankingEngine(muscle).thresholds.map((threshold) => threshold.min);
      expect(mins.length, `${muscle} ladder length`).toBe(10);
      for (let i = 1; i < mins.length; i += 1) {
        expect(mins[i], `${muscle} threshold ${i}`).toBeGreaterThan(mins[i - 1]);
      }
    }
    const ladderTiers = getRankingEngine("chest").thresholds.map((t) => t.tier);
    expect(ladderTiers).not.toContain("Primordial");
    expect(ladderTiers).not.toContain("Untrained");
  });

  it("DEFECT: 0.02 lb of bench skips nine tiers", () => {
    const below = fixture.cases.find((c) => c.id === "chest-override-below");
    const above = fixture.cases.find((c) => c.id === "chest-override-above");
    expect(computeChestTier(below.lifts).tier).toBe("Novice");
    expect(computeChestTier(above.lifts).tier).toBe("Primordial");
    expect(above.lifts.bench.weight - below.lifts.bench.weight).toBeLessThan(0.02);
  });
});

describe("ranking module imports are order-independent", () => {
  // Before Enhancement 2 this file could only be written one way round: the
  // anchors modules had to be imported before the *Ranking.js modules, or Vite's
  // SSR transform failed the whole suite with "Cannot access
  // '__vite_ssr_import_0__' before initialization". The cycle is gone, so the
  // order cannot matter any more. These tests are what proves it, and they fail
  // if a cycle is ever reintroduced.
  //
  // vi.resetModules() gives each case a fresh registry, so the engines really
  // are rebuilt in the order under test rather than served from cache.

  it("works when rankingEngine.js is imported before rankingConfig.js", async () => {
    vi.resetModules();
    const { createRankingEngine } = await import("../src/ranking/rankingEngine.js");
    const { CHEST_CONFIG } = await import("../src/ranking/rankingConfig.js");

    expect(createRankingEngine(CHEST_CONFIG).rank(MID_CHEST_SET).tier).toBe("Novice");
  });

  it("works when rankingConfig.js is imported before rankingEngine.js", async () => {
    vi.resetModules();
    const { CHEST_CONFIG } = await import("../src/ranking/rankingConfig.js");
    const { createRankingEngine } = await import("../src/ranking/rankingEngine.js");

    expect(createRankingEngine(CHEST_CONFIG).rank(MID_CHEST_SET).tier).toBe("Novice");
  });

  it("works when index.js is imported first, before anything it depends on", async () => {
    vi.resetModules();
    const ranking = await import("../src/ranking/index.js");

    expect(ranking.computeChestTier(MID_CHEST_SET).tier).toBe("Novice");
    expect(ranking.computeChestTier(MID_CHEST_SET).score).toBeCloseTo(538, SCORE_PRECISION);
  });

  it("works when index.js is imported last, after everything it depends on", async () => {
    vi.resetModules();
    await import("../src/ranking/formulas.js");
    await import("../src/ranking/rankingConfig.js");
    await import("../src/ranking/rankingEngine.js");
    const ranking = await import("../src/ranking/index.js");

    expect(ranking.computeChestTier(MID_CHEST_SET).tier).toBe("Novice");
    expect(ranking.computeBackTier({ deadlift: { weight: 600, reps: 1 } }).tier).toBe(
      "Primordial"
    );
  });
});

describe("ranking golden master under plain Node", () => {
  // Running the checker as a child process proves the fixture holds under
  // Node's own module and number semantics, not just under Vite's transform —
  // a guard this suite cannot provide from the inside.
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
