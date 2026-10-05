import { describe, it, expect } from "vitest";
import { REGIONS, findMuscle, findRegion } from "./muscleGroups";

const allMuscles = REGIONS.flatMap((region) => region.muscles);
const regionSlugs = REGIONS.map((region) => region.slug);

describe("muscleGroups", () => {
  it("has the three regions whose URLs already exist", () => {
    expect(regionSlugs).toEqual(["upper", "lower", "core"]);
  });

  it("gives every muscle a unique slug", () => {
    // Slugs must be unique across regions: each one stands for a single muscle,
    // and so for a single MuscleGroup value when the page fetches exercises.
    const slugs = allMuscles.map((m) => m.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every muscle a valid region matching the region it is listed under", () => {
    for (const region of REGIONS) {
      for (const muscle of region.muscles) {
        expect(regionSlugs).toContain(muscle.region);
        expect(muscle.region).toBe(region.slug);
      }
    }
  });

  it("gives every muscle a title, description and link label", () => {
    for (const muscle of allMuscles) {
      expect(muscle.title, muscle.slug).toBeTruthy();
      expect(muscle.description, muscle.slug).toBeTruthy();
      expect(muscle.linkLabel, muscle.slug).toBeTruthy();
    }
  });

  it("keeps today's URL slugs", () => {
    const paths = allMuscles.map((m) => `${m.region}/${m.slug}`);
    expect(paths.sort()).toEqual(
      [
        "upper/chest", "upper/back", "upper/shoulders", "upper/biceps", "upper/triceps", "upper/forearm",
        "lower/quads", "lower/hamstrings", "lower/glutes", "lower/calves",
        "core/abs", "core/obliques", "core/lowerback",
      ].sort()
    );
  });

  it("looks up regions and muscles, and returns undefined for unknown slugs", () => {
    expect(findRegion("core").title).toBe("CORE");
    expect(findMuscle("lower", "quads").title).toBe("QUADRICEPS");
    expect(findRegion("banana")).toBeUndefined();
    expect(findMuscle("upper", "banana")).toBeUndefined();
    expect(findMuscle("banana", "chest")).toBeUndefined();
  });
});
