import express from "express";
import { register, login } from "../controllers/authController.js";

import { authenticateToken } from "../middleware/authMiddleware.js";
import { getMe } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", authenticateToken, getMe);

export default router;
