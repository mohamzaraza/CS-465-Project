import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import LeaderboardRow from "./LeaderboardRow";

describe("LeaderboardRow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders rank, tier and score from the narrowed row shape", () => {
    render(<LeaderboardRow row={{ rank: 3, tier: "HEROIC", score: 940 }} />);

    expect(screen.getByText("#3")).toBeInTheDocument();
    expect(screen.getByText("Heroic")).toBeInTheDocument();
    expect(screen.getByText("940")).toBeInTheDocument();
  });

  // The server no longer sends one; a stray field must still never reach the page.
  it("never renders a user field", () => {
    render(<LeaderboardRow row={{ rank: 1, user: "leak@example.com", tier: "TITAN", score: 900 }} />);

    expect(screen.queryByText("leak@example.com")).not.toBeInTheDocument();
  });

  it("never renders a user field in the unknown-tier fallback either", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<LeaderboardRow row={{ rank: 1, user: "leak@example.com", tier: "BOGUS", score: 900 }} />);

    expect(screen.getByText("Unknown")).toBeInTheDocument();
    expect(screen.queryByText("leak@example.com")).not.toBeInTheDocument();
  });
});
