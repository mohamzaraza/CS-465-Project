import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import aiRoutes from "./routes/aiRoutes.js";

import path from "path";
import { fileURLToPath } from "url";

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

// Default test route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

console.log("Loaded key (first 5 chars):", process.env.OPENAI_API_KEY?.slice(0, 5));
console.log("ENV KEY:", process.env.OPENAI_API_KEY ? "Loaded" : "MISSING");

