// The one test that exists to police Prompt 3 itself.
//
// Prompt 2 was a refactor: the golden master proved nothing moved. Prompt 3
// changed behavior on purpose, which makes "the fixture changed" useless as a
// signal. So this file holds v1 and v2 side by side and asserts that the set of
// entries whose output differs is EXACTLY the approved set, entry by entry, each
// one for a named reason. Anything else that moved is a regression, and every
// realistic entry outside the approved set must be untouched.
//
// The three approved reasons:
//   1. Primordial ladder - the 1RM override is gone and the tier is earned by
//      score, so an override promotion falls back to the score's own tier and a
//      score above the new Primordial anchor finally reaches it.
//   2. Rounding - rank() returns the whole number it classified from, so scores
//      that used to carry a fraction are now the same value rounded.
//   3. Now-invalid input - every configured lift is required and both fields are
//      bounded, so partial and absurd inputs are refused instead of scored.
//
// v1 (tests/fixtures/ranking-golden.json) is history and is never regenerated.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { rankLifts, validateLifts } from "../src/ranking/index.js";

function load(name) {
  return JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
}

const v1 = load("ranking-golden.json");
const v2 = load("ranking-golden-v2.json");

const allEntries = (fixture) => [...fixture.cases, ...fixture.knownDefects];
const indexById = (fixture) => new Map(allEntries(fixture).map((entry) => [entry.id, entry]));

const before = indexById(v1);
const after = indexById(v2);

// Measured from the two fixtures, then written down here. Hard-coded on purpose:
// a computed expectation would agree with whatever the code does, which is the
// one thing this file must not do.
const APPROVED = {
  v1Entries: 744,
  v2Entries: 791,
  // Chest's Primordial anchor moved, so the entries built FROM that anchor have
  // different lifts in v2. Their outputs are not comparable and are checked
  // separately.
  inputsChanged: 4,
  nowInvalid: 391,
  // Was Primordial by override, is now whatever it actually scored.
  demotedFromPrimordial: 81,
  // Scored above the new Primordial anchor; had nowhere to go before.
  promotedToPrimordial: 59,
  roundingOnly: 207,
  unchanged: 2,
};

/** Split every id the two fixtures share into exactly one bucket. */
function diff() {
  const inputsChanged = new Set(v2.inputsChangedSinceV1);
  const buckets = {
    inputsChanged: [],
    nowInvalid: [],
    demotedFromPrimordial: [],
    promotedToPrimordial: [],
    tierMovedForAnotherReason: [],
    roundingOnly: [],
    unchanged: [],
    inputChangedButNotDeclared: [],
  };

  for (const [id, old] of before) {
    const now = after.get(id);
    if (!now) continue; // reported on its own, below

    if (inputsChanged.has(id)) {
      buckets.inputsChanged.push(id);
      continue;
    }
    // Every other entry must be the same question asked twice.
    if (JSON.stringify(old.lifts) !== JSON.stringify(now.lifts)) {
      buckets.inputChangedButNotDeclared.push(id);
      continue;
    }
    if (now.rejected) {
      buckets.nowInvalid.push(id);
      continue;
    }
    if (old.expected.tier !== now.expected.tier) {
      if (old.expected.tier === "Primordial") buckets.demotedFromPrimordial.push(id);
      else if (now.expected.tier === "Primordial") buckets.promotedToPrimordial.push(id);
      else buckets.tierMovedForAnotherReason.push(id);
      continue;
    }
    if (old.expected.score !== now.expected.score) {
      buckets.roundingOnly.push(id);
      continue;
    }
    buckets.unchanged.push(id);
  }

  return buckets;
}

const buckets = diff();

describe("the two fixtures line up", () => {
  it("has the recorded number of entries in each", () => {
    expect(allEntries(v1)).toHaveLength(APPROVED.v1Entries);
    expect(allEntries(v2)).toHaveLength(APPROVED.v2Entries);
    expect(v1.version).toBeUndefined();
    expect(v2.version).toBe(2);
  });

  it("keeps every v1 entry, so nothing was dropped to make the diff smaller", () => {
    const dropped = [...before.keys()].filter((id) => !after.has(id));
    expect(dropped).toEqual([]);
  });

  it("only adds entries that test the new behavior", () => {
    const added = [...after.keys()].filter((id) => !before.has(id));

    // 44 complete-lift-set threshold probes (11 tiers x 2 sides x 2 muscles),
    // which v1 could not have: its probes were single-lift and are now refused.
    expect(added.filter((id) => id.includes("-rounded-"))).toHaveLength(44);
    // Three defects that are still open, recorded with input the server accepts.
    expect(added.filter((id) => id.includes("-open-"))).toHaveLength(3);
    expect(added).toHaveLength(47);
  });

  it("changes the lifts of exactly the four entries derived from chest's Primordial anchor", () => {
    expect(v2.inputsChangedSinceV1).toEqual([
      "chest-anchor-Primordial",
      "chest-threshold-Primordial-below",
      "chest-threshold-Primordial-above",
      "chest-defect-anchors-not-monotonic",
    ]);
    // No entry may quietly change its input: that would hide an output change
    // as an input change.
    expect(buckets.inputChangedButNotDeclared).toEqual([]);
    expect(buckets.inputsChanged).toHaveLength(APPROVED.inputsChanged);
  });
});

describe("the set of changed entries is exactly the approved set", () => {
  it("accounts for every shared entry exactly once", () => {
    const counted =
      buckets.inputsChanged.length +
      buckets.nowInvalid.length +
      buckets.demotedFromPrimordial.length +
      buckets.promotedToPrimordial.length +
      buckets.tierMovedForAnotherReason.length +
      buckets.roundingOnly.length +
      buckets.unchanged.length +
      buckets.inputChangedButNotDeclared.length;

    expect(counted).toBe(APPROVED.v1Entries);
  });

  it("matches the approved count in every bucket", () => {
    expect({
      inputsChanged: buckets.inputsChanged.length,
      nowInvalid: buckets.nowInvalid.length,
      demotedFromPrimordial: buckets.demotedFromPrimordial.length,
      promotedToPrimordial: buckets.promotedToPrimordial.length,
      roundingOnly: buckets.roundingOnly.length,
      unchanged: buckets.unchanged.length,
    }).toEqual({
      inputsChanged: APPROVED.inputsChanged,
      nowInvalid: APPROVED.nowInvalid,
      demotedFromPrimordial: APPROVED.demotedFromPrimordial,
      promotedToPrimordial: APPROVED.promotedToPrimordial,
      roundingOnly: APPROVED.roundingOnly,
      unchanged: APPROVED.unchanged,
    });
  });

  it("moves no tier for any reason other than the Primordial ladder", () => {
    // The strongest single claim here: rounding changed 207 scores and not one
    // tier. If rounding ever tips an entry across a threshold, this fails and the
    // change has to be looked at rather than absorbed.
    expect(buckets.tierMovedForAnotherReason).toEqual([]);
  });
});

describe("reason 1: the Primordial ladder", () => {
  it("demotes only entries that v1 promoted by the 1RM override", () => {
    // The override read one lift's unfactored 1RM: bench for chest, deadlift for
    // back, at 415 and 600. Every demoted entry must have cleared that, which is
    // what proves the override is the reason it was Primordial at all.
    const minimum1RM = { chest: 415, back: 600 };
    const overrideLift = { chest: "bench", back: "deadlift" };

    for (const id of buckets.demotedFromPrimordial) {
      const entry = before.get(id);
      const lift = entry.lifts[overrideLift[entry.muscle]];
      expect(lift, `${id} has no ${overrideLift[entry.muscle]}`).toBeDefined();

      const oneRepMax = lift.weight * (1 + lift.reps / 30);
      expect(oneRepMax, `${id} 1RM`).toBeGreaterThanOrEqual(minimum1RM[entry.muscle]);
    }
  });

  it("demotes each one to the tier its own score earns", () => {
    for (const id of buckets.demotedFromPrimordial) {
      const now = after.get(id);
      const threshold = v2.thresholds[now.muscle][now.expected.tier];
      const next = Object.entries(v2.thresholds[now.muscle]).find(([, min]) => min > threshold);

      if (now.expected.score < threshold) {
        // The one exception, and it is the floorTier defect Prompt 3 left open:
        // a score below the lowest threshold is still reported as Recruit rather
        // than Untrained. Asserted rather than tolerated, so it cannot spread to
        // a second tier unnoticed.
        expect(now.expected.tier, `${id} is below its threshold`).toBe("Recruit");
      } else if (next) {
        expect(now.expected.score, `${id} is below ${next[0]}`).toBeLessThan(next[1]);
      }

      expect(now.expected.tier).not.toBe("Primordial");
    }
  });

  it("demotes exactly one entry to a tier its score does not reach", () => {
    // Pinning the size of the floorTier defect's footprint: if fixing it later
    // moves more than this one entry, that is worth knowing.
    const belowOwnThreshold = buckets.demotedFromPrimordial.filter((id) => {
      const now = after.get(id);
      return now.expected.score < v2.thresholds[now.muscle][now.expected.tier];
    });
    expect(belowOwnThreshold).toEqual(["back-random-094"]);
  });

  it("promotes only entries scoring at or above the new Primordial threshold", () => {
    for (const id of buckets.promotedToPrimordial) {
      const now = after.get(id);
      expect(before.get(id).expected.tier, id).toBe("Immortal");
      expect(now.expected.score, id).toBeGreaterThanOrEqual(v2.thresholds[now.muscle].Primordial);
    }
  });

  it("puts chest's Primordial threshold above Immortal's, which is why the anchor moved", () => {
    expect(v1.anchorScores.chest.Primordial).toBe(1703.3999999999999);
    expect(v1.anchorScores.chest.Primordial).toBeLessThan(v1.anchorScores.chest.Immortal);

    expect(v2.anchorScores.chest.Primordial).toBe(2491.6);
    expect(v2.thresholds.chest.Primordial).toBe(2492);
    expect(v2.thresholds.chest.Primordial).toBeGreaterThan(v2.thresholds.chest.Immortal);

    // Back's anchor did not have to move: it was already on top.
    expect(v2.anchorScores.back.Primordial).toBe(v1.anchorScores.back.Primordial);
  });

  it("leaves every tier below Primordial exactly where it was", () => {
    for (const muscle of ["chest", "back"]) {
      for (const [tier, score] of Object.entries(v1.anchorScores[muscle])) {
        if (tier === "Primordial") continue;
        expect(v2.anchorScores[muscle][tier], `${muscle} ${tier}`).toBe(score);
      }
    }
  });
});

describe("reason 2: rounding", () => {
  it("changes each score to exactly the rounded v1 score, and nothing else", () => {
    for (const id of buckets.roundingOnly) {
      const old = before.get(id);
      const now = after.get(id);
      expect(now.expected.score, id).toBe(Math.round(old.expected.score));
      expect(now.expected.tier, id).toBe(old.expected.tier);
    }
  });

  it("leaves the two entries whose v1 score was already the rounded value alone", () => {
    expect(buckets.unchanged).toEqual(["chest-random-018", "back-anchor-Primordial"]);
    for (const id of buckets.unchanged) {
      expect(after.get(id).expected).toEqual(before.get(id).expected);
    }
  });

  it("stores a whole number for every accepted entry in v2", () => {
    for (const entry of allEntries(v2)) {
      if (entry.rejected) continue;
      expect(Number.isInteger(entry.expected.score), `${entry.id} ${entry.expected.score}`).toBe(
        true
      );
    }
  });
});

describe("reason 3: now-invalid input", () => {
  it("refuses each one for a reason the live validator still gives", () => {
    for (const id of buckets.nowInvalid) {
      const entry = after.get(id);
      const checked = validateLifts(entry.muscle, entry.lifts);

      expect(checked.ok, `${id} should be rejected`).toBe(false);
      expect(checked.errors, id).toEqual(entry.rejected.errors);
      expect(entry.expected, `${id} must not record a score`).toBeUndefined();
    }
  });

  it("refuses them for the three approved reasons only", () => {
    // Anything rejected for a reason not on this list would be a rule nobody
    // approved.
    const approved = [
      /^Missing lift "/, // every configured lift is required
      /^Weight for "[^"]+" must be (a number|between )/,
      /^Reps for "[^"]+" must be (a number|a whole number|between )/,
      /^Unknown lift "/,
      /^Lift "[^"]+" must be an object/,
      /^"lifts" must be an object/,
    ];

    for (const id of buckets.nowInvalid) {
      for (const message of after.get(id).rejected.errors) {
        expect(
          approved.some((pattern) => pattern.test(message)),
          `${id}: unapproved rejection reason "${message}"`
        ).toBe(true);
      }
    }
  });

  it("is dominated by incomplete lift sets, not by the new bounds", () => {
    // Worth pinning because it is the honest description of the change: the
    // bounds refuse almost nothing the fixture contains, while "every lift is
    // required" refuses a lot. Both were approved; only one is load-bearing.
    const onlyMissingLifts = buckets.nowInvalid.filter((id) =>
      after.get(id).rejected.errors.every((message) => message.startsWith('Missing lift "'))
    );
    expect(onlyMissingLifts.length).toBe(377);

    const boundsBroken = buckets.nowInvalid.filter((id) =>
      after.get(id).rejected.errors.some((message) => / must be between /.test(message))
    );
    expect(boundsBroken).toHaveLength(10);

    // And of those ten, only two break an upper limit. The maxima are there to
    // refuse the impossible, and the fixture contains exactly two impossible
    // inputs; the other eight are zero or negative, caught by the minima.
    const overAMaximum = boundsBroken.filter((id) =>
      Object.entries(after.get(id).lifts).some(([key, entry]) => {
        const bounds = v2.bounds[after.get(id).muscle][key];
        return entry.weight > bounds.weight.max || entry.reps > bounds.reps.max;
      })
    );
    expect(overAMaximum).toEqual([
      "chest-defect-unbounded-volume",
      "chest-defect-no-input-bounds",
    ]);
  });

  it("refuses the four inputs the v1 change log called exploits", () => {
    for (const [id, muscle] of [
      ["chest-defect-no-input-bounds", "chest"],
      ["chest-defect-unbounded-volume", "chest"],
      ["chest-defect-override-ignores-score", "chest"],
      ["back-defect-override-ignores-score", "back"],
    ]) {
      const v1Entry = before.get(id);
      const v2Entry = after.get(id);

      // v1 scored and would have stored these.
      expect(v1Entry.expected.tier, `${id} in v1`).toBeDefined();
      expect(v2Entry.rejected, `${id} in v2`).toBeDefined();
      expect(validateLifts(muscle, v1Entry.lifts).ok).toBe(false);
    }
  });
});

describe("what did NOT change: realistic input outside the approved set", () => {
  // The risk in a prompt like this is collateral damage: a formula quietly moved
  // while attention was on the ladder. Every entry that is still accepted and was
  // not an override promotion must score the same double it always did, to the bit.
  it("scores every still-accepted entry as the rounded v1 score", () => {
    const stillAccepted = [...buckets.roundingOnly, ...buckets.unchanged];
    expect(stillAccepted).toHaveLength(APPROVED.roundingOnly + APPROVED.unchanged);

    for (const id of stillAccepted) {
      const old = before.get(id);
      const result = rankLifts(old.muscle, old.lifts);
      expect(result.score, `${id} score`).toBe(Math.round(old.expected.score));
      expect(result.tier, `${id} tier`).toBe(old.expected.tier);
    }
  });

  it("keeps the multipliers and every non-Primordial anchor", () => {
    expect(v2.multipliers).toEqual(v1.multipliers);
  });

  it("re-derives the tier of every accepted v2 entry from its stored score", () => {
    // The same property the rounding test proves on random input, asserted here
    // across the whole fixture.
    for (const entry of allEntries(v2)) {
      if (entry.rejected) continue;
      const tiers = Object.entries(v2.thresholds[entry.muscle]);
      const cleared = tiers.filter(([, min]) => min <= entry.expected.score);
      const expectedTier = cleared.length > 0 ? cleared.at(-1)[0] : "Recruit";
      expect(expectedTier, `${entry.id} (score ${entry.expected.score})`).toBe(entry.expected.tier);
    }
  });
});
