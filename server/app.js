import express from "express";
import cors from "cors";

import { createAiRoutes } from "./routes/aiRoutes.js";
import rankingRoutes from "./routes/rankingRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import exerciseRoutes from "./routes/exerciseRoutes.js";
import { errorHandler, httpError, notFound } from "./utils/errorHandler.js";

// Kept separate from server.js so tests can drive the app with supertest
// without opening a port or loading a real .env.
export function createApp({ clientOrigins }) {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header means a non-browser client (curl, server-to-server,
        // same-origin navigation); CORS only protects browsers anyway.
        if (!origin || clientOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(httpError(403, "Origin not allowed"));
      },
    })
  );
  app.use(express.json());

  // API ROUTES
  app.use("/api", createAiRoutes());
  app.use("/api/rank", rankingRoutes);

  //AUTHENTICATION
  app.use("/api/auth", authRoutes);

  //LEADERBOARD
  app.use("/api/leaderboard", leaderboardRoutes);

  //EXERCISE CATALOG
  app.use("/api/exercises", exerciseRoutes);

  // Default test route
  app.get("/", (req, res) => {
    res.send("Backend is running!");
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
