# Home Dashboard

## Project Overview
Personal household dashboard for Matt and Julia with three active modules:
Finance (income/expense tracking with charts and AI insights), Tasks (household
task manager), and Meals (AI-powered meal planner with grocery list generator).

Runs on a dedicated home network machine, accessed via browser at
`http://[HOST_IP]:[PORT]` from any device on the LAN.

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, React Router
- **Backend:** Node.js, Express, SQLite (better-sqlite3), Drizzle ORM
- **AI:** Modular provider — Anthropic Claude or local Ollama (swap via env var)
- **Process Manager:** PM2 for persistent server

## Folder Structure
- `client/` — React frontend (Vite)
- `server/` — Express API server
- `server/src/db/` — Drizzle schema, seed data, DB connection
- `server/src/ai/` — AI provider abstraction layer
- `server/src/routes/` — Express route handlers
- Root `package.json` — npm workspaces config

## Local Network Access
- `HOST_IP` in `.env` controls the server address (user's local IP)
- `VITE_HOST_IP` in `client/.env` mirrors it for the frontend
- Both Vite and Express bind to `0.0.0.0` so they're network-accessible
- CORS allows all private subnet origins (192.168.x, 10.x, 172.16-31.x)
- Frontend reads API base URL from `client/src/lib/api.js` — no hardcoded URLs

## AI Provider
- `AI_PROVIDER` env var controls which model the app uses ("anthropic" or "ollama")
- All AI calls go through `server/src/ai/provider.js` — never call providers directly

## Git Rules
- Feature branches always — never commit directly to main
- Commit after each working unit
- Conventional commits: feat/ fix/ chore/ docs/
- Push after every commit

## Security
- Never log or expose `.env` values
- No secrets in committed code
- `.env` and `client/.env` are gitignored

## Commands
- `npm run dev` — start both client and server in dev mode
- `npm run dev:client` — start Vite dev server only
- `npm run dev:server` — start Express server only
- `npm run build` — build client for production
- `npm run db:seed` — seed the database
- `npm start` — start server via PM2
- `npm stop` — stop PM2 server
