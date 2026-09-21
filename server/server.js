// Must stay the first import: later modules may read process.env as they load.
import "./config/dotenv.js";

import { loadEnv } from "./config/env.js";
import { createApp } from "./app.js";

let config;
try {
  config = loadEnv();
} catch (err) {
  // Fail fast: starting without a database URL or JWT secret would only
  // surface later as confusing per-request errors.
  console.error(err.message);
  process.exit(1);
}

const app = createApp(config);

// Start server
app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
