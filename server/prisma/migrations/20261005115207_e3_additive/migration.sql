-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('LB', 'KG');

-- CreateEnum
CREATE TYPE "ExerciseDifficulty" AS ENUM ('NEWCOMER', 'WARRIOR', 'ELITE');

-- CreateEnum
CREATE TYPE "ExerciseNoteKind" AS ENUM ('CUE', 'MISTAKE');

-- AlterTable
-- HAND EDIT: Prisma generated a single ADD COLUMN ... NOT NULL DEFAULT CURRENT_TIMESTAMP,
-- which stamps every existing row with the migration time and locks every user out
-- of ranking for the cooldown period. Backfill from the old column first instead.
ALTER TABLE "MuscleRank" ADD COLUMN     "lastRankedAt" TIMESTAMP(3);

UPDATE "MuscleRank" mr
   SET "lastRankedAt" = COALESCE(u."lastChestRankAt", mr."updatedAt")
  FROM "User" u
 WHERE u."id" = mr."userId" AND mr."muscle" = 'CHEST';

UPDATE "MuscleRank" SET "lastRankedAt" = "updatedAt" WHERE "lastRankedAt" IS NULL;

ALTER TABLE "MuscleRank" ALTER COLUMN "lastRankedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "lastRankedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserLiftsLog" ADD COLUMN     "score" INTEGER NOT NULL,
ADD COLUMN     "weightUnit" "WeightUnit" NOT NULL DEFAULT 'LB';

-- CreateTable
CREATE TABLE "UserLiftsLogEntry" (
    "logId" TEXT NOT NULL,
    "liftKey" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,

    CONSTRAINT "UserLiftsLogEntry_pkey" PRIMARY KEY ("logId","liftKey"),
    -- HAND EDIT: Prisma cannot express CHECK constraints. A backstop to validateLifts.
    CONSTRAINT "UserLiftsLogEntry_positive_check" CHECK ("weight" > 0 AND "reps" > 0)
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "muscle" "MuscleGroup" NOT NULL,
    "name" TEXT NOT NULL,
    "difficulty" "ExerciseDifficulty" NOT NULL,
    "videoFile" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseTarget" (
    "exerciseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "ExerciseTarget_pkey" PRIMARY KEY ("exerciseId","position")
);

-- CreateTable
CREATE TABLE "ExerciseNote" (
    "exerciseId" TEXT NOT NULL,
    "kind" "ExerciseNoteKind" NOT NULL,
    "position" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "ExerciseNote_pkey" PRIMARY KEY ("exerciseId","kind","position")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_slug_key" ON "Exercise"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_muscle_sortOrder_key" ON "Exercise"("muscle", "sortOrder");

-- CreateIndex
CREATE INDEX "MuscleRank_muscle_score_userId_idx" ON "MuscleRank"("muscle", "score" DESC, "userId");

-- CreateIndex
CREATE INDEX "UserLiftsLog_userId_muscle_timestamp_idx" ON "UserLiftsLog"("userId", "muscle", "timestamp" DESC);

-- AddForeignKey
ALTER TABLE "UserLiftsLogEntry" ADD CONSTRAINT "UserLiftsLogEntry_logId_fkey" FOREIGN KEY ("logId") REFERENCES "UserLiftsLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseTarget" ADD CONSTRAINT "ExerciseTarget_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseNote" ADD CONSTRAINT "ExerciseNote_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint
-- HAND EDIT: Prisma cannot express CHECK constraints. Together with User_email_key
-- this makes email unique regardless of case. Validated against every existing
-- row: any stored email containing an uppercase letter makes this migration fail
-- and roll back (expected to pass trivially on the fresh test database).
ALTER TABLE "User" ADD CONSTRAINT "User_email_lowercase_check" CHECK ("email" = lower("email"));
