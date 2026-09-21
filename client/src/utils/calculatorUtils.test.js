import { describe, it, expect } from "vitest";
import { computeResults, AGE_MIN, AGE_MAX } from "./calculatorUtils";

// Mirrors the form state shape Calculator.jsx keeps, with the reference person
// (25 y/o male, 180 lb, 5 ft 10 in) so each test only overrides what it varies.
const baseForm = {
  sex: "male",
  age: "25",
  weight: "180",
  weightUnit: "lbs",
  heightCm: "",
  heightFeet: "5",
  heightInches: "10",
  heightUnit: "ft",
  activity: "moderate",
  trainingLevel: "moderate",
  goal: "cut",
  adjustmentPercent: 20,
};

const form = (overrides = {}) => ({ ...baseForm, ...overrides });

describe("computeResults: reference cut scenario", () => {
  const r = computeResults(baseForm);

  it("computes BMR, maintenance and target calories", () => {
    expect(Math.round(r.bmr)).toBe(1808);
    expect(Math.round(r.tdee)).toBe(2802);
    expect(Math.round(r.caloriesMaintain)).toBe(2802);
    expect(Math.round(r.caloriesTarget)).toBe(2242);
  });

  it("projects about 1.12 lb of loss per week", () => {
    expect(r.weeklyChangeLbs).toBeCloseTo(-1.12, 2);
    expect(r.weeklyChangeKg).toBeLessThan(0);
  });

  it("recommends 2.0 g/kg protein (about 163 g)", () => {
    expect(r.proteinPerKg).toBe(2.0);
    expect(Math.round(r.proteinGrams)).toBe(163);
  });

  it("reports the adjustment it applied", () => {
    expect(r.adjustmentPercent).toBe(20);
  });
});

describe("computeResults: unit handling", () => {
  it("treats kg input the same as the equivalent lb input", () => {
    const lb = computeResults(form());
    const kg = computeResults(form({ weight: String(180 * 0.453592), weightUnit: "kg" }));
    expect(kg.weightKg).toBeCloseTo(lb.weightKg, 6);
    expect(kg.bmr).toBeCloseTo(lb.bmr, 6);
  });

  it("treats cm input the same as the equivalent ft/in input", () => {
    const ftIn = computeResults(form());
    const cm = computeResults(form({ heightUnit: "cm", heightCm: "177.8" }));
    expect(cm.bmr).toBeCloseTo(ftIn.bmr, 6);
    expect(cm.tdee).toBeCloseTo(ftIn.tdee, 6);
  });
});

describe("computeResults: goals", () => {
  it("bulk adds the surplus and projects a gain", () => {
    const r = computeResults(form({ goal: "bulk", adjustmentPercent: 15 }));
    expect(r.caloriesTarget).toBeCloseTo(r.tdee * 1.15, 6);
    expect(r.weeklyChangeLbs).toBeGreaterThan(0);
    expect(r.proteinPerKg).toBe(1.8);
  });

  it("maintain targets TDEE and projects no change", () => {
    const r = computeResults(form({ goal: "maintain" }));
    expect(r.caloriesTarget).toBe(r.tdee);
    expect(r.dailyDelta).toBe(0);
    expect(r.weeklyChangeLbs).toBe(0);
    expect(r.proteinPerKg).toBe(1.6);
  });

  it("falls back to 20% for cut and 15% for bulk when the adjustment is missing", () => {
    expect(computeResults(form({ goal: "cut", adjustmentPercent: "" })).adjustmentPercent).toBe(20);
    expect(computeResults(form({ goal: "bulk", adjustmentPercent: "" })).adjustmentPercent).toBe(15);
  });

  it("caps the adjustment at 70%", () => {
    expect(computeResults(form({ adjustmentPercent: 95 })).adjustmentPercent).toBe(70);
  });
});

describe("computeResults: invalid or empty input", () => {
  it.each([
    ["empty age", { age: "" }],
    ["empty weight", { weight: "" }],
    ["non-numeric weight", { weight: "abc" }],
    ["missing inches", { heightInches: "" }],
    ["missing feet", { heightFeet: "" }],
    ["empty cm height", { heightUnit: "cm", heightCm: "" }],
  ])("returns null for %s", (_label, overrides) => {
    expect(computeResults(form(overrides))).toBeNull();
  });
});

describe("computeResults: age limits", () => {
  it("uses 15 and 80 as the limits", () => {
    expect(AGE_MIN).toBe(15);
    expect(AGE_MAX).toBe(80);
  });

  it.each([
    [AGE_MIN - 1, false],
    [AGE_MIN, true],
    [AGE_MAX, true],
    [AGE_MAX + 1, false],
  ])("age %i gives a result: %s", (age, hasResult) => {
    const r = computeResults(form({ age: String(age) }));
    expect(r !== null).toBe(hasResult);
  });
});
