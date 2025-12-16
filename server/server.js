import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import aiRoutes from "./routes/aiRoutes.js";

import path from "path";
import { fileURLToPath } from "url";

import rankingRoutes from "./routes/rankingRoutes.js";

import authRoutes from "./routes/authRoutes.js";

import leaderboardRoutes from "./routes/leaderboardRoutes.js";

// Required for dotenv to load correctly in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env explicitly from the server folder
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API ROUTES
app.use("/api", aiRoutes);
app.use("/api/rank", rankingRoutes);

//AUTHENTICATION
app.use("/api/auth", authRoutes);

//LEADERBOARD
app.use("/api/leaderboard", leaderboardRoutes);

// Default test route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



