import { describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import MusclePage from "./MusclePage";
import RegionPage from "./RegionPage";
import NotFound from "../NotFound";
import { REGIONS } from "../../data/muscleGroups";

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

describe("MusclePage", () => {
  it("shows the chest exercises on /workouts/upper/chest", () => {
    renderAt("/workouts/upper/chest");

    expect(screen.getByRole("heading", { level: 1, name: "CHEST" })).toBeInTheDocument();
    expect(screen.getByText("Barbell Bench Press")).toBeInTheDocument();
    expect(screen.getByText("Incline Dumbbell Press")).toBeInTheDocument();
    expect(screen.getByText("Weighted Dips")).toBeInTheDocument();
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
  });

  it("shows the coming-soon state on /workouts/upper/back, not chest exercises", () => {
    renderAt("/workouts/upper/back");

    expect(screen.getByRole("heading", { level: 1, name: "BACK" })).toBeInTheDocument();
    expect(screen.getByText("Exercises for this muscle are coming soon")).toBeInTheDocument();
    expect(screen.queryByText("Barbell Bench Press")).not.toBeInTheDocument();
  });

  it("renders NotFound for an unknown muscle", () => {
    renderAt("/workouts/upper/banana");
    expect(screen.getByText(NOT_FOUND_TEXT)).toBeInTheDocument();
  });

  it("renders NotFound for an unknown region, even with a real muscle slug", () => {
    renderAt("/workouts/banana/chest");
    expect(screen.getByText(NOT_FOUND_TEXT)).toBeInTheDocument();
  });

  it("renders NotFound for a muscle requested under the wrong region", () => {
    renderAt("/workouts/lower/chest");
    expect(screen.getByText(NOT_FOUND_TEXT)).toBeInTheDocument();
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
