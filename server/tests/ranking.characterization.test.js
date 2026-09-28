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
  validateLifts,
} from "../src/ranking/index.js";

// These tests characterize the engines as they behave TODAY, against the v2
// fixture. Some recorded outputs are still wrong; the "known defects" block names
// them and says which ones Prompt 3 closed. Nothing here should be edited to make
// a future change pass — a failure means behavior moved, and the move has to be
// deliberate.

const fixture = JSON.parse(
  readFileSync(new URL("./fixtures/ranking-golden-v2.json", import.meta.url), "utf8")
);

// Scores are whole numbers now, so this is exact equality; the tolerance is kept
// for the raw anchor scores, which are still doubles.
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
  const checked = validateLifts(entry.muscle, entry.lifts);

  // An entry records a score or a refusal, never both.
  if (entry.rejected) {
    expect(checked.ok, `${entry.id} should be rejected`).toBe(false);
    expect(checked.errors, `${entry.id} rejection`).toEqual(entry.rejected.errors);
    return;
  }

  expect(checked.ok, `${entry.id} should be accepted: ${checked.errors?.join(" ")}`).toBe(true);

  const result = computeTier[entry.muscle](checked.lifts);
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

  it("reaches every scored tier for both muscles", () => {
    for (const [muscle, tiers] of [
      ["chest", CHEST_TIERS_IN_ORDER],
      ["back", BACK_TIERS_IN_ORDER],
    ]) {
      const reached = new Set(
        fixture.cases
          .filter((c) => c.muscle === muscle && c.expected)
          .map((c) => c.expected.tier)
      );

      // Primordial is in this list for the first time: v1 could only reach it
      // through the 1RM override, which the ladder excluded.
      for (const tier of tiers) {
        if (tier === "Untrained") continue;
        expect(reached, `${muscle} ${tier}`).toContain(tier);
      }

      // The knock-on of the input bounds, asserted rather than left implicit:
      // every lift must be at least 1 lb for 1 rep, so no accepted input can
      // score 0, and Untrained now means "never ranked" rather than a result.
      expect(reached, `${muscle} Untrained`).not.toContain("Untrained");
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
        // The recorded value is the raw double; rank() returns it rounded.
        expect(
          computeTier[muscle](anchorCase.lifts).score,
          `${muscle} ${tier} anchor`
        ).toBeCloseTo(Math.round(score), SCORE_PRECISION);
      }
    }
  });
});

describe("ranking known values (measured before Enhancement 2)", () => {
  it("scores a mid-level chest set as Novice", () => {
    const result = computeChestTier(MID_CHEST_SET);
    expect(result.tier).toBe("Novice");
    expect(result.score).toBe(538);
  });

  it("scores a stronger chest set as Heroic", () => {
    const result = computeChestTier({
      bench: { weight: 135, reps: 8 },
      incline_db: { weight: 45, reps: 8 },
      cable: { weight: 20, reps: 12 },
    });
    expect(result.tier).toBe("Heroic");
    // 939.6 before Prompt 3, which stored 940 anyway: the controller rounded
    // after the tier had been chosen. The engine now rounds first.
    expect(result.score).toBe(940);
    expect(computeChestScore(CHEST_TIER_ANCHORS.Heroic)).toBeCloseTo(939.6, SCORE_PRECISION);
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

  it("records a status for every defect, and agrees with the outcome", () => {
    for (const entry of fixture.knownDefects) {
      expect(["fixed", "reduced", "open"], entry.id).toContain(entry.status);
      expect(entry.resolution, entry.id).toBeTruthy();
    }
    // Four of the six v1 defects are closed; the two that are not are the floor
    // tier and the volume formula, both deliberately left for later.
    const byStatus = fixture.knownDefects.reduce((counts, entry) => {
      counts[entry.status] = (counts[entry.status] ?? 0) + 1;
      return counts;
    }, {});
    expect(byStatus).toEqual({ fixed: 4, reduced: 1, open: 4 });
  });

  it("STILL OPEN: a score below the Recruit anchor is reported as Recruit", () => {
    // v1 showed this with incline_db alone, which is refused now. Same defect,
    // shown with a complete set: three lifts at the lightest legal weight.
    const result = computeChestTier({
      bench: { weight: 45, reps: 1 },
      incline_db: { weight: 15, reps: 1 },
      cable: { weight: 5, reps: 1 },
    });
    expect(result.tier).toBe("Recruit");
    expect(result.score).toBe(81);
    // The whole point: the score does not reach the tier it is reported as.
    expect(result.score).toBeLessThan(fixture.thresholds.chest.Recruit);
  });

  it("STILL OPEN: the rep cap reduces the volume exploit without closing it", () => {
    // 100 reps is refused now, but 30 is not, and volume is linear in reps. The
    // Heroic anchor's own weights, claimed for 30 reps each, reach the top tier.
    const result = computeChestTier({
      bench: { weight: 135, reps: 30 },
      incline_db: { weight: 45, reps: 30 },
      cable: { weight: 20, reps: 30 },
    });
    expect(result.tier).toBe("Primordial");
    expect(result.score).toBe(2754);
    expect(result.score).toBeGreaterThan(fixture.thresholds.chest.Primordial);
  });

  it("FIXED: the input that used to reach Celestial on 15 lb dumbbells is refused", () => {
    expect(validateLifts("chest", { incline_db: { weight: 15, reps: 100 } })).toMatchObject({
      ok: false,
    });
  });

  it("FIXED: the chest Primordial override is gone", () => {
    // v1: Primordial, on a score of 514.6, below the Warrior anchor. Now the
    // input is refused outright, and 415 lb of bench is just a heavy bench.
    expect(validateLifts("chest", { bench: { weight: 415, reps: 1 } }).ok).toBe(false);

    // With a complete set at the same bench, the score decides, and it is not
    // Primordial.
    const result = computeChestTier({
      bench: { weight: 415, reps: 1 },
      incline_db: { weight: 15, reps: 1 },
      cable: { weight: 5, reps: 1 },
    });
    expect(result.tier).toBe("Novice");
    expect(result.score).toBeLessThan(fixture.thresholds.chest.Warrior);
  });

  it("FIXED: the back Primordial override is gone too", () => {
    expect(validateLifts("back", { deadlift: { weight: 600, reps: 1 } }).ok).toBe(false);

    const result = computeBackTier({
      lat_pulldown: { weight: 40, reps: 8 },
      db_row: { weight: 20, reps: 10 },
      deadlift: { weight: 600, reps: 1 },
    });
    expect(result.tier).not.toBe("Primordial");
    expect(result.score).toBeLessThan(fixture.thresholds.back.Primordial);
  });

  it("FIXED: weight and reps are bounded", () => {
    expect(validateLifts("chest", { bench: { weight: 99999, reps: 99 } })).toMatchObject({
      ok: false,
    });
  });

  it("FIXED: chest anchor scores are now strictly increasing", () => {
    const chestScores = CHEST_TIERS_IN_ORDER.map((tier) => CHEST_TIER_SCORES[tier]);
    expect(chestScores).toEqual([...chestScores].sort((a, b) => a - b));

    // Back was already ordered correctly, which is why only chest's anchor moved.
    const backScores = BACK_TIERS_IN_ORDER.map((tier) => BACK_TIER_SCORES[tier]);
    expect(backScores).toEqual([...backScores].sort((a, b) => a - b));

    expect(CHEST_TIER_SCORES.Primordial).toBe(2491.6);
    expect(CHEST_TIER_SCORES.Primordial).toBeGreaterThan(CHEST_TIER_SCORES.Immortal);
  });

  it("FIXED: the ladder now contains every tier the engine can return", () => {
    for (const muscle of ["chest", "back"]) {
      const thresholds = getRankingEngine(muscle).thresholds;
      const mins = thresholds.map((threshold) => threshold.min);

      // 11, not 10: Primordial joined the ladder when the override left.
      expect(mins.length, `${muscle} ladder length`).toBe(11);
      expect(thresholds.map((t) => t.tier).at(-1)).toBe("Primordial");
      for (let i = 1; i < mins.length; i += 1) {
        expect(mins[i], `${muscle} threshold ${i}`).toBeGreaterThan(mins[i - 1]);
      }
    }
    // Untrained is the one tier outside the ladder, and it has no anchor lifts.
    expect(getRankingEngine("chest").thresholds.map((t) => t.tier)).not.toContain("Untrained");
  });

  it("FIXED: 0.02 lb of bench no longer skips nine tiers", () => {
    // Both sides of the old override boundary are now incomplete lift sets, and
    // both are refused, so the cliff has nothing to stand on.
    const below = fixture.cases.find((c) => c.id === "chest-override-below");
    const above = fixture.cases.find((c) => c.id === "chest-override-above");

    expect(above.lifts.bench.weight - below.lifts.bench.weight).toBeLessThan(0.02);
    expect(below.rejected).toBeDefined();
    expect(above.rejected).toBeDefined();
    expect(below.rejected.errors).toEqual(above.rejected.errors);

    // Completed with identical accessory lifts, the two now land on the same
    // tier, which is what "no cliff" means.
    const complete = (bench) => ({
      bench,
      incline_db: { weight: 45, reps: 8 },
      cable: { weight: 20, reps: 12 },
    });
    const lower = computeChestTier(complete(below.lifts.bench));
    const upper = computeChestTier(complete(above.lifts.bench));
    expect(lower.tier).toBe(upper.tier);
    expect(Math.abs(upper.score - lower.score)).toBeLessThanOrEqual(1);
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
    expect(ranking.computeBackTier(ranking.BACK_TIER_ANCHORS.Primordial).tier).toBe("Primordial");
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
