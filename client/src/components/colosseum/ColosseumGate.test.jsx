import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ColosseumGate from "./ColosseumGate";

const SEEN_KEY = "ArenaCutscene.mov_seen";

describe("ColosseumGate", () => {
  it("plays the cinematic on a first visit", () => {
    render(<ColosseumGate />);
    expect(screen.getByRole("button", { name: "Skip" })).toBeInTheDocument();
    expect(screen.queryByText("Enter the Arena")).not.toBeInTheDocument();
  });

  it("goes straight to the honor warning once the cinematic was seen", () => {
    localStorage.setItem(SEEN_KEY, "true");
    render(<ColosseumGate />);
    expect(screen.getByRole("button", { name: "Enter the Arena" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skip" })).not.toBeInTheDocument();
  });

  it("skipping the cinematic remembers it and shows the warning", async () => {
    const user = userEvent.setup();
    render(<ColosseumGate />);

    await user.click(screen.getByRole("button", { name: "Skip" }));

    expect(localStorage.getItem(SEEN_KEY)).toBe("true");
    expect(screen.getByRole("button", { name: "Enter the Arena" })).toBeInTheDocument();
  });
});
