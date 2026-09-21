import { prisma } from "../lib/prisma.js";
import { computeChestTier } from "../src/ranking/chestRanking.js";
import { MS_PER_HOUR, RANK_COOLDOWN_HOURS } from "../config/constants.js";

export async function rankChest(req, res) {
  try {
    const userId = req.user.id;
    const lifts = req.body.lifts;

    if (!lifts) {
      return res.status(400).json({ error: "Missing lifts" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user.lastChestRankAt) {
      const hoursSince =
        (Date.now() - new Date(user.lastChestRankAt).getTime()) / MS_PER_HOUR;

      if (hoursSince < RANK_COOLDOWN_HOURS) {
        return res.status(403).json({
          error: "Chest ranking locked. Try again later.",
        });
      }
    }

    const result = computeChestTier(lifts);

    const tierEnum = result.tier.toUpperCase();
    const muscleEnum = "CHEST";

    const saved = await prisma.muscleRank.upsert({
      where: {
        userId_muscle: { userId, muscle: muscleEnum },
      },
      update: {
        tier: tierEnum,
        score: Math.round(result.score),
      },
      create: {
        userId,
        muscle: muscleEnum,
        tier: tierEnum,
        score: Math.round(result.score),
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { lastChestRankAt: new Date() },
    });

    res.json(saved);
  } catch (err) {
    console.error("Chest ranking error:", err);
    res.status(500).json({ error: "Failed to rank chest" });
  }
}


export async function getMyChestRank(req, res) {
  try {
    const userId = req.user.id;

    const rank = await prisma.muscleRank.findUnique({
      where: {
        userId_muscle: {
          userId,
          muscle: "CHEST",
        },
      },
    });

    if (!rank) {
      return res.json(null);
    }

    return res.json({
      muscle: rank.muscle,
      tier: rank.tier,
      score: rank.score,
    });
  } catch (err) {
    console.error("Get chest rank error:", err);
    return res.status(500).json({ error: "Failed to fetch chest rank" });
  }
}

//BACK
export async function rankBack(req, res) {
  try {
    const userLifts = req.body.lifts;

    const result = computeBackTier(userLifts);
    // TODO: save into DB later

    res.json(result);
  } catch (err) {
    console.error("Back ranking error:", err);
    res.status(500).json({ error: "Failed to rank back." });
  }
}