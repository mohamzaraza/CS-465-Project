# LiftLogic

LiftLogic is a full-stack fitness web app. It has:

- workout pages organized by body region and muscle, with exercise videos, cues and common mistakes
- a calorie and macro calculator
- a "Build a Plate" nutrition tool
- KevAi, an AI fitness assistant for logged-in users
- the Colosseum, where logged-in users rank their chest strength and appear on a leaderboard

Team members:

- emi343rc / Emiliano Chabolla Mosqueda
- mohamzaraza / Muhammad Hamza

## Tech stack

| Part | Technology |
|---|---|
| Client | React 19, React Router 7, Vite 7, Tailwind CSS 3, react-markdown |
| Server | Node.js, Express 5, Prisma 6, bcrypt, jsonwebtoken, express-rate-limit, OpenAI SDK |
| Database | PostgreSQL (through Prisma) |
| Tests | Vitest, Testing Library and jsdom (client), Supertest (server) |
| Hosting | GitHub Pages for the client (`gh-pages`) |

Both `client/` and `server/` use ES modules and plain JavaScript.

## How the pieces connect

```
 Browser
   |
   |  http://localhost:5173/  (dev)  or  https://<user>.github.io/CS-465-Project/  (deployed)
   v
+---------------------------+
| client/  React + Vite     |   static files: pages, images, videos
|  src/lib/api.js           |   every API call goes through apiRequest()
+---------------------------+
   |
   |  fetch  ${VITE_API_URL}/api/...   JSON, "Authorization: Bearer <JWT>"
   v
+---------------------------+
| server/  Express 5        |   CORS allows only CLIENT_ORIGIN
|  /api/auth                |   register, login, me
|  /api/rank                |   chest ranking (login required)
|  /api/leaderboard         |   chest leaderboard
|  /api/kevai               |   AI assistant (login required, rate limited) ---> OpenAI API
+---------------------------+
   |
   |  Prisma Client  (DATABASE_URL)
   v
+---------------------------+
| PostgreSQL                |   users, muscle ranks
+---------------------------+
```

## Prerequisites

- **Node.js 22.12 or newer** (npm comes with it). The test runner (Vitest 5) requires `^22.12.0 || ^24.0.0 || >=26.0.0`, and Vite 7 requires `^20.19.0 || >=22.12.0`, so 22.12 is the lowest version that runs everything. Check with `node -v`.
- **A PostgreSQL database.** A local install works, and so does a free hosted one. You only need its connection string.
- **An OpenAI API key** (optional). Without one, the whole app runs except KevAi's answers.
- Git.

## Setup (Windows PowerShell, two terminals)

There is no `package.json` at the repo root. Run every command inside `client/` or `server/`.

### Terminal 1: server

```powershell
cd server
npm install
Copy-Item .env.example .env
# Open server\.env and fill in DATABASE_URL and JWT_SECRET (see the table below)
npx prisma migrate deploy
npm run dev
```

`npx prisma migrate deploy` creates the tables in your database from `server/prisma/migrations/`. When the server is up it prints `Server running on http://localhost:5000`.

### Terminal 2: client

```powershell
cd client
Copy-Item .env.example .env
npm install
npm run dev
```

Open <http://localhost:5173/>.

## Environment variables

Never commit a real `.env`. Both `.env` files are git-ignored, and the committed `.env.example` files are the templates.

### Client (`client/.env`)

| Variable | Example | Required | Notes |
|---|---|---|---|
| `VITE_API_URL` | `http://localhost:5000` | For builds only | The server's address, without `/api`. Vite bakes it in when the build runs. In `npm run dev` it falls back to `http://localhost:5000`. A production build without it shows a clear error the first time a page calls the API. |

### Server (`server/.env`)

| Variable | Example | Required | Notes |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://USER:PASSWORD@localhost:5432/liftlogic` | Yes | PostgreSQL connection string used by Prisma. |
| `JWT_SECRET` | `replace-with-a-long-random-string` | Yes | Signs login tokens. Use a long random value. |
| `OPENAI_API_KEY` | *(your key)* | No | KevAi needs it. Without it the server starts with a warning and KevAi requests fail. |
| `PORT` | `5000` | No | Defaults to `5000`. |
| `CLIENT_ORIGIN` | `http://localhost:5173,https://your-name.github.io` | No | Comma-separated list of sites allowed to call the API (CORS). Defaults to `http://localhost:5173`. |
| `NODE_ENV` | `production` | No | In `production`, 500 errors return a generic message instead of the internal one. |

If `DATABASE_URL` or `JWT_SECRET` is missing, the server prints which ones and exits.

## Scripts

### Client (`cd client`)

| Command | What it does |
|---|---|
| `npm run dev` | Starts the Vite dev server at http://localhost:5173/ |
| `npm run build` | Production build into `client/dist/` (base path `/CS-465-Project/`) |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Runs ESLint over the client |
| `npm test` | Runs the Vitest suite once |
| `npm run test:watch` | Runs Vitest in watch mode |
| `npm run deploy` | Builds, then publishes `dist/` to the `gh-pages` branch |

### Server (`cd server`)

| Command | What it does |
|---|---|
| `npm run dev` | Starts the API with nodemon (restarts on file changes) |
| `npm start` | Starts the API with plain Node |
| `npm test` | Runs the Vitest and Supertest suite once (no database or network needed) |

The server has no lint or build script. It runs directly from source.

## Project structure

```
client/
  public/videos/          exercise demo videos (served as static files)
  src/assets/             images imported by components
  src/components/         UI pieces grouped by feature (calculator, colosseum, dieting, home, kevai, workouts)
  src/config/             env.js (API address), Colosseum tiers and lift definitions
  src/context/            authentication state (AuthContext, useAuth, AuthNavigator)
  src/data/               muscleGroups.js (regions and muscles) and exercises.js (exercise catalog)
  src/layout/             MainLayout (navbar and footer around every page)
  src/lib/                api.js (the single HTTP client) and kevaiClient.js
  src/pages/              one component per route; workouts/ holds the data-driven region and muscle pages
  src/utils/              calculator, dieting and storage helpers
  src/test/               test setup
server/
  server.js               entry point: loads .env, validates it, starts listening
  app.js                  builds the Express app (CORS, routes, error handling)
  config/                 environment validation, dotenv loading, named constants
  controllers/            request handlers for auth, ranking, leaderboard and KevAi
  routes/                 URL-to-handler wiring for each /api area
  middleware/             JWT authentication
  services/               OpenAI client and KevAi's system prompt
  utils/                  central error handler and input validators
  lib/                    shared Prisma client
  prisma/                 database schema and migrations
  src/ranking/            strength-ranking algorithm and tier anchors
  tests/                  server test suite
```

## Deployment

- **Base path.** `client/vite.config.js` serves the app from `/` in development and from `/CS-465-Project/` in production builds, which is the GitHub Pages project path. The router in `client/src/App.jsx` reads the same base, so routes work under that prefix. Do not change one without the other.
- **`VITE_API_URL` at build time.** Vite writes the value into the JavaScript bundle when `npm run build` runs, so it must be set in the environment (or `client/.env`) of the machine that builds. Changing it later means rebuilding. `npm run deploy` runs the build for you and then publishes `dist/` with `gh-pages`.
- **`CLIENT_ORIGIN` on the server.** The deployed server must list the site's origin, for example `https://your-name.github.io` (scheme and host only, no path), or the browser blocks every API call. Keep `http://localhost:5173` in the list if you also develop against that server.
- The server also needs its own host, with `DATABASE_URL`, `JWT_SECRET` and (for KevAi) `OPENAI_API_KEY` set, and `npx prisma migrate deploy` run against the production database.

## Contributing

- Make one branch and one pull request per change.
- Before committing, run `npm run lint` and `npm test` in `client/`, and `npm test` in `server/`. Run `npm run build` in `client/` for anything that affects the build.
- Never commit `.env` files or real secrets.
- See `TESTING.md` for the manual checks.

## Troubleshooting

**`npm start` (or any npm command) fails at the repo root.**
There is no root `package.json`. Run commands inside `client/` or `server/`.

**The server exits saying environment variables are missing.**
`server/.env` is missing or does not set `DATABASE_URL` and `JWT_SECRET`. Run `Copy-Item .env.example .env` inside `server/` and fill them in. The message names every missing variable.

**Images or the logo are missing.**
Make sure you are using the dev server (`npm run dev`) or a fresh build (`npm run build`, then `npm run preview`). Opening files directly, or serving an old `dist/`, gives broken asset paths.

**The client shows "Could not reach the server".**
The server is not running, or `VITE_API_URL` points to the wrong address. Start the server in its own terminal and check the URL. If you changed `client/.env`, restart the dev server or rebuild.

**The browser console shows a CORS error or "Origin not allowed".**
Add the site's origin to `CLIENT_ORIGIN` in `server/.env` and restart the server.

**KevAi always answers with an error.**
Check that `OPENAI_API_KEY` is set in `server/.env` and that you are logged in. KevAi allows 30 messages per user every 15 minutes.

**`npm test` fails immediately with an engine or syntax error.**
Check `node -v`. The tests need Node 22.12 or newer.
