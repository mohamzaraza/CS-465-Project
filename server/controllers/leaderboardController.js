import { prisma } from "../lib/prisma.js";
import { rankWithTies, topK } from "../src/ranking/leaderboard.js";
import { tierForScore } from "../src/ranking/index.js";

export const LEADERBOARD_LIMIT = 20;

// The one place a leaderboard row's public fields are chosen, shared by every
// leaderboard endpoint. Leaderboards are public, so no field identifying the
// user is sent: Enhancement 3 removed the email that used to go out as `user`.
// A public display name would be the way to show who is who again.
function toLeaderboardRow({ rank, tier, score }) {
  return { rank, tier, score };
}

export async function getChestLeaderboard(req, res) {
  try {
    const rows = await prisma.muscleRank.findMany({
      where: { muscle: "CHEST" },
      // userId breaks score ties so the 20-row cutoff stays the same from one
      // request to the next. This filter and order are exactly the columns of
      // MuscleRank_muscle_score_userId_idx, which is what lets Postgres read the
      // top rows straight off the index instead of sorting every chest row;
      // change one and the other must change with it.
      orderBy: [{ score: "desc" }, { userId: "asc" }],
      take: LEADERBOARD_LIMIT,
      select: { score: true },
    });

    const formatted = rankWithTies(rows, (row) => row.score).map((row) =>
      toLeaderboardRow({
        rank: row.rank,
        tier: tierForScore("chest", row.score),
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
    // Every rank row is read once and summed here, so the tie-break and the
    // top-20 selection stay the ones Enhancement 2 tested. Only userId and score
    // are read: nothing about the user leaves this function.
    const rows = await prisma.muscleRank.findMany({
      select: {
        userId: true,
        score: true,
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
        totals.set(row.userId, { userId: row.userId, score: row.score });
      }
    }

    const best = topK([...totals.values()], LEADERBOARD_LIMIT, compareTotals);

    const formatted = rankWithTies(best, (total) => total.score).map((total) =>
      toLeaderboardRow({
        rank: total.rank,
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
