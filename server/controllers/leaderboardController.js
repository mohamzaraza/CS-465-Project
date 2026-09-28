import { prisma } from "../lib/prisma.js";
import { rankWithTies, topK } from "../src/ranking/leaderboard.js";

export const LEADERBOARD_LIMIT = 20;

// The one place a leaderboard row's public fields are chosen, shared by every
// leaderboard endpoint. Enhancement 3 removes the email field here, and in no
// other place.
function toLeaderboardRow({ rank, email, tier, score }) {
  return { rank, user: email, tier, score };
}

export async function getChestLeaderboard(req, res) {
  try {
    const rows = await prisma.muscleRank.findMany({
      where: { muscle: "CHEST" },
      // userId breaks score ties so the 20-row cutoff, and the order of tied
      // rows, stay the same from one request to the next.
      orderBy: [{ score: "desc" }, { userId: "asc" }],
      take: LEADERBOARD_LIMIT,
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    const formatted = rankWithTies(rows, (row) => row.score).map((row) =>
      toLeaderboardRow({
        rank: row.rank,
        email: row.user.email,
        tier: row.tier,
        score: row.score,
      })
    );

    res.json(formatted);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
}

// Same score-then-userId order as the chest query, so both endpoints break
// ties the same way.
function compareTotals(a, b) {
  return b.score - a.score || (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0);
}

export async function getTotalLeaderboard(req, res) {
  try {
    // The database cannot sort by a per-user sum without a groupBy that also
    // loses the email, so every rank row is read once and summed here.
    const rows = await prisma.muscleRank.findMany({
      select: {
        userId: true,
        score: true,
        user: {
          select: { email: true },
        },
      },
    });

    // One pass over the rows: O(n). A user who has ranked only some muscles
    // simply has fewer rows to add.
    const totals = new Map();
    for (const row of rows) {
      const total = totals.get(row.userId);
      if (total) {
        total.score += row.score;
      } else {
        totals.set(row.userId, { userId: row.userId, email: row.user.email, score: row.score });
      }
    }

    const best = topK([...totals.values()], LEADERBOARD_LIMIT, compareTotals);

    const formatted = rankWithTies(best, (total) => total.score).map((total) =>
      toLeaderboardRow({
        rank: total.rank,
        email: total.email,
        // Tiers are per muscle; there is no cross-muscle tier to report.
        tier: null,
        score: total.score,
      })
    );

    res.json(formatted);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
}
