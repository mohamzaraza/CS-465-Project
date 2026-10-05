import express from "express";
import { getExercises } from "../controllers/exerciseController.js";
import { asyncHandler } from "../utils/errorHandler.js";

const router = express.Router();

// Public, like the exercise pages that read it: no auth middleware.
router.get("/", asyncHandler(getExercises));

export default router;
