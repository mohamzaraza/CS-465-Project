import { MuscleGroup } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

// Validated against the enum the database itself uses, so the list can never
// drift from the schema.
const MUSCLE_GROUPS = Object.values(MuscleGroup);

// The shape the client's static exercises.js used, so DifficultySection and
// ExerciseCard read it unchanged: `id` is the slug, `tier` the lowercase
// difficulty they filter on, and `muscles`, `cues` and `mistakes` plain string
// lists. The one difference is `videoFile`, a file name where the static data
// had a URL: only the client knows its own base path.
function toExercise(row) {
  return {
    id: row.slug,
    name: row.name,
    tier: row.difficulty.toLowerCase(),
    videoFile: row.videoFile,
    muscles: row.targets.map((target) => target.label),
    cues: row.notes.filter((note) => note.kind === "CUE").map((note) => note.text),
    mistakes: row.notes.filter((note) => note.kind === "MISTAKE").map((note) => note.text),
  };
}

export async function getExercises(req, res) {
  const { muscle } = req.query;

  // An array (?muscle=A&muscle=B) or a missing value is as wrong as a typo.
  if (typeof muscle !== "string" || !MUSCLE_GROUPS.includes(muscle)) {
    return res.status(400).json({
      error: `Query parameter "muscle" must be one of: ${MUSCLE_GROUPS.join(", ")}.`,
    });
  }

  // Every order is set here rather than trusted to insertion order, which
  // Postgres does not guarantee.
  const rows = await prisma.exercise.findMany({
    where: { muscle },
    orderBy: { sortOrder: "asc" },
    select: {
      slug: true,
      name: true,
      difficulty: true,
      videoFile: true,
      targets: { orderBy: { position: "asc" }, select: { label: true } },
      notes: {
        orderBy: [{ kind: "asc" }, { position: "asc" }],
        select: { kind: true, text: true },
      },
    },
  });

  res.json(rows.map(toExercise));
}
