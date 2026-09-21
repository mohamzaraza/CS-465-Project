import express from "express";
import { getChestLeaderboard } from "../controllers/leaderboardController.js";
import { asyncHandler } from "../utils/errorHandler.js";

const router = express.Router();

router.get("/chest", asyncHandler(getChestLeaderboard));

export default router;
