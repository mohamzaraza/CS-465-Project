/*
  Warnings:

  - A unique constraint covering the columns `[userId,muscle]` on the table `MuscleRank` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MuscleRank_userId_muscle_key" ON "MuscleRank"("userId", "muscle");
