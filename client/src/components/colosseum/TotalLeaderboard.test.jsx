import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import TotalLeaderboard from "./TotalLeaderboard";
import { LEADERBOARD_GRID } from "./leaderboardGrid";

// The server's row shape since Enhancement 3: no user or email field at all.
const TIED_ROWS = [
  { rank: 1, tier: "TITAN", score: 900 },
  { rank: 1, tier: "TITAN", score: 900 },
];

function keyWarnings(errorSpy) {
  return errorSpy.mock.calls.filter((args) => args.some((arg) => String(arg).includes("same key")));
}

describe("TotalLeaderboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Tied scores share a rank, and two tied rows are now identical in every
  // field, so nothing in a row can make the React key unique on its own.
  it("renders two identical tied rows without a duplicate-key warning", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<TotalLeaderboard data={TIED_ROWS} />);

    expect(screen.getAllByText("#1")).toHaveLength(2);
    expect(screen.getAllByText("Titan")).toHaveLength(2);
    expect(screen.getAllByText("900")).toHaveLength(2);
    expect(keyWarnings(error)).toEqual([]);
  });

  it("gives the header and every row the same columns, with no user column", () => {
    const { container } = render(<TotalLeaderboard data={TIED_ROWS} />);

    const gridSelector = LEADERBOARD_GRID.split(" ")
      .map((cls) => `.${CSS.escape(cls)}`)
      .join("");
    const [header, ...rows] = container.querySelectorAll(gridSelector);

    expect([...header.children].map((cell) => cell.textContent)).toEqual([
      "Rank",
      "Tier",
      "Score",
      "Stars",
    ]);
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.children).toHaveLength(header.children.length);
    }
  });

  it("does not render a user field even if one were sent", () => {
    render(<TotalLeaderboard data={[{ rank: 1, user: "leak@example.com", tier: "TITAN", score: 900 }]} />);

    expect(screen.queryByText("leak@example.com")).not.toBeInTheDocument();
    expect(screen.getByText("Titan")).toBeInTheDocument();
  });
});
