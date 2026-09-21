import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BuildPlateSection from "./BuildPlateSection";

// Food names also appear on the plate once added, so locate the Add button
// through the options list (the only <li> rows that carry food names).
const addButtonFor = (name) => {
  const row = screen
    .getAllByRole("listitem")
    .find((li) => li.textContent.includes(name));
  return within(row).getByRole("button", { name: "Add" });
};

const addTimes = async (user, name, times) => {
  for (let i = 0; i < times; i++) {
    await user.click(addButtonFor(name));
  }
};

describe("BuildPlateSection limits", () => {
  it("stops at 5 portions of the same food", async () => {
    const user = userEvent.setup();
    render(<BuildPlateSection />);

    await addTimes(user, "Chicken Breast (100g)", 5);
    expect(screen.queryByText(/already added/)).not.toBeInTheDocument();

    await user.click(addButtonFor("Chicken Breast (100g)"));
    expect(
      screen.getByText(/already added 5 portions of Chicken Breast \(100g\)/)
    ).toBeInTheDocument();
    // The rejected sixth portion must not reach the totals (5 x 165 kcal).
    expect(screen.getByText("825 kcal")).toBeInTheDocument();
  });

  it("stops at 15 items in total", async () => {
    const user = userEvent.setup();
    render(<BuildPlateSection />);

    await addTimes(user, "Chicken Breast (100g)", 5);
    await addTimes(user, "Eggs (2 whole)", 5);
    await addTimes(user, "Greek Yogurt (170g)", 5);
    expect(screen.queryByText(/plate is full/)).not.toBeInTheDocument();

    await user.click(addButtonFor("Whey Protein Shake"));
    expect(screen.getByText(/plate is full.*Max 15 items/)).toBeInTheDocument();
    // 5 x 165 + 5 x 140 + 5 x 100: the shake was not added.
    expect(screen.getByText("2025 kcal")).toBeInTheDocument();
  });
});
