// Guards the thing Enhancement 2 removed: the import cycle.
//
// chestRanking.js imported chestTierAnchors.js, which imported chestRanking.js
// back (same for the two back files). Plain Node tolerated it because the
// exported functions were hoisted declarations; Vite's SSR transform did not,
// so entering the cycle through the wrong module failed an entire test file with
// "Cannot access '__vite_ssr_import_0__' before initialization".
//
// A comment saying "don't reintroduce the cycle" would not survive the next
// refactor. This test reads the real files instead, so it fails the moment one
// comes back — including in a module this test has never heard of.

import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const RANKING_DIR = fileURLToPath(new URL("../src/ranking/", import.meta.url));

// Matches `from "./x.js"`, `import "./x.js"` and `await import("./x.js")`.
// Only relative specifiers: a package import cannot close a cycle inside this
// directory, and the point is the directory's internal shape.
const RELATIVE_IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*)["'](\.[^"']*)["']/g;

function jsFilesIn(dir) {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".js") || name.endsWith(".mjs"))
    .sort();
}

/** Import graph of one directory, keyed and valued by path relative to it. */
function buildImportGraph(dir) {
  const graph = {};

  for (const name of jsFilesIn(dir)) {
    const source = readFileSync(join(dir, name), "utf8");
    const edges = [];

    for (const match of source.matchAll(RELATIVE_IMPORT)) {
      const target = normalize(relative(dir, resolve(dirname(join(dir, name)), match[1])));
      // Imports that leave the directory are recorded as leaves: they cannot
      // participate in a cycle among these files.
      edges.push(target.startsWith("..") ? target : basename(target));
    }

    graph[name] = edges;
  }

  return graph;
}

/**
 * Depth-first search for a cycle. Returns the cycle as a path, e.g.
 * ["a.js", "b.js", "a.js"], or null if the graph is acyclic.
 *
 * Grey = on the current DFS stack, black = fully explored. Reaching a grey node
 * is a back edge, which is a cycle; reaching a black one is just a diamond.
 */
function findCycle(graph) {
  const GREY = 1;
  const BLACK = 2;
  const state = new Map();
  const stack = [];

  function visit(node) {
    if (state.get(node) === BLACK) return null;
    if (state.get(node) === GREY) {
      // Trim the stack to where this node first appeared, so the reported path
      // is the cycle itself and not the walk that led into it.
      return [...stack.slice(stack.indexOf(node)), node];
    }

    state.set(node, GREY);
    stack.push(node);

    for (const next of graph[node] ?? []) {
      const cycle = visit(next);
      if (cycle) return cycle;
    }

    stack.pop();
    state.set(node, BLACK);
    return null;
  }

  for (const node of Object.keys(graph)) {
    const cycle = visit(node);
    if (cycle) return cycle;
  }

  return null;
}

describe("the cycle detector itself", () => {
  // A detector that always returned null would make the real test below pass
  // forever, so prove it finds cycles before trusting it not to find one.

  it("reports a two-node cycle", () => {
    const cycle = findCycle({ "a.js": ["b.js"], "b.js": ["a.js"] });
    expect(cycle).toEqual(["a.js", "b.js", "a.js"]);
  });

  it("reports a self-import", () => {
    expect(findCycle({ "a.js": ["a.js"] })).toEqual(["a.js", "a.js"]);
  });

  it("reports a longer cycle and trims the walk that led into it", () => {
    const cycle = findCycle({
      "entry.js": ["a.js"],
      "a.js": ["b.js"],
      "b.js": ["c.js"],
      "c.js": ["a.js"],
    });
    expect(cycle).toEqual(["a.js", "b.js", "c.js", "a.js"]);
  });

  it("reports the exact cycle the old ranking files had", () => {
    expect(
      findCycle({
        "chestRanking.js": ["chestTierAnchors.js"],
        "chestTierAnchors.js": ["chestRanking.js"],
      })
    ).toEqual(["chestRanking.js", "chestTierAnchors.js", "chestRanking.js"]);
  });

  it("returns null for an acyclic graph, including a diamond", () => {
    expect(findCycle({})).toBeNull();
    expect(findCycle({ "a.js": [] })).toBeNull();
    expect(findCycle({ "a.js": ["b.js"], "b.js": [] })).toBeNull();
    // b and c both import d: a shared dependency is not a cycle.
    expect(
      findCycle({
        "a.js": ["b.js", "c.js"],
        "b.js": ["d.js"],
        "c.js": ["d.js"],
        "d.js": [],
      })
    ).toBeNull();
  });

  it("returns null for an edge to a module outside the graph", () => {
    expect(findCycle({ "a.js": ["../elsewhere/b.js"] })).toBeNull();
  });
});

describe("server/src/ranking has no import cycle", () => {
  const graph = buildImportGraph(RANKING_DIR);

  it("found the ranking modules to inspect", () => {
    // Fails loudly if the directory moves, rather than passing on an empty graph.
    expect(Object.keys(graph)).toEqual([
      "formulas.js",
      "index.js",
      "leaderboard.js",
      "rankingConfig.js",
      "rankingEngine.js",
      "validateLifts.js",
    ]);
  });

  it("extracted the relative imports of every module", () => {
    expect(graph).toEqual({
      "formulas.js": [],
      "index.js": ["rankingConfig.js", "rankingEngine.js"],
      // Added in Prompt 4: pure leaderboard helpers, deliberately importing
      // nothing so Prisma and Express stay out of the ranking directory.
      "leaderboard.js": [],
      // Pure data: importing nothing is what made the cycle impossible.
      "rankingConfig.js": [],
      "rankingEngine.js": ["formulas.js", "validateLifts.js"],
      // Added in Prompt 3, and a leaf for the same reason rankingConfig.js is:
      // it is handed the config it works from rather than importing it.
      "validateLifts.js": [],
    });
  });

  it("is acyclic", () => {
    const cycle = findCycle(graph);
    expect(cycle, cycle ? `import cycle: ${cycle.join(" -> ")}` : "acyclic").toBeNull();
  });

  it("has a single entry point that nothing inside imports", () => {
    // index.js is the public face of the directory; if something inside started
    // importing it, that would be the first step back towards a cycle.
    const importers = Object.entries(graph)
      .filter(([, edges]) => edges.includes("index.js"))
      .map(([name]) => name);
    expect(importers).toEqual([]);
  });
});
