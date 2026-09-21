# Enhancement 1 Change Log: Software Design and Engineering

Branch: `enhancement-1`. Baseline: tag `baseline-before-enhancement-1` (`be67b8a`).

Commits:

| Commit | Summary |
|---|---|
| `493222b` | Add test tooling, remove dead code and debug handlers, fix lint |
| `ebfa7dc` | Central config, asset imports, and a single API client |
| `bb595ec` | One data-driven muscle page replaces 13 copies |
| `100aed5` | Shared LiftRankForm and leaderboard fixes |
| `bb8f693` | Server hardening, validation, central error handling, tests |
| *this commit* | Documentation and change log |

## 1. Problems from the code review and what changed

| # | Problem found | What changed | Main files | How it was verified |
|---|---|---|---|---|
| 1 | 12 of the 13 muscle pages were copies, and every muscle page showed chest data | 13 muscle pages and 3 region pages replaced by one `MusclePage` and one `RegionPage`, both driven by a single data file. Exercises are keyed by muscle. Muscles without content show a "coming soon" state instead of chest exercises. Unknown URLs show Not Found. Every existing URL is kept. | `client/src/data/muscleGroups.js`, `client/src/data/exercises.js`, `client/src/pages/workouts/MusclePage.jsx`, `client/src/pages/workouts/RegionPage.jsx`, `client/src/App.jsx` | `MusclePage.test.jsx`, `muscleGroups.test.js` (including "keeps today's URL slugs"), `ExerciseCard.test.jsx`, manual check of each region and muscle |
| 2 | The rank form was duplicated | One `LiftRankForm`, configured by `liftConfigs.js`, used by both the Colosseum panel and `/rank/chest`. Client-side validation added, with the server's cooldown message shown. | `client/src/components/colosseum/LiftRankForm.jsx`, `client/src/components/colosseum/RankChestPanel.jsx`, `client/src/pages/RankChest.jsx`, `client/src/config/liftConfigs.js` | `LiftRankForm.test.jsx` |
| 3 | Empty stub files, unused components and debug code | 6 zero-byte server files deleted. The 2 empty stubs that were meant to hold code (`errorHandler.js`, `validateInputs.js`) are now implemented. 19 client files (outside the workout pages) deleted because they were unused or replaced. Examples: `components/ui/*`, the old KevAi chat pieces, `services/api.js`, `pages/MealPlan.jsx`, `pages/Workouts.jsx` and `config/openai.js`, plus `chestExercises.js`, which was merged into `exercises.js`. The Colosseum Gate's debug reset key handler and debug `console.log` calls removed. | see commits `493222b`, `bb595ec`, `100aed5` | Zero-byte and `console.log` counts in section 2, lint and build passing, `ColosseumGate.test.jsx` |
| 4 | Hard-coded `localhost:5000` | The server address comes from `VITE_API_URL` through `client/src/config/env.js`. The `localhost:5000` fallback applies to `npm run dev` only. | `client/src/config/env.js`, `client/.env.example`, `client/src/lib/api.js` | Count in section 2, `api.test.js` ("builds the URL from API_URL") |
| 5 | Raw `/src/assets` paths | Images used in JSX (`src=`) are now imported, so Vite fingerprints them and applies the GitHub Pages base path. Exercise videos use `import.meta.env.BASE_URL`. | `Navbar.jsx`, `About.jsx`, `Welcome.jsx`, `PillarSection.jsx`, `FoodCategoriesSection.jsx`, `RankChestPanel.jsx`, `dietingUtils.js`, `data/exercises.js` and others | Count in section 2. `npm run build`: the remaining Tailwind `bg-[url('/src/assets/...')]` classes come out in the built CSS as `url(/CS-465-Project/assets/<name>-<hash>.jpg)`, so they already work once deployed. |
| 6 | No response status check before parsing, and no timeouts | One `apiRequest()` checks `res.ok` before parsing, handles HTML and empty bodies, applies a 10 s timeout with `AbortController` (30 s for KevAi), and turns every failure into an `ApiError` with a readable message. A 401 on a logged-in request logs the user out and sends them to `/login`. | `client/src/lib/api.js`, `client/src/lib/kevaiClient.js`, `client/src/context/AuthContext.jsx`, `client/src/context/AuthNavigator.jsx` | `api.test.js` (14 tests, including timeouts, HTML bodies and 401 handling) |
| 7 | Token logging | The auth middleware no longer logs the `Authorization` header or the JWT secret's length. The Prisma client dump in the auth controller was removed. The middleware now requires a well-formed `Bearer` header. | `server/middleware/authMiddleware.js`, `server/controllers/authController.js` | `authMiddleware.test.js`, `console.log` count in section 2 |
| 8 | An open, unlimited KevAi route | `POST /api/kevai` requires login, is rate-limited per user (30 messages per 15 minutes), and rejects messages that are empty or over 1000 characters. CORS is limited to `CLIENT_ORIGIN`. The chat shows friendly 401 and 429 messages. | `server/routes/aiRoutes.js`, `server/app.js`, `server/config/constants.js`, `client/src/components/kevai/KevAiChat.jsx` | `app.test.js` (401 without a token, 429 per user, CORS), `KevAiChat.test.jsx` |
| 9 | No input validation | Registration checks email format and password length (8 characters to 72 bytes). Login checks presence only. KevAi checks message length. Chest ranking inputs are checked in the form. Failures return 400 with a message the client displays. | `server/utils/validateInputs.js`, `server/controllers/authController.js`, `server/controllers/aiController.js` | `validateInputs.test.js`, `app.test.js` (400 before the database is touched) |
| 10 | 14 lint errors | All fixed. The auth context was split so Fast Refresh rules pass (`authContextObject.js`, `useAuth.js`), and unused variables and imports were removed. | see commit `493222b` | `npm run lint` in `client/`: 0 problems (section 2) |
| 11 | README and TESTING.md out of date | README rewritten (setup, environment, scripts, structure, deployment, troubleshooting). TESTING.md rewritten to match the real endpoints and tests. DESIGN.md section 3 corrected. "Why" header comments added to the new modules. | `README.md`, `TESTING.md`, `DESIGN.md` | Every command in the docs checked against `client/package.json` and `server/package.json` |
| 12 | No tests | Vitest in both packages: jsdom and Testing Library for the client, Supertest for the server. Nothing needs a database or the network. | `client/vitest.config.js`, `client/src/test/setup.js`, `server/vitest.config.js`, `server/app.js` (app split from `server.js` so it can be tested) | 19 test files and 157 tests passing (section 2) |

### Extra bugs found while working

| Bug | Fix | Files | Verified by |
|---|---|---|---|
| The leaderboard showed **Recruit** as **Unknown**: the server's `RECRUIT` tier had no client style | Recruit tier style added | `client/src/config/colosseumTiers.js`, `client/src/components/colosseum/LeaderboardRow.jsx` | `colosseumTiers.test.js` checks a style exists for every tier in the Prisma enum |
| Leaderboard errors were swallowed: a failed request looked exactly like "No rankings yet" | Error message and a Retry button shown | `client/src/pages/colosseum/ColosseumPage.jsx` | `ColosseumPage.test.jsx` |
| KevAi errors were swallowed: every failure showed the same generic line | The chat shows the real reason (timeout, network, 401, 429, server message) as a styled alert | `client/src/components/kevai/KevAiChat.jsx` | `KevAiChat.test.jsx` |
| The server started without required settings and failed later per request | Environment validated at startup, with a clear exit message naming each missing variable | `server/config/env.js`, `server/server.js` | `env.test.js` |

## 2. Before and after, measured

`B` = `baseline-before-enhancement-1`, `H` = `HEAD` at `bb8f693` (before this documentation commit). Markdown files and `package-lock.json` are excluded from the grep counts.

| Measure | Command | Before | After |
|---|---|---|---|
| `localhost:5000` occurrences | `git grep -c "localhost:5000" <ref> -- . ':!*.md'` | 5 | 2 (`client/.env.example` and the dev-only fallback in `client/src/config/env.js`) |
| Raw `/src/assets` string paths | `git grep -nE "[\"'\`(]/src/assets" <ref> -- . ':!*.md'` | 36 | 16. 15 are Tailwind `bg-[url(...)]` classes or `tailwind.config.js` entries, which Vite rewrites to fingerprinted files at build time, and 1 is a comment in `vite.config.js`. There are 0 in `src=` attributes or JS string imports. |
| `console.log` calls | `git grep -n "console\.log" <ref> -- . ':!*.md' ':!*package-lock.json'` | 12 | 3 (the server's startup message and the 2 import-time logs in the tier anchor files, kept on purpose) |
| Zero-byte files under `server/` | `git ls-tree -r -l <ref> -- server \| awk '$4==0'` | 8 | 0 |
| Muscle and region page files | `git ls-tree -r --name-only <ref> -- client/src/pages/workouts` | 13 muscle and 3 region pages | 1 `MusclePage.jsx` and 1 `RegionPage.jsx` |
| Test files | `git ls-tree -r --name-only <ref> \| grep -E "\.test\.(js\|jsx)$"` | 0 | 19 (14 client, 5 server) |
| Tests | `npm test` in `client/` and `server/` | 0 | 157 passing (95 client, 62 server) |
| Client lint errors | `npm run lint` in `client/` | 14 (measured in the code review) | 0 |
| Size of the change | `git diff --shortstat B H` | | 125 files changed, 5359 insertions(+), 1864 deletions(-). Most of the insertions are the two `package-lock.json` files (2,532 lines) and the new tests. |

## 3. Design decisions and trade-offs

- **Exercise catalog as a JS/JSON module now, database later.** `data/exercises.js` and `data/muscleGroups.js` removed the duplication without touching the schema, which Enhancement 3 owns. The catalog keeps the same muscle slugs, so moving it into PostgreSQL later changes only where the data comes from.
- **Empty states instead of borrowed content.** Only chest has real exercises. The other 12 muscles show "coming soon" rather than placeholder or chest data, so the app never presents fitness content we did not write.
- **KevAi requires login.** Every message costs money at OpenAI. Login lets the rate limit be keyed per account instead of per IP, so users on a shared campus network do not exhaust each other's quota. The trade-off is that anonymous visitors can no longer try KevAi.
- **Password rules only at registration.** Login checks presence only, so accounts created before the length rules still work.
- **Passwords are limited in bytes, not characters.** bcrypt ignores everything past 72 bytes.
- **`asyncHandler` kept even though Express 5 catches rejected promises.** It makes the error path explicit at every route and would keep working if the code ever ran on Express 4. The cost is one wrapper per route.
- **The ranking module is mocked in server tests.** `chestRanking.js` and `chestTierAnchors.js` import each other. Node resolves that cycle, but Vitest's module transform turns it into a temporal-dead-zone error. The ranking algorithm is out of scope here, so `app.test.js` mocks it instead of editing it.
- **`app.js` split from `server.js`.** Tests build the app with Supertest without opening a port or reading `.env`.
- **The environment is validated at startup** so a misconfigured server fails at launch with a clear message instead of failing later on a request.
- **No `localhost` fallback in production builds.** A deployed site pointing at the visitor's own machine would fail confusingly. A build without `VITE_API_URL` says so on the first API call, and pages that never call the API still render.
- **One API client instead of per-page `fetch`.** Status checks, timeouts, auth headers and error wording live in one tested place. Adopting it meant touching every caller in one commit.

## 4. Intentionally left for Enhancements 2 and 3

| Item | Planned for | Notes |
|---|---|---|
| Ranking algorithm (`server/src/ranking/*`) | Enhancement 2 | Only the cooldown magic numbers (`36e5`, `12`) became named constants (`MS_PER_HOUR`, `RANK_COOLDOWN_HOURS`). |
| Circular import between `chestRanking.js` and `chestTierAnchors.js` (same pattern in the back files) | Enhancement 2 | Worked around in tests with a mock. |
| `POST /api/rank/back` is broken | Enhancement 2 | `rankingController.js` calls `computeBackTier` without importing it, so every request returns 500. |
| Import-time `console.log` calls in the tier anchor files | Enhancement 2 | Kept because they appear in the code review video. |
| Database schema and migrations (`server/prisma/*`) | Enhancement 3 | Unchanged. |
| The leaderboard returns user emails | Enhancement 3 | `GET /api/leaderboard/chest` still sends `user.email` to every visitor. |

## 5. Known issues for me to decide on

- **`bg-hero-greek` is undefined.** `client/src/pages/Welcome.jsx` uses the class, but `tailwind.config.js` defines no `hero-greek` background, so the Welcome page has no background image. This existed before Enhancement 1.
- **npm audit.** `npm audit` today reports **17 vulnerabilities in `client/`** (2 low, 3 moderate, 12 high) and **5 in `server/`** (1 low, 4 high). Nothing was upgraded, because the rules allow only the dependencies a prompt names.
- **12 muscles have no exercises.** Shoulders, back, biceps, triceps, forearm, quads, hamstrings, glutes, calves, abs, obliques and lower back all show the "coming soon" state until real content is added.
- **Chest has an empty tier.** Chest has Newcomer, Warrior and Elite exercises but none for LogicCrafted, so that section is empty.
- **"QUADS" versus "QUADRICEPS".** The Lower Body page links "QUADS" while the muscle page is titled "QUADRICEPS". Both were kept as they were.
- **Deployment needs two settings.** A GitHub Pages build must be made with `VITE_API_URL` set, and the hosted server must list the Pages origin in `CLIENT_ORIGIN`. Otherwise the deployed site cannot reach the API.

## 6. How this was made

The changes in this enhancement were implemented by Claude Code (Anthropic) from prompts I wrote. I reviewed each commit before accepting it.
