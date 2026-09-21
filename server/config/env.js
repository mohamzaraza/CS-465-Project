// Checks the environment once at startup, so a missing secret stops the server
// with a message naming it instead of surfacing as a failed request later.
const REQUIRED = ["DATABASE_URL", "JWT_SECRET"];

const DEFAULT_PORT = 5000;
const DEFAULT_CLIENT_ORIGIN = "http://localhost:5173";

function isBlank(value) {
  return value === undefined || String(value).trim() === "";
}

// Pure so it can be tested with plain objects; loadEnv() is the only caller
// that touches process.env and the console.
export function validateEnv(env) {
  const missing = REQUIRED.filter((name) => isBlank(env[name]));
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        "Copy server/.env.example to server/.env and fill them in."
    );
  }

  const warnings = [];
  if (isBlank(env.OPENAI_API_KEY)) {
    warnings.push("OPENAI_API_KEY is not set: KevAi requests will fail until it is.");
  }

  const port = isBlank(env.PORT) ? DEFAULT_PORT : Number(env.PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORT must be a positive whole number, got "${env.PORT}".`);
  }

  // A comma-separated list lets local dev and the deployed site share one server.
  const clientOrigins = (isBlank(env.CLIENT_ORIGIN) ? DEFAULT_CLIENT_ORIGIN : env.CLIENT_ORIGIN)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    config: { port, clientOrigins, nodeEnv: env.NODE_ENV || "development" },
    warnings,
  };
}

export function loadEnv() {
  const { config, warnings } = validateEnv(process.env);
  for (const warning of warnings) {
    console.warn(`Warning: ${warning}`);
  }
  return config;
}
