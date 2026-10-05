import { prisma } from "../lib/prisma.js";
import { rankLifts, tierForScore, validateLifts } from "../src/ranking/index.js";
import { MS_PER_HOUR, RANK_COOLDOWN_HOURS } from "../config/constants.js";

// What each muscle needs beyond the shared scoring code. Back used to compute a
// rank without saving it, because the cooldown lived in User.lastChestRankAt, a
// chest-only column. Enhancement 3 moved the cooldown onto the MuscleRank row
// itself, so every muscle with a ranking engine now saves and cools down on its
// own, and ranking one muscle never locks another.
const MUSCLES = {
  chest: {
    muscleEnum: "CHEST",
    lockedMessage: "Chest ranking locked. Try again later.",
    errorLabel: "Chest ranking error:",
    failureMessage: "Failed to rank chest",
  },
  back: {
    muscleEnum: "BACK",
    lockedMessage: "Back ranking locked. Try again later.",
    errorLabel: "Back ranking error:",
    failureMessage: "Failed to rank back.",
  },
};

// The response LiftRankForm has always read: the saved row's own fields, with
// the tier in the uppercase form the dropped tier column used to hold. Fields
// are picked rather than spread so the new lastRankedAt column does not leak
// into a contract that never had it.
function toSavedRank(row, muscle) {
  return {
    id: row.id,
    userId: row.userId,
    muscle: row.muscle,
    tier: tierForScore(muscle, row.score),
    score: row.score,
    updatedAt: row.updatedAt,
  };
}

/**
 * Save a new score for one muscle if, and only if, its cooldown has run out.
 * Returns false while the cooldown is still running.
 *
 * Enhancement 2 read the timestamp and wrote it back in two separate steps, so
 * two simultaneous requests could both pass the check. Here the check IS the
 * write: one conditional UPDATE, which Postgres re-evaluates against the row as
 * any concurrent request left it, so only one of them can match.
 */
async function saveIfCooledDown(userId, muscleEnum, score) {
  const now = new Date();
  // A row ranked exactly RANK_COOLDOWN_HOURS ago may rank again, as before.
  const cutoff = new Date(now.getTime() - RANK_COOLDOWN_HOURS * MS_PER_HOUR);

  const { count } = await prisma.muscleRank.updateMany({
    where: { userId, muscle: muscleEnum, lastRankedAt: { lte: cutoff } },
    data: { score, lastRankedAt: now },
  });
  if (count === 1) return true;

  // Nothing matched: either this is the user's first rank for this muscle, or
  // the row exists and is still cooling down. Creating tells the two apart
  // without a racy read first: the unique (userId, muscle) constraint refuses
  // the create (P2002) exactly when the row already exists.
  try {
    await prisma.muscleRank.create({
      data: { userId, muscle: muscleEnum, score, lastRankedAt: now },
    });
    return true;
  } catch (err) {
    if (err?.code === "P2002") return false;
    throw err;
  }
}

/**
 * The history row for one saved rank attempt, in the shape
 * prisma.userLiftsLog.create({ data }) takes. `lifts` is validateLifts' output,
 * so it holds exactly the muscle's configured lifts.
 *
 * TODO(Enhancement 3, Prompt 4): not written yet. UserLiftsLog still carries the
 * old liftName/weight/reps columns as NOT NULL until Migration 2 drops them, so
 * an insert now would fail. Once they are gone, write this in the same
 * transaction as saveIfCooledDown, so an attempt is logged if and only if it
 * was saved.
 */
export function rankAttemptLogData(userId, muscleEnum, lifts, score) {
  return {
    userId,
    muscle: muscleEnum,
    score,
    // The ranking form has no unit and the engine's anchors are in pounds.
    weightUnit: "LB",
    entries: {
      create: Object.entries(lifts).map(([liftKey, { weight, reps }]) => ({
        liftKey,
        weight,
        reps,
      })),
    },
  };
}

// One handler per muscle, built from the table above. Status codes and messages
// are unchanged for chest, and the response is still the saved row with an
// uppercase tier, which is what the client's LiftRankForm reads.
function createRankHandler(muscle) {
  const { muscleEnum, lockedMessage, errorLabel, failureMessage } = MUSCLES[muscle];

  return async function rankHandler(req, res) {
    try {
      const userId = req.user.id;

      // Validation first, so a malformed request never costs a cooldown slot.
      const checked = validateLifts(muscle, req.body?.lifts);
      if (!checked.ok) {
        // `error` is the single message the other controllers send and the one
        // the client's api.js surfaces; `errors` adds the full list for a form
        // that wants to show every problem at once.
        return res.status(400).json({ error: checked.errors.join(" "), errors: checked.errors });
      }

      // Scoring is pure, so doing it before the save costs nothing if the
      // cooldown then refuses it, and the save stays a single statement.
      const result = rankLifts(muscle, checked.lifts);

      const saved = await saveIfCooledDown(userId, muscleEnum, result.score);
      if (!saved) {
        return res.status(403).json({ error: lockedMessage });
      }

      const row = await prisma.muscleRank.findUnique({
        where: { userId_muscle: { userId, muscle: muscleEnum } },
      });

      res.json(toSavedRank(row, muscle));
    } catch (err) {
      console.error(errorLabel, err);
      res.status(500).json({ error: failureMessage });
    }
  };
}

export const rankChest = createRankHandler("chest");
export const rankBack = createRankHandler("back");

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
      select: { muscle: true, score: true },
    });

    if (!rank) {
      return res.json(null);
    }

    return res.json({
      muscle: rank.muscle,
      tier: tierForScore("chest", rank.score),
      score: rank.score,
    });
  } catch (err) {
    console.error("Get chest rank error:", err);
    return res.status(500).json({ error: "Failed to fetch chest rank" });
  }
}
