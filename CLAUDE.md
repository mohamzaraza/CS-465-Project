\# LiftLogic: CS 499 Enhancement Two (algorithms and data structures)



Full-stack fitness app. client/ is React 19 + Vite + Tailwind. server/ is Express 5 + Prisma + PostgreSQL. Both use ES modules. There is NO package.json at the repo root: run every command inside client/ or server/.



\## Commands

\- client: npm install, npm run dev (http://localhost:5173/), npm run lint, npm run build, npm test (added in Prompt 1)

\- server: npm install, npm run dev, npm test (vitest + supertest, no database needed)



\## Rules

\- Work on the git branch enhancement-2 in small commits. Before each commit run lint, tests and build for what you touched and show me the real output.

\- Never read, print or edit any .env file. Use .env.example files instead. Do not start the real server or connect to a database; none is available. Tests must not need a database or the network.

\- Do not change behavior or visual design beyond what the prompt asks. Keep every existing URL working. Preserve existing line endings and do not reformat unrelated code.

\- Never invent content (exercises, videos, cues, fitness advice, data). If content is missing, build an empty state and tell me.

\- Keep the base logic in client/vite.config.js (dev "/", build "/CS-465-Project/") and the Router basename in client/src/App.jsx exactly as they are.

\- Write comments that explain why, not what. Plain JavaScript only (no TypeScript). Add only the dependencies a prompt names.

\- If a prompt conflicts with the code, or something is ambiguous, stop and ask me instead of guessing.

\- Never use sed -i or any tool that rewrites line endings. After editing, check that git diff --stat shows only the lines you meant to change.



\## Out of scope (planned for Enhancement 3: do NOT fix or edit)

\- prisma/\*, the database schema, migrations, and the leaderboard returning user emails.

\- Moving the exercise catalog (client/src/data/exercises.js) into the database.



\## In scope now (Enhancement 2: algorithms and data structures)

\- server/src/ranking/\*, controllers/rankingController.js and the ranking route wiring, plus tests for them. This includes the missing computeBackTier import, the circular import between the anchor and ranking files, and the import-time console.log calls.

\- Client changes stay minimal and only follow an API contract change.

