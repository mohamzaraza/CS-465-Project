\# LiftLogic: CS 499 Enhancement Three (databases)


Full-stack fitness app. client/ is React 19 + Vite + Tailwind. server/ is Express 5 + Prisma + PostgreSQL. Both use ES modules. There is NO package.json at the repo root: run every command inside client/ or server/.



\## Commands

\- client: npm install, npm run dev (http://localhost:5173/), npm run lint, npm run build, npm test (added in Prompt 1)

\- server: npm install, npm run dev, npm test (vitest + supertest; most tests mock Prisma and need no database, but this enhancement adds some that need the test database named in that session)



\## Rules

\- Work on the git branch enhancement-3 in small commits. Before each commit run lint, tests and build for what you touched and show me the real output.

\- Never read, print or edit any .env file. Use .env.example files instead. A real test database may be used, but only the one I name as the test database in that session, configured through its own .env, never server/.env or the app's live database. Never run migrations against any database without my explicit go-ahead in that session.

\- Do not change behavior or visual design beyond what the prompt asks. Keep every existing URL working. Preserve existing line endings and do not reformat unrelated code.

\- Never invent content (exercises, videos, cues, fitness advice, data). If content is missing, build an empty state and tell me.

\- Keep the base logic in client/vite.config.js (dev "/", build "/CS-465-Project/") and the Router basename in client/src/App.jsx exactly as they are.

\- Write comments that explain why, not what. Plain JavaScript only (no TypeScript). Add only the dependencies a prompt names.

\- If a prompt conflicts with the code, or something is ambiguous, stop and ask me instead of guessing.

\- Never use sed -i or any tool that rewrites line endings. After editing, check that git diff --stat shows only the lines you meant to change.



\## In scope now (Enhancement 3: databases)

\- server/prisma/\* (schema, migrations, seed data).

\- server/controllers/leaderboardController.js, authController.js and rankingController.js, but ONLY for database-related changes (queries, fields returned, indexes). Do not touch ranking math or validation logic from Enhancement 2.

\- Moving the exercise catalog (client/src/data/exercises.js, client/src/data/muscleGroups.js) into the database, plus a new server endpoint and client fetch to read it.

\- Client changes stay minimal and only follow a database or API contract change (e.g. the exercise page now fetches instead of importing a static file).



\## Out of scope (do NOT edit)

\- server/src/ranking/\* (the scoring formulas, tier logic, validation and leaderboard ranking/heap code). Enhancement 2 finished this; only the queries that READ from or WRITE to the database around it are in scope here.

