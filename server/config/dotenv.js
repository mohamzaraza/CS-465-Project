import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Imported first by server.js so the variables exist before any other module
// reads them. The explicit path lets the server start from any working
// directory, not only from server/.
const serverDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(serverDir, ".env") });
