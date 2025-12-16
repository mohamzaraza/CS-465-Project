import express from "express";
import { rankChest,rankBack, getMyChestRank } from "../controllers/rankingController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// middleware: ("/chest", requireAuth, rankChest)
router.post("/chest", authenticateToken, rankChest);
//GET CURRENT USER CHEST RANK
router.get("/chest/me", authenticateToken, getMyChestRank);

// POST /api/rank/back
router.post("/back", authenticateToken, rankBack);

export default router;
