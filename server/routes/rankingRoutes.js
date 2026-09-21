import express from "express";
import { rankChest,rankBack, getMyChestRank } from "../controllers/rankingController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/errorHandler.js";

const router = express.Router();

// middleware: ("/chest", requireAuth, rankChest)
router.post("/chest", authenticateToken, asyncHandler(rankChest));
//GET CURRENT USER CHEST RANK
router.get("/chest/me", authenticateToken, asyncHandler(getMyChestRank));

// POST /api/rank/back
router.post("/back", authenticateToken, asyncHandler(rankBack));

export default router;
