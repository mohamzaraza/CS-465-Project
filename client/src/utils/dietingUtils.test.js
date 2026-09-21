import { describe, it, expect } from "vitest";
import { FOOD_DATA, computeTotals, getPlateFeedback } from "./dietingUtils";

const food = (id) => {
  const item = FOOD_DATA.find((f) => f.id === id);
  if (!item) throw new Error(`Unknown food id in test: ${id}`);
  return item;
};

const basePlate = () => [food("chicken-100"), food("rice-150"), food("broccoli-100")];

describe("computeTotals", () => {
  it("sums chicken + rice + broccoli to 395 kcal", () => {
    const totals = computeTotals(basePlate());
    expect(totals.calories).toBe(395);
    expect(totals.protein).toBeCloseTo(38, 6);
    expect(totals.carbs).toBeCloseTo(49, 6);
    expect(totals.fats).toBeCloseTo(4.3, 6);
  });

  it("reaches 515 kcal once olive oil is added", () => {
    expect(computeTotals([...basePlate(), food("olive-oil-1tbsp")]).calories).toBe(515);
  });

  it("returns zeros for an empty plate", () => {
    expect(computeTotals([])).toEqual({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  });
});

describe("getPlateFeedback", () => {
  it("calls the 395 kcal plate very light", () => {
    const plate = basePlate();
    const messages = getPlateFeedback(plate, computeTotals(plate));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatch(/very light/);
  });

  it("calls the 515 kcal plate solid", () => {
    const plate = [...basePlate(), food("olive-oil-1tbsp")];
    const messages = getPlateFeedback(plate, computeTotals(plate));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatch(/^Solid plate/);
  });

  it("gives the empty-plate prompt for an empty plate", () => {
    const messages = getPlateFeedback([], computeTotals([]));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatch(/Your plate is empty/);
  });
});
