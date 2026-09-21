import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LiftRankForm from "./LiftRankForm";
import liftConfigs from "../../config/liftConfigs";
import { apiRequest, ApiError } from "../../lib/api";

vi.mock("../../lib/api", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, apiRequest: vi.fn() };
});

const lifts = liftConfigs.chest;

function postCalls() {
  return apiRequest.mock.calls.filter(([, opts]) => opts?.method === "POST");
}

async function fillAll(user, values) {
  for (const { label } of lifts) {
    const [weight, reps] = values[label] ?? ["100", "5"];
    await user.type(screen.getByLabelText(`${label} weight`), weight);
    await user.type(screen.getByLabelText(`${label} reps`), reps);
  }
}

describe("LiftRankForm", () => {
  beforeEach(() => {
    apiRequest.mockReset();
    // Unranked user: the current-rank lookup returns null.
    apiRequest.mockResolvedValue(null);
  });

  it("renders a weight and reps field for every configured lift", () => {
    render(<LiftRankForm muscle="chest" lifts={lifts} />);
    for (const { label } of lifts) {
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByLabelText(`${label} weight`)).toBeInTheDocument();
      expect(screen.getByLabelText(`${label} reps`)).toBeInTheDocument();
    }
    expect(screen.getAllByPlaceholderText("Weight")).toHaveLength(lifts.length);
  });

  it("blocks submit and shows an error when fields are empty", async () => {
    const user = userEvent.setup();
    render(<LiftRankForm muscle="chest" lifts={lifts} />);

    await user.click(screen.getByRole("button", { name: "Rank Me" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter weight and reps for Bench Press.");
    expect(postCalls()).toHaveLength(0);
  });

  it.each([
    ["a zero weight", ["0", "5"], "Weight for Bench Press must be above 0."],
    ["a negative weight", ["-10", "5"], "Weight for Bench Press must be above 0."],
    ["zero reps", ["100", "0"], "Reps for Bench Press must be a whole number above 0."],
    ["fractional reps", ["100", "5.5"], "Reps for Bench Press must be a whole number above 0."],
  ])("blocks submit for %s", async (_name, bench, message) => {
    const user = userEvent.setup();
    render(<LiftRankForm muscle="chest" lifts={lifts} />);

    await fillAll(user, { "Bench Press": bench });
    await user.click(screen.getByRole("button", { name: "Rank Me" }));

    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(postCalls()).toHaveLength(0);
  });

  it("posts parsed numbers and shows the resulting tier and score", async () => {
    const user = userEvent.setup();
    const onRanked = vi.fn();
    const ranked = { tier: "WARRIOR", score: 412.6 };
    apiRequest.mockImplementation((path, opts) =>
      Promise.resolve(opts?.method === "POST" ? ranked : null)
    );
    render(<LiftRankForm muscle="chest" lifts={lifts} onRanked={onRanked} showResult />);

    await fillAll(user, {
      "Bench Press": ["102.5", "5"],
      "Incline DB Press": ["40", "8"],
      "Cable Fly": ["25", "12"],
    });
    await user.click(screen.getByRole("button", { name: "Rank Me" }));

    expect(postCalls()).toEqual([
      [
        "/rank/chest",
        {
          method: "POST",
          body: {
            lifts: {
              bench: { weight: 102.5, reps: 5 },
              incline_db: { weight: 40, reps: 8 },
              cable: { weight: 25, reps: 12 },
            },
          },
        },
      ],
    ]);
    expect(onRanked).toHaveBeenCalledWith(ranked);
    expect(await screen.findByText("New Tier:", { exact: false })).toBeInTheDocument();
    expect(screen.getAllByText("WARRIOR")).toHaveLength(2); // current rank + new tier
    expect(screen.getAllByText("Score: 413")).toHaveLength(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the server's message when ranking is on cooldown", async () => {
    const user = userEvent.setup();
    apiRequest.mockImplementation((path, opts) =>
      opts?.method === "POST"
        ? Promise.reject(
            new ApiError("Chest ranking locked. Try again later.", { status: 403 })
          )
        : Promise.resolve(null)
    );
    render(<LiftRankForm muscle="chest" lifts={lifts} showResult />);

    await fillAll(user, {});
    await user.click(screen.getByRole("button", { name: "Rank Me" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Chest ranking locked. Try again later."
    );
    expect(screen.queryByText("New Tier:", { exact: false })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rank Me" })).toBeEnabled();
  });
});
