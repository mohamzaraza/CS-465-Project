// Pure leaderboard helpers: no Prisma, no Express, so they can be tested and
// benchmarked on plain arrays.

// Competition ranking ("1, 2, 2, 4"): numbering rows index + 1 gave tied
// lifters different ranks purely by database row order. The skip after a tie
// keeps rank equal to "1 + how many people beat you".
// `entries` must already be sorted by score, best first.
export function rankWithTies(entries, getScore) {
  let previousScore;
  let previousRank = 0;
  return entries.map((entry, index) => {
    const score = getScore(entry);
    const rank = index > 0 && score === previousScore ? previousRank : index + 1;
    previousScore = score;
    previousRank = rank;
    return { ...entry, rank };
  });
}

// Binary min-heap. An array is used instead of linked nodes because a complete
// binary tree packs into contiguous storage with no gaps: the children of i
// are 2i + 1 and 2i + 2 and its parent is (i - 1) >> 1, so moving through the
// tree is index arithmetic, with no per-node objects or pointers to allocate.
// `compare(a, b) < 0` means a belongs nearer the root.
export class MinHeap {
  constructor(compare) {
    this.compare = compare;
    this.items = [];
  }

  size() {
    return this.items.length;
  }

  peek() {
    return this.items[0];
  }

  push(item) {
    const items = this.items;
    items.push(item);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(items[i], items[parent]) >= 0) break;
      [items[i], items[parent]] = [items[parent], items[i]];
      i = parent;
    }
  }

  pop() {
    const items = this.items;
    if (items.length === 0) return undefined;
    const top = items[0];
    const last = items.pop();
    if (items.length > 0) {
      items[0] = last;
      this.#siftDown(0);
    }
    return top;
  }

  // Replaces the root and restores heap order in one pass; cheaper than
  // pop() followed by push(), which would walk the tree twice.
  replaceTop(item) {
    this.items[0] = item;
    this.#siftDown(0);
  }

  #siftDown(i) {
    const items = this.items;
    const n = items.length;
    for (;;) {
      const left = 2 * i + 1;
      if (left >= n) return;
      const right = left + 1;
      let child = left;
      if (right < n && this.compare(items[right], items[left]) < 0) child = right;
      if (this.compare(items[child], items[i]) >= 0) return;
      [items[i], items[child]] = [items[child], items[i]];
      i = child;
    }
  }
}

// Returns the k best items, best first. `compare(a, b) < 0` means a ranks
// ahead of b, the same contract as Array.prototype.sort.
//
// The heap holds the current top k with the *worst* of them at the root, so
// each new item needs one comparison against the root to be rejected, and
// only a winner pays O(log k) to replace it: O(n log k) time, O(k) extra
// space, instead of sorting all n items.
//
// A heap is not stable, so each item's original index is the final
// tie-break: items the comparator calls equal come out in input order,
// exactly as a stable sort followed by slice(0, k) would return them.
export function topK(items, k, compare) {
  const limit = Math.min(Math.floor(k), items.length);
  if (!(limit > 0)) return [];

  const better = (a, b) => compare(a.item, b.item) || a.index - b.index;
  // Inverted so the root is the worst entry kept so far.
  const heap = new MinHeap((a, b) => better(b, a));

  for (let index = 0; index < items.length; index++) {
    const entry = { item: items[index], index };
    if (heap.size() < limit) {
      heap.push(entry);
    } else if (better(entry, heap.peek()) < 0) {
      heap.replaceTop(entry);
    }
  }

  const result = new Array(heap.size());
  for (let i = result.length - 1; i >= 0; i--) result[i] = heap.pop().item;
  return result;
}
