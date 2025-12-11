import express from "express";
import { rankChest,rankBack } from "../controllers/rankingController.js";

const router = express.Router();

// once auth exists, add middleware like: router.post("/chest", requireAuth, rankChest)
router.post("/chest", rankChest);
// POST /api/rank/back
router.post("/back", rankBack);
export default router;
