// Times computeChestTier and computeBackTier over the golden-master inputs, so
// the same script measures the engines before and after Enhancement 2.
//
// Note what is NOT timed: building the engines. That happens once, at import,
// before the first measurement, which is exactly the point of moving the anchor
// scoring out of the request path.
//
// Plain Node, no dependencies. Run: npm run bench:ranking

import { readFileSync } from "node:fs";

import { computeBackTier, computeChestTier } from "../src/ranking/index.js";

const WARMUP_PASSES = 200; // let the JIT settle before anything is recorded
const TIMED_RUNS = 7; // odd, so the median is a real sample
const PASSES_PER_RUN = 200; // one pass = every fixture input for that muscle

// Deliberately still the v1 fixture, even though the engine is now held to v2:
// only the INPUTS are read here, and timing the same inputs is what keeps these
// numbers comparable with the baseline recorded before Enhancement 2. Prompt 3
// made many of them invalid input, which does not matter — rank() is a pure
// scorer and this measures the scorer.
const fixtureUrl = new URL("../tests/fixtures/ranking-golden.json", import.meta.url);
const fixture = JSON.parse(readFileSync(fixtureUrl, "utf8"));

const inputsFor = (muscle) =>
  [...fixture.cases, ...fixture.knownDefects]
    .filter((entry) => entry.muscle === muscle)
    .map((entry) => entry.lifts);

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function benchmark(label, compute, inputs) {
  // Consuming the result keeps the engine call from being optimised away.
  let sink = 0;

  for (let pass = 0; pass < WARMUP_PASSES; pass += 1) {
    for (const lifts of inputs) sink += compute(lifts).score;
  }

  const nsPerCall = [];
  for (let run = 0; run < TIMED_RUNS; run += 1) {
    const start = process.hrtime.bigint();
    for (let pass = 0; pass < PASSES_PER_RUN; pass += 1) {
      for (const lifts of inputs) sink += compute(lifts).score;
    }
    const elapsedNs = Number(process.hrtime.bigint() - start);
    nsPerCall.push(elapsedNs / (PASSES_PER_RUN * inputs.length));
  }

  return { label, inputs: inputs.length, sink, nsPerCall };
}

const results = [
  benchmark("computeChestTier", computeChestTier, inputsFor("chest")),
  benchmark("computeBackTier", computeBackTier, inputsFor("back")),
];

console.log("");
console.log("Ranking engine benchmark");
console.log(`  Node ${process.version} on ${process.platform} ${process.arch}`);
console.log(
  `  ${WARMUP_PASSES} warm-up passes, then ${TIMED_RUNS} timed runs of ` +
    `${PASSES_PER_RUN} passes each`
);
console.log("");

for (const result of results) {
  const runs = result.nsPerCall;
  console.log(
    `  ${result.label.padEnd(17)} ${median(runs).toFixed(1).padStart(8)} ns/call (median)  ` +
      `min ${Math.min(...runs).toFixed(1)}  max ${Math.max(...runs).toFixed(1)}  ` +
      `over ${result.inputs} distinct inputs x ${PASSES_PER_RUN * TIMED_RUNS} passes`
  );
}

console.log("");
console.log(
  "  Micro-benchmark numbers vary by machine, Node version and background load."
);
console.log(
  "  Treat these as a baseline to compare against on the SAME machine, not as an"
);
console.log("  absolute measure of anything.");
console.log("");
