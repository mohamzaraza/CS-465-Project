import express from "express";
import { handleKevAi } from "../controllers/aiController.js";

const router = express.Router();

router.post("/kevai", handleKevAi);

export default router;
