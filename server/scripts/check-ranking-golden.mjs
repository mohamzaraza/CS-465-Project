// Replays tests/fixtures/ranking-golden-v2.json against the live ranking engines
// and exits non-zero on any mismatch.
//
// It used to replay ranking-golden.json (v1). Prompt 3 changed behavior on
// purpose, so v1 is no longer reproducible and is kept only as history; v2 is the
// fixture the engine is now held to. ranking.behavior-changes.test.js is what
// proves the step from one to the other was exactly the approved one.
//
// This duplicates what tests/ranking.characterization.test.js asserts, on
// purpose: it replays the fixture under plain Node's module and number
// semantics rather than Vite's, so it is a cheap CI hook that does not depend
// on the test runner agreeing.
//
// Plain Node, no dependencies. Run: npm run ranking:check

import { readFileSync } from "node:fs";

import { computeBackTier, computeChestTier, validateLifts } from "../src/ranking/index.js";

// Scores are now whole numbers, so this is exact equality in practice. The
// tolerance stays for the anchor scores below, which are still raw doubles.
const SCORE_TOLERANCE = 1e-9;

const computeTier = { chest: computeChestTier, back: computeBackTier };

function scoresMatch(actual, expected) {
  if (Object.is(actual, expected)) return true;
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) return false;
  return Math.abs(actual - expected) <= SCORE_TOLERANCE * Math.max(1, Math.abs(expected));
}

const fixtureUrl = new URL("../tests/fixtures/ranking-golden-v2.json", import.meta.url);
const fixture = JSON.parse(readFileSync(fixtureUrl, "utf8"));

const entries = [...fixture.cases, ...fixture.knownDefects];
const mismatches = [];

for (const entry of entries) {
  const compute = computeTier[entry.muscle];
  if (!compute) {
    mismatches.push(`${entry.id}: fixture names an unknown muscle "${entry.muscle}"`);
    continue;
  }

  const checked = validateLifts(entry.muscle, entry.lifts);

  // An entry records exactly one outcome. Checking the rejections matters as
  // much as checking the scores: they are the inputs Prompt 3 decided the server
  // must refuse, and nothing else in plain Node would notice them coming back.
  if (entry.rejected) {
    if (checked.ok) {
      mismatches.push(
        `${entry.id}: expected rejection (${entry.rejected.errors.join(" ")}), but the input ` +
          `was accepted (lifts ${JSON.stringify(entry.lifts)})`
      );
    } else if (checked.errors.join("\n") !== entry.rejected.errors.join("\n")) {
      mismatches.push(
        `${entry.id}: rejection messages changed\n      expected: ` +
          `${JSON.stringify(entry.rejected.errors)}\n      actual:   ${JSON.stringify(checked.errors)}`
      );
    }
    continue;
  }

  if (!checked.ok) {
    mismatches.push(
      `${entry.id}: expected tier "${entry.expected.tier}", but the input is now rejected ` +
        `(${checked.errors.join(" ")})`
    );
    continue;
  }

  const result = compute(checked.lifts);

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
  // The claim Enhancement 3 will rely on: a stored score re-derives its tier.
  if (!Number.isInteger(result.score)) {
    mismatches.push(`${entry.id}: score ${result.score} is not a whole number`);
  }
}

// The engines do not export their anchor scorer, so re-derive it the way they
// do: score the tier's own anchor lifts.
function anchorScoreFor(muscle, tier) {
  const entry = fixture.cases.find((c) => c.id === `${muscle}-anchor-${tier}`);
  if (!entry) return 0; // Untrained has no anchor lifts, and is recorded as 0
  return computeTier[muscle](entry.lifts).score;
}

// Anchor scores are recorded separately from the cases, and a change could keep
// every case green while quietly moving an anchor, so check them too. The
// recorded value is the raw double; what rank() compares against is that value
// rounded, which is what `thresholds` holds.
for (const [muscle, tiers] of Object.entries(fixture.anchorScores)) {
  for (const [tier, expected] of Object.entries(tiers)) {
    const actual = anchorScoreFor(muscle, tier);
    if (!scoresMatch(actual, Math.round(expected))) {
      mismatches.push(
        `anchor ${muscle}/${tier}: score expected ${Math.round(expected)} (raw ${expected}), ` +
          `got ${actual}`
      );
    }
  }
}

for (const [muscle, tiers] of Object.entries(fixture.thresholds)) {
  let previous = null;
  for (const [tier, min] of Object.entries(tiers)) {
    if (!Number.isInteger(min)) {
      mismatches.push(`threshold ${muscle}/${tier}: ${min} is not a whole number`);
    }
    if (previous !== null && !(min > previous.min)) {
      mismatches.push(
        `threshold ${muscle}/${tier}: ${min} does not exceed "${previous.tier}" (${previous.min}); ` +
          "the ladder must strictly increase after rounding"
      );
    }
    previous = { tier, min };
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

const rejected = entries.filter((entry) => entry.rejected).length;
console.log(
  `Ranking golden master OK: ${entries.length} fixture entries reproduced ` +
    `(${fixture.cases.length} cases, ${fixture.knownDefects.length} known defects, ` +
    `${rejected} of them rejected as invalid input).`
);
