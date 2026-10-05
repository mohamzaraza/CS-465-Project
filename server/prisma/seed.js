// Writes the exercise catalog (prisma/seedData/exercises.js) into Exercise,
// ExerciseTarget and ExerciseNote. Safe to run more than once: each exercise is
// upserted on its slug, and its targets and notes are replaced, so a rerun
// leaves exactly one copy of everything.
//
// Run from server/:  npm run db:seed   (the test database, via .env.test)
// Any other database needs an explicit --env-file on the command line.

// Prisma Client loads server/.env by itself, so without this check a missing
// DATABASE_URL in the chosen env file would silently seed the live database.
const envFileArg = process.execArgv.find((arg) => arg.startsWith("--env-file"));
if (!envFileArg) {
  console.error("Refusing to run: start with node --env-file=<file> so the target database is explicit");
  process.exit(2);
}
if (!process.env.DATABASE_URL) {
  console.error(`Refusing to run: ${envFileArg} does not set DATABASE_URL`);
  process.exit(2);
}

const { PrismaClient } = await import("@prisma/client");
const { EXERCISES_BY_MUSCLE } = await import("./seedData/exercises.js");

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

// The static file's lowercase tier is the ExerciseDifficulty enum's name.
function toRows(muscle, exercise, sortOrder) {
  const fields = {
    muscle,
    name: exercise.name,
    difficulty: exercise.tier.toUpperCase(),
    videoFile: exercise.video,
    sortOrder,
  };
  const targets = exercise.muscles.map((label, position) => ({ position, label }));
  const notes = [
    ...exercise.cues.map((text, position) => ({ kind: "CUE", position, text })),
    ...exercise.mistakes.map((text, position) => ({ kind: "MISTAKE", position, text })),
  ];
  return { fields, targets, notes };
}

try {
  const [{ db }] = await prisma.$queryRawUnsafe(`SELECT current_database() AS db`);
  console.log(`seeding database: ${db} (${envFileArg})`);

  for (const [muscle, exercises] of Object.entries(EXERCISES_BY_MUSCLE)) {
    for (const [sortOrder, exercise] of exercises.entries()) {
      const { fields, targets, notes } = toRows(muscle, exercise, sortOrder);
      // One upsert with nested writes is one transaction, so an exercise is
      // never left with half its notes.
      await prisma.exercise.upsert({
        where: { slug: exercise.id },
        create: {
          slug: exercise.id,
          ...fields,
          targets: { create: targets },
          notes: { create: notes },
        },
        update: {
          ...fields,
          targets: { deleteMany: {}, create: targets },
          notes: { deleteMany: {}, create: notes },
        },
      });
      console.log(`  upserted ${muscle} ${exercise.id}`);
    }
  }

  const [exercises, targets, notes] = await Promise.all([
    prisma.exercise.count(),
    prisma.exerciseTarget.count(),
    prisma.exerciseNote.count(),
  ]);
  const byKind = await prisma.exerciseNote.groupBy({ by: ["kind"], _count: { _all: true } });
  console.log(`rows now in Exercise: ${exercises}, ExerciseTarget: ${targets}, ExerciseNote: ${notes}`);
  for (const { kind, _count } of byKind) console.log(`  ExerciseNote ${kind}: ${_count._all}`);
} finally {
  await prisma.$disconnect();
}
