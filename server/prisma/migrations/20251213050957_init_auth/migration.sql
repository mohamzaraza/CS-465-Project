-- CreateEnum
CREATE TYPE "StrengthTier" AS ENUM ('UNTRAINED', 'RECRUIT', 'NOVICE', 'WARRIOR', 'HEROIC', 'CHAMPION', 'TITAN', 'OLYMPIAN', 'DIVINE', 'CELESTIAL', 'IMMORTAL', 'PRIMORDIAL');

-- CreateEnum
CREATE TYPE "MasteryLevel" AS ENUM ('UNTRAINED', 'DISCIPLINED', 'FULL_MASTERY', 'ASCENDED');

-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('CHEST', 'BACK', 'SHOULDERS', 'QUADS', 'HAMSTRINGS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'ABS', 'OBLIQUES', 'CALVES', 'GLUTES', 'LOWER_BACK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuscleMastery" (
    "id" TEXT NOT NULL,
    "muscle" "MuscleGroup" NOT NULL,
    "mastery" "MasteryLevel" NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MuscleMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuscleRank" (
    "id" TEXT NOT NULL,
    "muscle" "MuscleGroup" NOT NULL,
    "tier" "StrengthTier" NOT NULL,
    "score" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MuscleRank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLiftsLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "muscle" "MuscleGroup" NOT NULL,
    "liftName" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "reps" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLiftsLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "MuscleMastery" ADD CONSTRAINT "MuscleMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuscleRank" ADD CONSTRAINT "MuscleRank_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLiftsLog" ADD CONSTRAINT "UserLiftsLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
