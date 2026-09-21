import express from "express";
import { register, login } from "../controllers/authController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { getMe } from "../controllers/authController.js";
import { asyncHandler } from "../utils/errorHandler.js";

const router = express.Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));

router.get("/me", authenticateToken, asyncHandler(getMe));

export default router;
