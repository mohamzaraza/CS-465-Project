# Testing

LiftLogic has automated tests for the client and the server, plus a short manual checklist for the flows that changed in Enhancement 1. None of the automated tests need a database, an OpenAI key or a network connection.

## API endpoints

All endpoints live under `/api` on the server (`http://localhost:5000` by default). Bodies are JSON. "Login required" means the request needs an `Authorization: Bearer <token>` header with the token returned by `/api/auth/login`.

| Method | Path | Login required | Body | Success response | Common errors |
|---|---|---|---|---|---|
| POST | `/api/auth/register` | No | `{ "email", "password" }` | `201 { "message": "User created" }` | `400` invalid email, or password shorter than 8 characters or longer than 72 bytes; `409` email already in use |
| POST | `/api/auth/login` | No | `{ "email", "password" }` | `200 { "user": { "id", "email" }, "token" }` | `400` missing fields; `401` invalid credentials |
| GET | `/api/auth/me` | Yes | none | `200 { "id", "email", "createdAt" }` | `401` missing, invalid or expired token |
| POST | `/api/rank/chest` | Yes | `{ "lifts": { "bench": {weight, reps}, "incline_db": {...}, "cable": {...} } }` | `200` the saved rank (`tier`, `score`, ...) | `400` missing lifts; `403` still on the 12-hour cooldown |
| GET | `/api/rank/chest/me` | Yes | none | `200 { "muscle", "tier", "score" }`, or `null` if never ranked | `401` |
| POST | `/api/rank/back` | Yes | `{ "lifts": {...} }` | **Known broken**: returns `500` (see `ENHANCEMENT_1_CHANGELOG.md`; left for Enhancement 2) | |
| GET | `/api/leaderboard/chest` | No | none | `200` array of `{ "rank", "user", "tier", "score" }`, top 20 | |
| POST | `/api/kevai` | Yes | `{ "message" }` (1 to 1000 characters) | `200 { "reply" }` | `400` empty or too long; `401` not logged in; `429` more than 30 messages in 15 minutes; `500` model call failed |

Any other path answers `404 { "error": "Not found" }`. Malformed JSON answers `400`. Requests from an origin that is not in `CLIENT_ORIGIN` are rejected with `403`.

## Automated tests

Requires Node 22.12 or newer. Run each suite in its own folder:

```powershell
cd client
npm test            # run once
npm run test:watch  # re-run on file changes

cd ..\server
npm test
```

The client suite runs Vitest with jsdom and Testing Library. The server suite runs Vitest with Supertest against the Express app built by `app.js`, without opening a port. In the server tests, the Prisma client, the OpenAI service and the chest ranking module are replaced with mocks, and a throwaway `JWT_SECRET` is set in `server/vitest.config.js`, so `server/.env` is never read.

### What the client tests cover (`client/src/**/*.test.{js,jsx}`)

| File | Covers |
|---|---|
| `lib/api.test.js` | The shared API client: URL building, JSON bodies, token header, error messages from JSON and HTML bodies, 401 handling with and without a token, non-JSON success bodies, network errors, default and per-call timeouts |
| `utils/storage.test.js` | localStorage wrapper: JSON round-trip, invalid JSON, blocked storage |
| `utils/calculatorUtils.test.js` | Calorie math: BMR, maintenance, targets, unit conversion, goals, adjustment limits, invalid input, age limits |
| `utils/dietingUtils.test.js` | Build a Plate totals and feedback |
| `pages/Calculator.test.jsx` | Calculator page: placeholder, live results, out-of-range age |
| `components/dieting/BuildPlateSection.test.jsx` | Plate limits (5 portions per food, 15 items in total) |
| `data/muscleGroups.test.js` | Region and muscle data: existing URL slugs kept, unique slugs, required fields, one exercise list per muscle, lookups |
| `pages/workouts/MusclePage.test.jsx` | Chest shows chest exercises; other muscles show the "coming soon" state; unknown or mismatched region and muscle render NotFound |
| `components/workouts/ExerciseCard.test.jsx` | Card renders with only a name, and with video, cues and mistakes |
| `components/colosseum/LiftRankForm.test.jsx` | Fields for each lift, validation, posted numbers, tier result, cooldown message |
| `config/colosseumTiers.test.js` | Every tier the server can return (including Recruit) has a style |
| `pages/colosseum/ColosseumPage.test.jsx` | Leaderboard rows, error message and Retry |
| `components/colosseum/ColosseumGate.test.jsx` | Cinematic on first visit, skipped afterwards, skip remembered |
| `components/kevai/KevAiChat.test.jsx` | A failed request shows its error in the chat |

### What the server tests cover (`server/tests/*.test.js`)

| File | Covers |
|---|---|
| `app.test.js` | KevAi needs a token, returns a reply, and rate-limits per user; CORS allows the configured origin and requests without an Origin header, and rejects others; registration validation runs before the database is touched; database errors reach the central error handler; JSON 404 and malformed-JSON 400 |
| `authMiddleware.test.js` | Valid token, missing header, wrong secret, expired token |
| `env.test.js` | Missing and blank required variables, defaults, OpenAI key warning, `CLIENT_ORIGIN` list, `PORT` parsing |
| `errorHandler.test.js` | Status and message handling in and outside production, no stack traces sent, JSON parse errors, `notFound`, `asyncHandler` |
| `validateInputs.test.js` | Registration email and password rules (8 characters minimum, 72 bytes maximum), loose login check, chat message length |

Not covered automatically: the real database, the real OpenAI API, and the ranking algorithm (`server/src/ranking/`, planned for Enhancement 2).

## Manual smoke test

Run the server and the client as described in `README.md`, then open http://localhost:5173/.

### Workout pages
- [ ] `/workouts` links to Upper Body, Lower Body and Core.
- [ ] `/workouts/upper/chest` shows the chest exercises, with videos that play.
- [ ] The difficulty nav scrolls to the Newcomer, Warrior, Elite and LogicCrafted sections. LogicCrafted is currently empty for chest (a known content gap).
- [ ] Any other muscle (for example `/workouts/upper/back`, `/workouts/lower/quads`) shows "Exercises for this muscle are coming soon", not chest data.
- [ ] The back button on a muscle page returns to its region.
- [ ] `/workouts/upper/nope` and `/workouts/nope` show the Not Found page.

### Calculator
- [ ] Results stay hidden until age, weight and height are entered, then update live.
- [ ] Switching units (lb/kg, ft-in/cm) and goals (cut, maintain, bulk) updates the numbers.
- [ ] An age outside 15 to 80 shows the age message instead of results.

### Build a Plate (Dieting page)
- [ ] Adding foods updates the calorie total and the feedback.
- [ ] One food stops at 5 portions, and the plate stops at 15 items.

### Register and login
- [ ] Registering with an invalid email, or a password under 8 characters, shows the server's message.
- [ ] Registering the same email twice shows "Email already in use".
- [ ] A wrong password on login shows "Invalid credentials" and stays on the login page.
- [ ] A successful login reaches the protected pages (`/colosseum`, `/kevai`). Logged out, those pages redirect to `/login`.

### Colosseum rank and leaderboard
- [ ] The leaderboard loads. With the server stopped, it shows an error and a Retry button (not "No rankings yet"), and Retry recovers once the server is back.
- [ ] Every tier, including Recruit, shows its own name and style, never "Unknown".
- [ ] The Chest Trial form refuses empty fields, zero or negative weight, and fractional reps before sending anything.
- [ ] A valid submission shows the new tier and score. A second attempt within 12 hours shows the cooldown message.
- [ ] `/rank/chest` uses the same form.

### KevAi
- [ ] When logged in, a question gets an answer.
- [ ] A message over 1000 characters, or too many messages in 15 minutes, shows a readable error in the chat.
- [ ] With the server stopped, the chat shows a connection error instead of hanging.
