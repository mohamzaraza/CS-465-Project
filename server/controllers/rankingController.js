import { computeChestTier } from "../src/ranking/chestRanking.js";
import { computeBackTier } from "../src/ranking/backRanking.js";


//CHEST
export async function rankChest(req, res) {
  try {
    const userId = req.user?.id; // once auth exists

    const userLifts = req.body.lifts; 
    // { bench: {weight, reps}, incline_db: {..}, cable: {..} }

    const result = computeChestTier(userLifts);
    // { muscle: "chest", tier: "Titan", score: 4382 }

    // TODO: save into DB: user_muscle_rank table

    res.json(result);
  } catch (err) {
    console.error("Chest ranking error:", err);
    res.status(500).json({ error: "Failed to rank chest." });
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