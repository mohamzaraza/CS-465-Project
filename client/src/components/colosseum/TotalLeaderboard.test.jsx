import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import TotalLeaderboard from "./TotalLeaderboard";

describe("TotalLeaderboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Tied scores share a rank, so rank alone cannot be the React key.
  it("renders two tied rows without a duplicate-key warning", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <TotalLeaderboard
        data={[
          { rank: 1, user: "a@example.com", tier: "TITAN", score: 900 },
          { rank: 1, user: "b@example.com", tier: "TITAN", score: 900 },
        ]}
      />
    );

    expect(screen.getByText("a@example.com")).toBeInTheDocument();
    expect(screen.getByText("b@example.com")).toBeInTheDocument();
    const keyWarnings = error.mock.calls.filter((args) =>
      args.some((arg) => String(arg).includes("same key"))
    );
    expect(keyWarnings).toEqual([]);
  });
});
