// The seed's catalog is a copy of client/src/data/exercises.js (see the comment
// in prisma/seedData/exercises.js for why it cannot import it). This test is
// what makes that copy trustworthy: it reads the client's real file and fails on
// any difference in wording, order, tier or video, so nothing reaches the
// database that the site did not already show.
//
// Delete this test along with client/src/data/exercises.js once that file goes.

import { describe, expect, it } from "vitest";

import { EXERCISES_BY_MUSCLE } from "../prisma/seedData/exercises.js";
import { exercisesByMuscle } from "../../client/src/data/exercises.js";
import { REGIONS } from "../../client/src/data/muscleGroups.js";

// The client keys exercises by URL slug and muscleGroups.js maps each slug to
// its enum, so the comparison goes through the same mapping the page uses.
const enumBySlug = Object.fromEntries(
  REGIONS.flatMap((region) => region.muscles).map((m) => [m.slug, m.muscle])
);

// The client builds video URLs from Vite's base path; the seed stores the name.
function asSeedEntry(exercise) {
  const prefix = `${import.meta.env.BASE_URL}videos/`;
  expect(exercise.video.startsWith(prefix)).toBe(true);
  return { ...exercise, video: exercise.video.slice(prefix.length) };
}

describe("seed catalog", () => {
  it("covers every slug in the client file with a known enum", () => {
    for (const slug of Object.keys(exercisesByMuscle)) {
      expect(enumBySlug[slug], slug).toBeDefined();
    }
  });

  it("matches client/src/data/exercises.js exactly, muscle by muscle", () => {
    const fromClient = Object.fromEntries(
      Object.entries(exercisesByMuscle)
        .filter(([, exercises]) => exercises.length > 0)
        .map(([slug, exercises]) => [enumBySlug[slug], exercises.map(asSeedEntry)])
    );

    expect(EXERCISES_BY_MUSCLE).toEqual(fromClient);
  });
});
