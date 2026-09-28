import { describe, it, expect } from "vitest";
import { rankWithTies, MinHeap, topK } from "../src/ranking/leaderboard.js";

// Seeded so a failure reproduces exactly; Math.random would not.
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

function randomItems(n, maxScore, seed) {
  const random = mulberry32(seed);
  return Array.from({ length: n }, (_, id) => ({ id, score: Math.floor(random() * maxScore) }));
}

// Score only, so equal scores compare as 0 and topK's own index tie-break
// is what makes the result match a stable sort.
const byScoreDesc = (a, b) => b.score - a.score;

const ranksOf = (scores) =>
  rankWithTies(scores.map((score) => ({ score })), (e) => e.score).map((e) => e.rank);

describe("rankWithTies", () => {
  it("numbers distinct scores 1..n, as index + 1 did", () => {
    expect(ranksOf([90, 80, 70, 60])).toEqual([1, 2, 3, 4]);
  });

  it("gives every entry rank 1 when all are tied", () => {
    expect(ranksOf([50, 50, 50])).toEqual([1, 1, 1]);
  });

  it("shares a rank on a tie at the top and skips the next rank", () => {
    expect(ranksOf([90, 90, 80, 70])).toEqual([1, 1, 3, 4]);
  });

  it("handles a tie in the middle", () => {
    expect(ranksOf([90, 80, 80, 70])).toEqual([1, 2, 2, 4]);
  });

  it("handles a tie at the bottom", () => {
    expect(ranksOf([90, 80, 70, 70])).toEqual([1, 2, 3, 3]);
  });

  it("handles several separate ties", () => {
    expect(ranksOf([9, 9, 8, 7, 7, 7, 6])).toEqual([1, 1, 3, 4, 4, 4, 7]);
  });

  it("gives a single entry rank 1", () => {
    expect(ranksOf([42])).toEqual([1]);
  });

  it("returns an empty list for an empty list", () => {
    expect(rankWithTies([], (e) => e.score)).toEqual([]);
  });

  it("does not mutate its input", () => {
    const input = [{ score: 5 }, { score: 5 }, { score: 3 }];
    const snapshot = structuredClone(input);
    const result = rankWithTies(input, (e) => e.score);
    expect(input).toEqual(snapshot);
    expect(result[0]).not.toBe(input[0]);
    expect(result).toEqual([
      { score: 5, rank: 1 },
      { score: 5, rank: 1 },
      { score: 3, rank: 3 },
    ]);
  });
});

describe("MinHeap", () => {
  it("pops in the same order as Array.sort on seeded random data", () => {
    const random = mulberry32(1);
    const values = Array.from({ length: 5000 }, () => Math.floor(random() * 1000));
    const heap = new MinHeap((a, b) => a - b);
    for (const v of values) heap.push(v);
    expect(heap.size()).toBe(values.length);

    const popped = [];
    while (heap.size() > 0) popped.push(heap.pop());
    expect(popped).toEqual([...values].sort((a, b) => a - b));
  });

  it("peek returns the smallest item without removing it", () => {
    const heap = new MinHeap((a, b) => a - b);
    for (const v of [5, 1, 3]) heap.push(v);
    expect(heap.peek()).toBe(1);
    expect(heap.peek()).toBe(1);
    expect(heap.size()).toBe(3);
  });

  it("pop and peek on an empty heap return undefined", () => {
    const heap = new MinHeap((a, b) => a - b);
    expect(heap.pop()).toBeUndefined();
    expect(heap.peek()).toBeUndefined();
    expect(heap.size()).toBe(0);
  });
});

describe("topK", () => {
  // A narrow score range (0-49) forces many ties; the wide range almost none.
  const cases = [
    { n: 3000, maxScore: 50, seed: 11 },
    { n: 3000, maxScore: 1_000_000, seed: 12 },
    { n: 5000, maxScore: 10, seed: 13 },
  ];

  for (const { n, maxScore, seed } of cases) {
    for (const k of [1, 5, 20, 100, 2999]) {
      it(`equals stable sort-then-slice (n=${n}, scores<${maxScore}, k=${k})`, () => {
        const items = randomItems(n, maxScore, seed);
        const expected = [...items].sort(byScoreDesc).slice(0, k);
        expect(topK(items, k, byScoreDesc)).toEqual(expected);
      });
    }
  }

  it("keeps input order among tied items (the index tie-break)", () => {
    const items = [
      { id: "a", score: 5 },
      { id: "b", score: 7 },
      { id: "c", score: 5 },
      { id: "d", score: 5 },
      { id: "e", score: 5 },
    ];
    expect(topK(items, 3, byScoreDesc).map((i) => i.id)).toEqual(["b", "a", "c"]);
  });

  it("returns [] for k <= 0", () => {
    const items = randomItems(10, 100, 3);
    expect(topK(items, 0, byScoreDesc)).toEqual([]);
    expect(topK(items, -5, byScoreDesc)).toEqual([]);
  });

  it("returns everything, sorted, when k is larger than the input", () => {
    const items = randomItems(10, 5, 4);
    expect(topK(items, 50, byScoreDesc)).toEqual([...items].sort(byScoreDesc));
  });

  it("returns [] for empty input", () => {
    expect(topK([], 20, byScoreDesc)).toEqual([]);
  });

  it("does not mutate its input", () => {
    const items = randomItems(100, 10, 5);
    const snapshot = structuredClone(items);
    topK(items, 20, byScoreDesc);
    expect(items).toEqual(snapshot);
  });

  it("makes O(n log k) comparisons, not O(n log n)", () => {
    const n = 10_000;
    const k = 20;
    const items = randomItems(n, 1_000_000, 21);
    let calls = 0;
    const counted = (a, b) => {
      calls++;
      return byScoreDesc(a, b);
    };
    topK(items, k, counted);
    expect(calls).toBeLessThan(n * (Math.ceil(Math.log2(k)) + 2));

    // For contrast, a full sort of the same input is well above that bound,
    // so the assertion above would catch a sort-everything implementation.
    let sortCalls = 0;
    [...items].sort((a, b) => {
      sortCalls++;
      return byScoreDesc(a, b);
    });
    expect(sortCalls).toBeGreaterThan(n * (Math.ceil(Math.log2(k)) + 2));
  });
});
