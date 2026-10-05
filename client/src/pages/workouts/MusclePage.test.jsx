import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import MusclePage from "./MusclePage";
import RegionPage from "./RegionPage";
import NotFound from "../NotFound";
import { REGIONS } from "../../data/muscleGroups";
import { apiRequest, ApiError } from "../../lib/api";

vi.mock("../../lib/api", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, apiRequest: vi.fn() };
});

// App.jsx owns a BrowserRouter, so these tests mount the same workout route
// patterns inside a MemoryRouter. Keep them in sync with App.jsx.
function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/workouts/:region" element={<RegionPage />} />
        <Route path="/workouts/:region/:muscle" element={<MusclePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MemoryRouter>
  );
}

const NOT_FOUND_TEXT = "404 — Page Not Found";

// GET /api/exercises' shape: a video file name, not a URL.
function apiExercise(id, name, tier, videoFile) {
  return { id, name, tier, videoFile, muscles: [], cues: [`${name} cue`], mistakes: [] };
}

const CHEST_EXERCISES = [
  apiExercise("bench-press", "Barbell Bench Press", "newcomer", "benchpress.mp4"),
  apiExercise("incline-dumbbell-press", "Incline Dumbbell Press", "warrior", "inclinedbpress.mp4"),
  apiExercise("weighted-dips", "Weighted Dips", "elite", "weighteddips.mp4"),
];

// Each test queues what the exercise request answers; anything left over
// answers an empty list, like a muscle with no content.
function mockExercises(...responses) {
  const queue = [...responses];
  apiRequest.mockImplementation(() => {
    const next = queue.length > 0 ? queue.shift() : [];
    return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
  });
}

beforeEach(() => {
  apiRequest.mockReset();
  mockExercises();
  // The page logs failed requests for debugging; keep test output readable.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MusclePage", () => {
  it("fetches and shows the chest exercises on /workouts/upper/chest", async () => {
    mockExercises(CHEST_EXERCISES);
    renderAt("/workouts/upper/chest");

    expect(screen.getByRole("heading", { level: 1, name: "CHEST" })).toBeInTheDocument();
    expect(await screen.findByText("Barbell Bench Press")).toBeInTheDocument();
    expect(screen.getByText("Incline Dumbbell Press")).toBeInTheDocument();
    expect(screen.getByText("Weighted Dips")).toBeInTheDocument();
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledWith("/exercises?muscle=CHEST");
  });

  it("turns the server's video file name into a URL under the app's base path", async () => {
    mockExercises(CHEST_EXERCISES);
    const { container } = renderAt("/workouts/upper/chest");
    await screen.findByText("Barbell Bench Press");

    const sources = [...container.querySelectorAll("video source")].map((s) => s.getAttribute("src"));
    expect(sources).toEqual(
      ["benchpress.mp4", "inclinedbpress.mp4", "weighteddips.mp4"].map(
        (file) => `${import.meta.env.BASE_URL}videos/${file}`
      )
    );
  });

  it("shows a loading state until the exercises arrive", async () => {
    let resolve;
    apiRequest.mockImplementation(() => new Promise((r) => (resolve = r)));
    renderAt("/workouts/upper/chest");

    expect(screen.getByRole("status")).toHaveTextContent("Loading...");
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();

    resolve(CHEST_EXERCISES);
    expect(await screen.findByText("Barbell Bench Press")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the coming-soon state when the server returns no exercises", async () => {
    mockExercises([]);
    renderAt("/workouts/upper/back");

    expect(screen.getByRole("heading", { level: 1, name: "BACK" })).toBeInTheDocument();
    expect(await screen.findByText("Exercises for this muscle are coming soon")).toBeInTheDocument();
    expect(screen.queryByText("Barbell Bench Press")).not.toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledWith("/exercises?muscle=BACK");
  });

  it("shows the error and a Retry button when the request fails, and recovers on retry", async () => {
    const user = userEvent.setup();
    mockExercises(
      new ApiError("The server ran into a problem. Please try again later.", { status: 500 }),
      CHEST_EXERCISES
    );
    renderAt("/workouts/upper/chest");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The server ran into a problem. Please try again later."
    );
    // A failure must not look like a muscle with no content.
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Barbell Bench Press")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["/workouts/upper/forearm", "FOREARMS"],
    ["/workouts/core/lowerback", "LOWER_BACK"],
  ])("asks for %s by its enum, %s, not its URL slug", async (path, muscleEnum) => {
    renderAt(path);
    await screen.findByText("Exercises for this muscle are coming soon");
    expect(apiRequest).toHaveBeenCalledWith(`/exercises?muscle=${muscleEnum}`);
  });

  it("renders NotFound for an unknown muscle, without fetching", () => {
    renderAt("/workouts/upper/banana");
    expect(screen.getByText(NOT_FOUND_TEXT)).toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("renders NotFound for an unknown region, even with a real muscle slug", () => {
    renderAt("/workouts/banana/chest");
    expect(screen.getByText(NOT_FOUND_TEXT)).toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("renders NotFound for a muscle requested under the wrong region", () => {
    renderAt("/workouts/lower/chest");
    expect(screen.getByText(NOT_FOUND_TEXT)).toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalled();
  });
});

describe("muscleGroups.js enum mapping", () => {
  // Mirrors the MuscleGroup enum in server/prisma/schema.prisma; the server
  // answers 400 for anything else.
  const SERVER_MUSCLE_GROUPS = [
    "CHEST", "BACK", "SHOULDERS", "QUADS", "HAMSTRINGS", "BICEPS", "TRICEPS",
    "FOREARMS", "ABS", "OBLIQUES", "CALVES", "GLUTES", "LOWER_BACK",
  ];

  it("gives every muscle a distinct value from the server's enum, covering all of it", () => {
    const values = REGIONS.flatMap((region) => region.muscles).map((m) => m.muscle);
    expect([...values].sort()).toEqual([...SERVER_MUSCLE_GROUPS].sort());
  });
});

describe("RegionPage", () => {
  it("renders NotFound for an unknown region", () => {
    renderAt("/workouts/banana");
    expect(screen.getByText(NOT_FOUND_TEXT)).toBeInTheDocument();
  });

  it.each(REGIONS.map((region) => [region.slug, region]))(
    "every link on /workouts/%s opens an existing muscle page",
    (slug, region) => {
      renderAt(`/workouts/${slug}`);
      expect(screen.getByRole("heading", { level: 1, name: region.title })).toBeInTheDocument();

      const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
      expect(hrefs).toHaveLength(region.muscles.length);
      cleanup();

      for (const href of hrefs) {
        renderAt(href);
        expect(screen.queryByText(NOT_FOUND_TEXT), href).not.toBeInTheDocument();
        const muscle = region.muscles.find((m) => href.endsWith(`/${m.slug}`));
        expect(screen.getByRole("heading", { level: 1, name: muscle.title })).toBeInTheDocument();
        cleanup();
      }
    }
  );
});
