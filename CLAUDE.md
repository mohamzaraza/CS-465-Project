\# LiftLogic: CS 499 Enhancement One (software design and engineering)



Full-stack fitness app. client/ is React 19 + Vite + Tailwind. server/ is Express 5 + Prisma + PostgreSQL. Both use ES modules. There is NO package.json at the repo root: run every command inside client/ or server/.



\## Commands

\- client: npm install, npm run dev (http://localhost:5173/), npm run lint, npm run build, npm test (added in Prompt 1)

\- server: npm install, npm run dev, npm test (added in Prompt 5)



\## Rules

\- Work on the git branch enhancement-1 in small commits. Before each commit run lint, tests and build for what you touched and show me the real output.

\- Never read, print or edit any .env file. Use .env.example files instead. Do not start the real server or connect to a database; none is available. Tests must not need a database or the network.

\- Do not change behavior or visual design beyond what the prompt asks. Keep every existing URL working. Preserve existing line endings and do not reformat unrelated code.

\- Never invent content (exercises, videos, cues, fitness advice, data). If content is missing, build an empty state and tell me.

\- Keep the base logic in client/vite.config.js (dev "/", build "/CS-465-Project/") and the Router basename in client/src/App.jsx exactly as they are.

\- Write comments that explain why, not what. Plain JavaScript only (no TypeScript). Add only the dependencies a prompt names.

\- If a prompt conflicts with the code, or something is ambiguous, stop and ask me instead of guessing.



\## Out of scope (planned for later enhancements: do NOT fix or edit)

\- server/src/ranking/\* and the ranking algorithm, including the missing computeBackTier import in controllers/rankingController.js (Enhancement 2). The only change allowed there is replacing the magic numbers 36e5 and 12 with named constants, when a prompt says so.

\- prisma/\*, the database schema, migrations, and the leaderboard returning user emails (Enhancement 3).

\- The console.log calls that run at import time in the tier anchor files (they appear in my code review video).

