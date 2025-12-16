import express from "express";
import { getChestLeaderboard } from "../controllers/leaderboardController.js";

const router = express.Router();

router.get("/chest", getChestLeaderboard);

export default router;
