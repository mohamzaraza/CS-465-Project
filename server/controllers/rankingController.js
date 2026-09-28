import { prisma } from "../lib/prisma.js";
import { rankLifts, validateLifts } from "../src/ranking/index.js";
import { MS_PER_HOUR, RANK_COOLDOWN_HOURS } from "../config/constants.js";

// What each muscle does with a result it has computed. The scoring itself is the
// same code for every muscle, so this table is the only thing that differed
// between the old hand-copied chest and back handlers.
//
// `saves: null` is not a gap, it is a decision (Prompt 3, approved): the rank
// cooldown reads User.lastChestRankAt, a chest-only column, and the muscle enum
// and a per-muscle cooldown column are Enhancement 3's schema work. Rather than
// make back share chest's cooldown or invent a column, POST /api/rank/back
// computes and returns the rank WITHOUT saving it and without a cooldown. It
// used to answer 500 for every request, because the handler called
// computeBackTier and the module never imported it.
const MUSCLES = {
  chest: {
    saves: {
      muscleEnum: "CHEST",
      // The User column holding the last time this muscle was ranked.
      cooldownField: "lastChestRankAt",
      lockedMessage: "Chest ranking locked. Try again later.",
    },
    errorLabel: "Chest ranking error:",
    failureMessage: "Failed to rank chest",
  },
  back: {
    saves: null,
    errorLabel: "Back ranking error:",
    failureMessage: "Failed to rank back.",
  },
};

// One handler per muscle, built from the table above. Chest's behavior for valid
// input is unchanged down to the status codes, the message text and the shape of
// the response (the saved Prisma row, which the client's LiftRankForm reads
// .tier and .score from).
function createRankHandler(muscle) {
  const { saves, errorLabel, failureMessage } = MUSCLES[muscle];

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

      if (!saves) {
        return res.json(rankLifts(muscle, checked.lifts));
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (user[saves.cooldownField]) {
        const hoursSince =
          (Date.now() - new Date(user[saves.cooldownField]).getTime()) / MS_PER_HOUR;

        if (hoursSince < RANK_COOLDOWN_HOURS) {
          return res.status(403).json({ error: saves.lockedMessage });
        }
      }

      const result = rankLifts(muscle, checked.lifts);
      const tierEnum = result.tier.toUpperCase();

      // result.score is already the whole number the engine classified the tier
      // from, so the column and the tier can never disagree.
      const saved = await prisma.muscleRank.upsert({
        where: {
          userId_muscle: { userId, muscle: saves.muscleEnum },
        },
        update: {
          tier: tierEnum,
          score: result.score,
        },
        create: {
          userId,
          muscle: saves.muscleEnum,
          tier: tierEnum,
          score: result.score,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { [saves.cooldownField]: new Date() },
      });

      res.json(saved);
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
