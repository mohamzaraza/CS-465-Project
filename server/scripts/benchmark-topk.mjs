// Times topK (size-k min-heap) against copying, sorting and slicing, for
// picking the best 20 of n seeded random scores. This is the step the total
// leaderboard runs after summing per user.
//
// Plain Node, no dependencies. Run: node scripts/benchmark-topk.mjs

import { topK } from "../src/ranking/leaderboard.js";

const K = 20;
const SIZES = [1_000, 10_000, 100_000];
const WARMUP_RUNS = 5; // let the JIT settle before anything is recorded
const TIMED_RUNS = 9; // odd, so the median is a real sample
// Enough repetitions per run that even n = 1,000 takes well over a timer tick.
const TARGET_ITEMS_PER_RUN = 2_000_000;

// Seeded so every run of this script times the same inputs.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Same shape and order as the total leaderboard: score descending, then id.
function compare(a, b) {
  return b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

const heapTopK = (items) => topK(items, K, compare);
const sortThenSlice = (items) => [...items].sort(compare).slice(0, K);

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function time(fn, items, reps) {
  // Consuming the result keeps the call from being optimised away.
  let sink = 0;
  for (let run = 0; run < WARMUP_RUNS; run += 1) {
    for (let r = 0; r < reps; r += 1) sink += fn(items)[0].score;
  }
  const usPerCall = [];
  for (let run = 0; run < TIMED_RUNS; run += 1) {
    const start = process.hrtime.bigint();
    for (let r = 0; r < reps; r += 1) sink += fn(items)[0].score;
    usPerCall.push(Number(process.hrtime.bigint() - start) / 1000 / reps);
  }
  return { median: median(usPerCall), sink };
}

console.log("");
console.log(`topK (k = ${K}) vs sort-then-slice`);
console.log(`  Node ${process.version} on ${process.platform} ${process.arch}`);
console.log(`  ${WARMUP_RUNS} warm-up runs, then median of ${TIMED_RUNS} timed runs`);
console.log("");
console.log("  n         heap topK (us)   sort+slice (us)   sort / heap");

for (const n of SIZES) {
  const random = mulberry32(n);
  const items = Array.from({ length: n }, (_, i) => ({
    id: `user${String(i).padStart(6, "0")}`,
    score: Math.floor(random() * 100_000),
  }));

  // A benchmark of two functions that disagree would be meaningless.
  const a = heapTopK(items);
  const b = sortThenSlice(items);
  if (a.length !== b.length || a.some((item, i) => item !== b[i])) {
    throw new Error(`topK and sort-then-slice disagree at n = ${n}`);
  }

  const reps = Math.max(1, Math.round(TARGET_ITEMS_PER_RUN / n));
  const heap = time(heapTopK, items, reps);
  const sort = time(sortThenSlice, items, reps);
  console.log(
    `  ${n.toLocaleString("en-US").padEnd(9)} ${heap.median.toFixed(1).padStart(14)}` +
      `   ${sort.median.toFixed(1).padStart(15)}   ${(sort.median / heap.median).toFixed(1).padStart(10)}x`
  );
}

console.log("");
console.log("  Micro-benchmark numbers vary by machine, Node version and background load.");
console.log("  Compare the two columns with each other on the SAME machine; the absolute");
console.log("  numbers mean little on their own.");
console.log("");
