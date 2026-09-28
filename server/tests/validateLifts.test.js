// Unit tests for the validation layer added in Prompt 3.
//
// Every rejection here is a behavior change: before this, the server scored
// whatever arrived. The engine is not involved — validateLifts is pure, and its
// whole job is to decide what the engine is ever allowed to see.

import { describe, expect, it } from "vitest";

import { validateLifts as validateFor } from "../src/ranking/validateLifts.js";
import { validateLifts } from "../src/ranking/index.js";
import { BACK_CONFIG, CHEST_CONFIG } from "../src/ranking/rankingConfig.js";

// The lift sets used as a starting point, one per muscle, both comfortably
// inside every bound. Anchor lifts rather than invented numbers.
const VALID = {
  chest: {
    bench: { weight: 135, reps: 8 },
    incline_db: { weight: 45, reps: 8 },
    cable: { weight: 20, reps: 12 },
  },
  back: {
    lat_pulldown: { weight: 130, reps: 8 },
    db_row: { weight: 65, reps: 8 },
    deadlift: { weight: 225, reps: 5 },
  },
};

const boundsOf = (config, key) => config.lifts.find((lift) => lift.key === key).bounds;

function withLift(muscle, key, entry) {
  return { ...VALID[muscle], [key]: entry };
}

describe("validateLifts happy path", () => {
  it.each(["chest", "back"])("accepts a complete, in-bounds %s set", (muscle) => {
    const result = validateLifts(muscle, VALID[muscle]);
    expect(result).toEqual({ ok: true, lifts: VALID[muscle] });
  });

  it("returns a fresh object, so the engine cannot be reached by the request body", () => {
    const body = { ...VALID.chest, bench: { weight: 135, reps: 8, notes: "felt heavy" } };
    const result = validateLifts("chest", body);

    expect(result.ok).toBe(true);
    expect(result.lifts).not.toBe(body);
    // Only weight and reps survive: a property nothing validated cannot ride
    // along into the scorer.
    expect(result.lifts.bench).toEqual({ weight: 135, reps: 8 });
  });

  it("accepts a fractional weight, because half-pound plates exist", () => {
    expect(validateLifts("chest", withLift("chest", "bench", { weight: 137.5, reps: 8 })).ok).toBe(
      true
    );
  });

  it("is driven by the config it is handed, not by a hard-coded muscle list", () => {
    // Same function, called directly with each config: the muscle name never
    // appears in validateLifts.js.
    expect(validateFor(CHEST_CONFIG, VALID.chest).ok).toBe(true);
    expect(validateFor(BACK_CONFIG, VALID.back).ok).toBe(true);
    // Chest lifts against the back config is every lift missing, plus three
    // unknown ones.
    const crossed = validateFor(BACK_CONFIG, VALID.chest);
    expect(crossed.ok).toBe(false);
    expect(crossed.errors).toHaveLength(6);
  });
});

describe("validateLifts boundaries", () => {
  // The limits themselves are read from the config, so these stay true if the
  // approved numbers are ever retuned.
  it.each([
    ["chest", "bench"],
    ["chest", "incline_db"],
    ["chest", "cable"],
    ["back", "lat_pulldown"],
    ["back", "db_row"],
    ["back", "deadlift"],
  ])("accepts %s/%s at exactly its minimum and maximum", (muscle, key) => {
    const config = muscle === "chest" ? CHEST_CONFIG : BACK_CONFIG;
    const bounds = boundsOf(config, key);

    for (const weight of [bounds.weight.min, bounds.weight.max]) {
      for (const reps of [bounds.reps.min, bounds.reps.max]) {
        const result = validateLifts(muscle, withLift(muscle, key, { weight, reps }));
        expect(result.ok, `${key} ${weight} lb x ${reps}: ${result.errors?.join(" ")}`).toBe(true);
      }
    }
  });

  it.each([
    ["chest", "bench"],
    ["back", "deadlift"],
  ])("rejects %s/%s just outside either limit", (muscle, key) => {
    const config = muscle === "chest" ? CHEST_CONFIG : BACK_CONFIG;
    const bounds = boundsOf(config, key);

    const tooLight = { weight: bounds.weight.min - 0.01, reps: 5 };
    const tooHeavy = { weight: bounds.weight.max + 0.01, reps: 5 };
    const tooFew = { weight: 100, reps: bounds.reps.min - 1 };
    const tooMany = { weight: 100, reps: bounds.reps.max + 1 };

    for (const [entry, field] of [
      [tooLight, "Weight"],
      [tooHeavy, "Weight"],
      [tooFew, "Reps"],
      [tooMany, "Reps"],
    ]) {
      const result = validateLifts(muscle, withLift(muscle, key, entry));
      expect(result.ok, JSON.stringify(entry)).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining(`${field} for "${key}"`));
    }
  });
});

describe("validateLifts rejections", () => {
  it.each([
    ["undefined", undefined],
    ["null", null],
    ["a string", "bench 135x8"],
    ["a number", 42],
    ["a boolean", true],
    ["an array", [{ weight: 135, reps: 8 }]],
  ])("rejects lifts that are %s", (_label, lifts) => {
    const result = validateLifts("chest", lifts);
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      '"lifts" must be an object with one entry per lift: "bench", "incline_db", "cable".',
    ]);
  });

  it("rejects an empty object by naming every missing lift", () => {
    const result = validateLifts("chest", {});
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      'Missing lift "bench". Every lift is required.',
      'Missing lift "incline_db". Every lift is required.',
      'Missing lift "cable". Every lift is required.',
    ]);
  });

  it("rejects a set that is missing one lift", () => {
    const { cable, ...twoLifts } = VALID.chest;
    expect(cable).toBeDefined();

    const result = validateLifts("chest", twoLifts);
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(['Missing lift "cable". Every lift is required.']);
  });

  it("rejects an unknown lift key and says what the muscle does score", () => {
    const result = validateLifts("chest", { ...VALID.chest, squat: { weight: 200, reps: 5 } });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      'Unknown lift "squat". This muscle scores "bench", "incline_db", "cable".',
    ]);
  });

  it("does not treat an inherited property as a submitted lift", () => {
    // `"bench" in lifts` would be true here; Object.hasOwn is not.
    const inherited = Object.create({ bench: { weight: 135, reps: 8 } });
    inherited.incline_db = { weight: 45, reps: 8 };
    inherited.cable = { weight: 20, reps: 12 };

    const result = validateLifts("chest", inherited);
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(['Missing lift "bench". Every lift is required.']);
  });

  it.each([
    ["null", null],
    ["a number", 135],
    ["a string", "135x8"],
    ["an array", [135, 8]],
  ])("rejects a lift entry that is %s", (_label, entry) => {
    const result = validateLifts("chest", withLift("chest", "bench", entry));
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      'Lift "bench" must be an object with a weight and a reps.',
    ]);
  });

  it.each([
    ["NaN", NaN],
    ["Infinity", Infinity],
    ["-Infinity", -Infinity],
    ["a numeric string", "135"],
    ["null", null],
    ["undefined", undefined],
    ["true", true],
    ["an array", [135]],
    ["an object", { value: 135 }],
  ])("rejects a weight that is %s", (_label, weight) => {
    const result = validateLifts("chest", withLift("chest", "bench", { weight, reps: 8 }));
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(['Weight for "bench" must be a number.']);
  });

  it.each([
    ["NaN", NaN],
    ["Infinity", Infinity],
    ["a numeric string", "8"],
    ["null", null],
    ["undefined", undefined],
    ["false", false],
    ["an array", [8]],
  ])("rejects reps that are %s", (_label, reps) => {
    const result = validateLifts("chest", withLift("chest", "bench", { weight: 135, reps }));
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(['Reps for "bench" must be a number.']);
  });

  it.each([7.5, 0.5, 29.999, -3.5])("rejects %s reps for not being whole", (reps) => {
    const result = validateLifts("chest", withLift("chest", "bench", { weight: 135, reps }));
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(['Reps for "bench" must be a whole number.']);
  });

  it("rejects zero and negative weights and reps", () => {
    for (const entry of [
      { weight: 0, reps: 8 },
      { weight: -135, reps: 8 },
      { weight: 135, reps: 0 },
      { weight: 135, reps: -8 },
    ]) {
      const result = validateLifts("chest", withLift("chest", "bench", entry));
      expect(result.ok, JSON.stringify(entry)).toBe(false);
    }
  });

  it("reports every problem at once rather than the first", () => {
    const result = validateLifts("chest", {
      bench: { weight: "heavy", reps: 7.5 },
      incline_db: { weight: 45, reps: 99 },
      squat: { weight: 200, reps: 5 },
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      'Weight for "bench" must be a number.',
      'Reps for "bench" must be a whole number.',
      'Reps for "incline_db" must be between 1 and 30.',
      'Missing lift "cable". Every lift is required.',
      'Unknown lift "squat". This muscle scores "bench", "incline_db", "cable".',
    ]);
  });

  it("never throws, whatever it is handed", () => {
    const hostile = [
      Object.create(null),
      new Map(),
      () => {},
      Symbol("lifts"),
      0n,
      { bench: { get weight() { return 135; }, reps: 8 } },
    ];
    for (const lifts of hostile) {
      expect(() => validateLifts("chest", lifts)).not.toThrow();
    }
  });
});

describe("the two exploit inputs from the v1 change log", () => {
  // Both were scored and stored before Prompt 3. The point of recording them
  // here is that they are refused for named reasons, not by accident.
  it("rejects a 99999 lb bench for 99 reps", () => {
    const result = validateLifts("chest", { bench: { weight: 99999, reps: 99 } });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      'Weight for "bench" must be between 1 and 1000 lb.',
      'Reps for "bench" must be between 1 and 30.',
      'Missing lift "incline_db". Every lift is required.',
      'Missing lift "cable". Every lift is required.',
    ]);
  });

  it("rejects 100 reps of a 15 lb dumbbell", () => {
    const result = validateLifts("chest", { incline_db: { weight: 15, reps: 100 } });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      'Missing lift "bench". Every lift is required.',
      'Reps for "incline_db" must be between 1 and 30.',
      'Missing lift "cable". Every lift is required.',
    ]);
  });

  it("rejects the bench-only 415 lb single that used to reach Primordial", () => {
    const result = validateLifts("chest", { bench: { weight: 415, reps: 1 } });
    expect(result.ok).toBe(false);
    // The weight and the reps are both legal. What is wrong is that a bench
    // alone was never a chest ranking.
    expect(result.errors).toEqual([
      'Missing lift "incline_db". Every lift is required.',
      'Missing lift "cable". Every lift is required.',
    ]);
  });

  it("rejects the deadlift-only 600 lb single that used to reach Primordial", () => {
    const result = validateLifts("back", { deadlift: { weight: 600, reps: 1 } });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      'Missing lift "lat_pulldown". Every lift is required.',
      'Missing lift "db_row". Every lift is required.',
    ]);
  });
});

describe("validateLifts through index.js", () => {
  it("throws only for a muscle with no engine", () => {
    expect(() => validateLifts("quads", VALID.chest)).toThrow(/no ranking engine for muscle/);
  });
});
