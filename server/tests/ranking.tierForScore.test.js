// tierForScore re-derives the tier from a stored score, which is what lets
// MuscleRank drop its tier column. It is only safe if it can never disagree with
// the tier rank() gave the same lifts when they were saved, so it is checked
// against rank() on every fixture input the API would actually accept.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getRankingEngine, rankLifts, tierForScore, validateLifts } from "../src/ranking/index.js";

function loadFixture(name) {
  return JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
}

// Both fixtures: v1's inputs are older but still real lift sets, and any of them
// that passes today's validation is a score that could be stored.
const acceptedCases = ["ranking-golden.json", "ranking-golden-v2.json"].flatMap((name) => {
  const fixture = loadFixture(name);
  return [...fixture.cases, ...(fixture.knownDefects ?? [])]
    .filter((entry) => entry.lifts !== undefined)
    .map((entry) => ({ entry, checked: validateLifts(entry.muscle, entry.lifts) }))
    .filter(({ checked }) => checked.ok)
    .map(({ entry, checked }) => [`${name} ${entry.id ?? entry.label}`, entry.muscle, checked.lifts]);
});

describe("tierForScore", () => {
  it("has fixture inputs to check against", () => {
    // Guards against the filter above quietly leaving nothing to compare.
    expect(acceptedCases.length).toBeGreaterThan(300);
  });

  it.each(acceptedCases)("matches rank() for %s", (_label, muscle, lifts) => {
    const result = rankLifts(muscle, lifts);
    expect(tierForScore(muscle, result.score)).toBe(result.tier.toUpperCase());
  });

  it.each(["chest", "back"])("matches rank()'s zero rule for %s", (muscle) => {
    // No accepted input scores 0, so this goes through rank() directly: with no
    // lifts the total is 0 and the zero tier applies.
    const result = getRankingEngine(muscle).rank({});
    expect(result.score).toBe(0);
    expect(tierForScore(muscle, result.score)).toBe(result.tier.toUpperCase());
    expect(tierForScore(muscle, 0)).toBe("UNTRAINED");
  });

  it("throws for a muscle with no ranking engine, like rankLifts", () => {
    expect(() => tierForScore("calves", 500)).toThrow(/no ranking engine/);
  });
});
