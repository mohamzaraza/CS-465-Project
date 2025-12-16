import { prisma } from "../lib/prisma.js";

export async function getChestLeaderboard(req, res) {
  try {
    const rows = await prisma.muscleRank.findMany({
      where: { muscle: "CHEST" },
      orderBy: { score: "desc" },
      take: 20,
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    const formatted = rows.map((row, index) => ({
      rank: index + 1,
      user: row.user.email,
      tier: row.tier,
      score: row.score,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
}
