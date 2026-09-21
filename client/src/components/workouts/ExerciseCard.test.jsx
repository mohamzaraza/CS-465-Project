import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ExerciseCard from "./ExerciseCard";

describe("ExerciseCard", () => {
  it("renders with only a name, skipping the video and empty sections", () => {
    const { container } = render(<ExerciseCard exercise={{ id: "x", name: "Test Lift" }} />);

    expect(screen.getByRole("heading", { name: "Test Lift" })).toBeInTheDocument();
    expect(container.querySelector("video")).toBeNull();
    expect(screen.queryByText("Form Cues")).not.toBeInTheDocument();
    expect(screen.queryByText("Common Mistakes")).not.toBeInTheDocument();
    expect(screen.queryByText(/Target:/)).not.toBeInTheDocument();
  });

  it("renders the video, cues and mistakes when they are provided", () => {
    const { container } = render(
      <ExerciseCard
        exercise={{
          id: "y",
          name: "Full Lift",
          video: "/videos/sample.mp4",
          cues: ["Cue one"],
          mistakes: ["Mistake one"],
        }}
      />
    );

    expect(container.querySelector("video source")).toHaveAttribute("src", "/videos/sample.mp4");
    expect(screen.getByText("Cue one")).toBeInTheDocument();
    expect(screen.getByText("Mistake one")).toBeInTheDocument();
  });
});
