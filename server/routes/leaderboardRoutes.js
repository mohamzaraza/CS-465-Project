import express from "express";
import { getChestLeaderboard, getTotalLeaderboard } from "../controllers/leaderboardController.js";
import { asyncHandler } from "../utils/errorHandler.js";

const router = express.Router();

router.get("/chest", asyncHandler(getChestLeaderboard));
router.get("/total", asyncHandler(getTotalLeaderboard));

export default router;
