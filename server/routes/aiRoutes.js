import express from "express";
import { rateLimit } from "express-rate-limit";
import { handleKevAi } from "../controllers/aiController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { KEVAI_RATE_LIMIT_MAX, KEVAI_RATE_LIMIT_WINDOW_MS } from "../config/constants.js";

// A factory rather than a module-level router so every app gets its own
// limiter counter (tests build several apps in one process).
export function createAiRoutes() {
  const router = express.Router();

  // Keyed by account, not IP: users behind one shared IP (a campus network)
  // should not exhaust each other's quota, and one user cannot dodge it by
  // switching networks.
  const kevaiLimiter = rateLimit({
    windowMs: KEVAI_RATE_LIMIT_WINDOW_MS,
    limit: KEVAI_RATE_LIMIT_MAX,
    keyGenerator: (req) => String(req.user.id),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: "Too many KevAi messages. Please wait a few minutes and try again.",
      });
    },
  });

  // Auth runs first so the limiter always has a user id to key on.
  router.post("/kevai", authenticateToken, kevaiLimiter, asyncHandler(handleKevAi));

  return router;
}
