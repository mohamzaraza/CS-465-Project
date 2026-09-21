import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Calculator from "./Calculator";

// The form's labels are not linked to their inputs, so select by name attribute.
const field = (container, name) => container.querySelector(`[name="${name}"]`);

describe("Calculator page", () => {
  it("shows the placeholder until the stats are complete", () => {
    render(<Calculator />);
    expect(screen.getByText(/Start by entering your details/)).toBeInTheDocument();
  });

  it("shows live results once age, weight and height are entered", async () => {
    const user = userEvent.setup();
    const { container } = render(<Calculator />);

    // Defaults: male, kg, cm, moderate activity, maintain.
    await user.type(field(container, "age"), "25");
    await user.type(field(container, "weight"), "80");
    await user.type(field(container, "heightCm"), "180");

    // BMR = 10*80 + 6.25*180 - 5*25 + 5 = 1805; TDEE = 1805 * 1.55 = 2797.75
    expect(screen.getByText("1805 calories/day")).toBeInTheDocument();
    expect(screen.getByText("2798 calories/day")).toBeInTheDocument();
    expect(screen.queryByText(/Start by entering your details/)).not.toBeInTheDocument();
  });

  it("shows the age message instead of results for an out-of-range age", async () => {
    const user = userEvent.setup();
    const { container } = render(<Calculator />);

    await user.type(field(container, "age"), "81");
    await user.type(field(container, "weight"), "80");
    await user.type(field(container, "heightCm"), "180");

    expect(screen.getByText(/Please enter an age between 15 and 80/)).toBeInTheDocument();
    expect(screen.queryByText(/calories\/day/)).not.toBeInTheDocument();
  });
});
