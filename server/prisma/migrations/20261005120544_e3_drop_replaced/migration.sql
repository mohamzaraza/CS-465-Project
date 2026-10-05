/*
  Warnings (Enhancement 3, Migration 2: drops only):

  - The column `lastChestRankAt` on `User` is dropped; its data was copied to
    MuscleRank.lastRankedAt by Migration 1 (verified by db-check post-m1).
  - The column `tier` on `MuscleRank` is dropped; tiers are derived with
    tierForScore (verified by tests/ranking.tierForScore.test.js).
  - The columns `liftName`, `weight` and `reps` on `UserLiftsLog` are dropped;
    run db-check pre-m2 first: the table must be empty.
  - The table `MuscleMastery` and the enum `MasteryLevel` are dropped; nothing
    in the codebase ever used them. All the data in them will be lost.
*/
-- DropForeignKey
ALTER TABLE "MuscleMastery" DROP CONSTRAINT "MuscleMastery_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "lastChestRankAt";

-- AlterTable
ALTER TABLE "MuscleRank" DROP COLUMN "tier";

-- AlterTable
ALTER TABLE "UserLiftsLog" DROP COLUMN "liftName",
DROP COLUMN "reps",
DROP COLUMN "weight";

-- DropTable
DROP TABLE "MuscleMastery";

-- DropEnum
DROP TYPE "MasteryLevel";

