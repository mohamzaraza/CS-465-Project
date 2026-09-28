// Replays tests/fixtures/ranking-golden.json against the live ranking engines
// and exits non-zero on any mismatch.
//
// This duplicates what tests/ranking.characterization.test.js asserts, on
// purpose. The Vitest run only survives the chestRanking <-> chestTierAnchors
// import cycle because the test file imports the anchors module first; this
// script proves the same fixture holds under plain Node module semantics,
// where the cycle resolves differently. Once the cycle is gone, the two runs
// are equivalent and this script is just a cheap CI hook.
//
// Plain Node, no dependencies. Run: npm run ranking:check

import { readFileSync } from "node:fs";

// Anchors before engines; see the comment in generate-ranking-golden.mjs.
import "../src/ranking/chestTierAnchors.js";
import "../src/ranking/backTierAnchors.js";
import { computeChestTier } from "../src/ranking/chestRanking.js";
import { computeBackTier } from "../src/ranking/backRanking.js";

// The fixture stores full double precision, so the only slack needed is for
// a future Node version rounding a transcendental differently. Scores here are
// products and sums of doubles, which are exactly reproducible in practice.
const SCORE_TOLERANCE = 1e-9;

const computeTier = { chest: computeChestTier, back: computeBackTier };

function scoresMatch(actual, expected) {
  if (Object.is(actual, expected)) return true;
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) return false;
  return Math.abs(actual - expected) <= SCORE_TOLERANCE * Math.max(1, Math.abs(expected));
}

const fixtureUrl = new URL("../tests/fixtures/ranking-golden.json", import.meta.url);
const fixture = JSON.parse(readFileSync(fixtureUrl, "utf8"));

const entries = [...fixture.cases, ...fixture.knownDefects];
const mismatches = [];

for (const entry of entries) {
  const compute = computeTier[entry.muscle];
  if (!compute) {
    mismatches.push(`${entry.id}: fixture names an unknown muscle "${entry.muscle}"`);
    continue;
  }

  const result = compute(entry.lifts);

  if (result.muscle !== entry.muscle) {
    mismatches.push(
      `${entry.id}: muscle expected "${entry.muscle}", got "${result.muscle}"`
    );
  }
  if (result.tier !== entry.expected.tier) {
    mismatches.push(
      `${entry.id}: tier expected "${entry.expected.tier}", got "${result.tier}" ` +
        `(lifts ${JSON.stringify(entry.lifts)})`
    );
  }
  if (!scoresMatch(result.score, entry.expected.score)) {
    mismatches.push(
      `${entry.id}: score expected ${entry.expected.score}, got ${result.score} ` +
        `(lifts ${JSON.stringify(entry.lifts)})`
    );
  }
}

// The engines do not export their anchor scorer, so re-derive it the way they
// do: score the tier's own anchor lifts.
function anchorScoreFor(muscle, tier) {
  const entry = fixture.cases.find((c) => c.id === `${muscle}-anchor-${tier}`);
  if (!entry) return 0; // Untrained has no anchor lifts, and is recorded as 0
  return computeTier[muscle](entry.lifts).score;
}

// Anchor scores are recorded separately from the cases, and a refactor could
// keep every case green while quietly moving an anchor, so check them too.
for (const [muscle, tiers] of Object.entries(fixture.anchorScores)) {
  for (const [tier, expected] of Object.entries(tiers)) {
    const actual = anchorScoreFor(muscle, tier);
    if (!scoresMatch(actual, expected)) {
      mismatches.push(
        `anchor ${muscle}/${tier}: score expected ${expected}, got ${actual}`
      );
    }
  }
}

if (mismatches.length > 0) {
  console.error(
    `Ranking golden master FAILED: ${mismatches.length} mismatch(es) across ` +
      `${entries.length} fixture entries.\n`
  );
  for (const line of mismatches) console.error(`  - ${line}`);
  console.error(
    "\nIf a change to the ranking engine was intended, regenerate the fixture " +
      "with `npm run ranking:golden` and review the diff deliberately."
  );
  process.exit(1);
}

console.log(
  `Ranking golden master OK: ${entries.length} fixture entries reproduced ` +
    `(${fixture.cases.length} cases, ${fixture.knownDefects.length} known defects).`
);
