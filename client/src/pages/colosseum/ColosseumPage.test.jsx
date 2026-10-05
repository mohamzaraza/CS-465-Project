import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ColosseumPage from "./ColosseumPage";
import { apiRequest, ApiError } from "../../lib/api";

vi.mock("../../lib/api", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, apiRequest: vi.fn() };
});

// The server's row shape since Enhancement 3: no user or email field.
const ROWS = [
  { rank: 1, tier: "TITAN", score: 900 },
  { rank: 2, tier: "RECRUIT", score: 120 },
];

// Each test decides how the leaderboard responds; the embedded rank panel's
// "current rank" lookup always answers null (not ranked yet).
function mockLeaderboard(...responses) {
  const queue = [...responses];
  apiRequest.mockImplementation((path) => {
    if (path !== "/leaderboard/chest") return Promise.resolve(null);
    const next = queue.shift();
    return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
  });
}

describe("ColosseumPage leaderboard", () => {
  beforeEach(() => {
    apiRequest.mockReset();
    // The page still logs failures for debugging; keep test output readable.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the rows when the request succeeds", async () => {
    mockLeaderboard(ROWS);
    render(<ColosseumPage />);

    expect(await screen.findByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("900")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("Titan")).toBeInTheDocument();
    expect(screen.getByText("Recruit")).toBeInTheDocument();
    expect(screen.queryByText("Unknown")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });

  it("shows the error and a Retry button when the request fails, and recovers on retry", async () => {
    const user = userEvent.setup();
    mockLeaderboard(
      new ApiError("The server ran into a problem. Please try again later.", { status: 500 }),
      ROWS
    );
    render(<ColosseumPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The server ran into a problem. Please try again later."
    );

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("#1")).toBeInTheDocument();
    expect(screen.getByText("Titan")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });
});
