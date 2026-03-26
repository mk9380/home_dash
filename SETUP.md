# Home Dashboard — Setup Instructions

> Revised build plan with issues addressed. This is the single source of truth
> for the project scaffold.

---

## PROJECT OVERVIEW

A personal household dashboard for Matt and Julia with three modules
(Calendar deferred to backlog):

1. **Finance** — income and expense tracking with charts and AI insights
2. **Tasks** — household task manager
3. **Meals** — AI-powered meal planner with grocery list generator

This app runs on a dedicated machine on the home network and is accessed
by any browser on that network via the host machine's local IP address
(e.g. `http://192.168.1.X`). It does not need to be accessible from the internet.

Open access — no authentication required (backlog item for future release).

---

## TECH STACK

**Frontend:**
- React 18 with Vite
- Tailwind CSS for styling
- Recharts for charts and data visualization
- React Router for navigation between modules

**Backend:**
- Node.js with Express
- SQLite database via `better-sqlite3`
- Drizzle ORM for schema definition and queries
- `drizzle-kit` for migrations
- `dotenv` for environment variable management
- `cors` package configured for local network access
- PM2 for keeping the server running persistently without a terminal

**AI Layer (modular):**
- Abstracted behind a provider interface so the model can be swapped
- Supports Anthropic Claude API and local Ollama

---

## FOLDER STRUCTURE

```
home_dash/
├── .github/
│   └── workflows/
│       └── ci.yml
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── Finance.jsx
│   │   │   ├── Tasks.jsx
│   │   │   └── Meals.jsx
│   │   ├── lib/
│   │   │   └── api.js             ← centralized API base URL config
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── postcss.config.js          ← required for Tailwind
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── transactions.js
│   │   │   ├── categories.js
│   │   │   ├── tasks.js
│   │   │   ├── meals.js
│   │   │   └── insights.js
│   │   ├── db/
│   │   │   ├── index.js           ← database connection
│   │   │   ├── schema.js
│   │   │   └── seed.js
│   │   ├── ai/
│   │   │   ├── provider.js        ← AI abstraction layer
│   │   │   ├── anthropic.js       ← Claude implementation
│   │   │   └── ollama.js          ← Ollama implementation (stub)
│   │   └── index.js
│   ├── drizzle.config.js          ← Drizzle Kit migration config
│   └── package.json
├── ecosystem.config.js            ← PM2 config for persistent server
├── BACKLOG.md                     ← feature backlog tracker
├── CLAUDE.md
├── .env.example
├── .gitignore
└── package.json                   ← root workspace config
```

**Changes from original:**
- Removed `Calendar.jsx` page and `calendar.js` route (deferred to backlog)
- Added `postcss.config.js` for Tailwind CSS
- Added `drizzle.config.js` for migration tooling
- Added `server/src/db/index.js` for database connection module
- Added `server/src/routes/insights.js` (separated from finance routes)
- Added `BACKLOG.md` for tracking future features
- Added `client/.env.example` as a separate file
- Repo name is `home_dash` (not `home-dashboard`)

---

## LOCAL NETWORK ACCESS

The app must be reachable at `http://[HOST_IP]:[PORT]` from any device on
the local network. `HOST_IP` is the local IP of the machine running this app.

All of the following must use HOST_IP, not hardcoded localhost:

1. **Vite dev server** — binds to `0.0.0.0`
2. **Express server** — binds to `0.0.0.0`
3. **CORS** — allows requests from any origin on the local subnet
4. **API base URL in frontend** — uses `VITE_HOST_IP`, not localhost

### Server `.env`

```
HOST_IP=192.168.1.100
SERVER_PORT=3001
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=
OLLAMA_MODEL=llama3
OLLAMA_BASE_URL=http://localhost:11434
```

### Client `.env`

```
VITE_HOST_IP=192.168.1.100
VITE_SERVER_PORT=3001
```

### Frontend API base (`client/src/lib/api.js`)

```js
const API_BASE = `http://${import.meta.env.VITE_HOST_IP}:${import.meta.env.VITE_SERVER_PORT}`
export default API_BASE
```

Every fetch call imports and uses `API_BASE`. No hardcoded localhost URLs.

### Vite config

```js
server: {
  host: '0.0.0.0',
  port: 5173
}
```

### Express binding

```js
app.listen(PORT, '0.0.0.0', () => { ... })
```

### CORS config

```js
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    const localPatterns = [
      /^http:\/\/192\.168\./,
      /^http:\/\/10\./,
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[01])\./,
      /^http:\/\/localhost/
    ]
    const allowed = localPatterns.some(p => p.test(origin))
    callback(allowed ? null : new Error('Not allowed by CORS'), allowed)
  },
  credentials: true
}))
```

---

## PM2 PERSISTENT SERVER

### `ecosystem.config.js`

```js
module.exports = {
  apps: [
    {
      name: 'home-dashboard-server',
      cwd: './server',
      script: 'src/index.js',
      watch: false,
      restart_delay: 3000,
      max_restarts: 10
    }
  ]
}
```

**Fix from original:** Removed `env_file` (not a valid PM2 option). The server
uses `dotenv` to load `.env` from the project root via a configured path.

### Root `package.json` scripts

```json
{
  "start": "pm2 start ecosystem.config.js",
  "stop": "pm2 stop home-dashboard-server",
  "restart": "pm2 restart home-dashboard-server",
  "logs": "pm2 logs home-dashboard-server",
  "startup": "pm2 startup && pm2 save"
}
```

### Client production serve (in `client/package.json`)

```json
{
  "serve": "npm run build && npx serve -s dist -l 5173 --host 0.0.0.0"
}
```

---

## AI PROVIDER SYSTEM

AI is used in two places: **meal suggestions** and **financial insights**.

### `server/src/ai/provider.js`

- Reads `AI_PROVIDER` env var (`"anthropic"` or `"ollama"`)
- Exports: `async function generateResponse(systemPrompt, userPrompt)`
- All routes call only this function — never call Anthropic/Ollama directly

### `server/src/ai/anthropic.js`

- Uses `@anthropic-ai/sdk`
- Model: `claude-sonnet-4-20250514`

### `server/src/ai/ollama.js`

- Calls `POST ${OLLAMA_BASE_URL}/api/chat`
- Model from `OLLAMA_MODEL` env var (default `"llama3"`)

---

## DATABASE SCHEMA (Drizzle ORM + better-sqlite3)

### `accounts`
| Column     | Type    | Constraints                    |
|-----------|---------|--------------------------------|
| id        | integer | primary key, autoincrement     |
| name      | text    | not null                       |
| type      | text    | not null (checking/savings/credit/income) |
| created_at| text    | default current timestamp      |

### `categories`
| Column | Type    | Constraints                |
|--------|---------|----------------------------|
| id     | integer | primary key, autoincrement |
| name   | text    | not null                   |
| type   | text    | not null (income/expense)  |
| color  | text    | hex color for charts       |

### `transactions`
| Column      | Type    | Constraints                    |
|------------|---------|--------------------------------|
| id         | integer | primary key, autoincrement     |
| account_id | integer | references accounts.id         |
| category_id| integer | references categories.id       |
| amount     | real    | not null                       |
| type       | text    | not null (income/expense)      |
| description| text    |                                |
| date       | text    | not null (YYYY-MM-DD)          |
| created_at | text    | default current timestamp      |

### `tasks`
| Column      | Type    | Constraints                    |
|------------|---------|--------------------------------|
| id         | integer | primary key, autoincrement     |
| title      | text    | not null                       |
| description| text    |                                |
| assigned_to| text    | "Matt" or "Julia"              |
| status     | text    | default "todo" (todo/in_progress/done) |
| due_date   | text    |                                |
| created_at | text    | default current timestamp      |

### `meal_plans`
| Column       | Type    | Constraints                    |
|-------------|---------|--------------------------------|
| id          | integer | primary key, autoincrement     |
| week_start  | text    | not null (Monday YYYY-MM-DD)   |
| meals       | text    | not null (JSON string)         |
| grocery_list| text    | JSON string                    |
| created_at  | text    | default current timestamp      |

### Seed data
- 2 accounts: "Chase Checking" (checking), "Amex Blue" (credit)
- Expense categories with colors:
  Mortgage #6366f1, Groceries #8b5cf6, Utilities #a78bfa,
  Dining #ec4899, Subscriptions #f43f5e, Dog #f97316,
  Entertainment #fb923c, Gas #facc15, Shopping #4ade80,
  Home #2dd4bf, Healthcare #38bdf8, Other #94a3b8
- Income categories: Salary #10b981, Freelance #059669

---

## API ROUTES

Server runs on port 3001, bound to `0.0.0.0`.

### Finance
- `GET /api/transactions` — list all, filter by `?month=YYYY-MM`, `?category_id`, `?type`
- `POST /api/transactions` — create
- `PUT /api/transactions/:id` — update
- `DELETE /api/transactions/:id` — delete
- `GET /api/categories` — all categories
- `GET /api/accounts` — all accounts
- `GET /api/summary?month=YYYY-MM` — returns:
  ```json
  {
    "total_income": 0,
    "total_expenses": 0,
    "net": 0,
    "by_category": [{ "id": 1, "name": "...", "color": "#...", "amount": 0, "pct": 0 }],
    "by_day": [{ "date": "2025-01-15", "amount": 0 }]
  }
  ```

### Tasks
- `GET /api/tasks` — list all, filter by `?status`
- `POST /api/tasks` — create
- `PUT /api/tasks/:id` — update including status
- `DELETE /api/tasks/:id` — delete

### Meals
- `POST /api/meals/suggest` — accepts `{ ingredients, preferences, servings }`, returns 7 dinner suggestions + grocery list via AI
- `POST /api/meals/save` — saves meal plan to database
- `GET /api/meals/current` — returns most recent meal plan

### AI Insights
- `POST /api/insights` — accepts `{ months: [summary objects] }`, returns narrative text via AI

---

## FRONTEND PAGES

Persistent top navbar with links: **Finance**, **Tasks**, **Meals**.
All API calls use `API_BASE` from `client/src/lib/api.js`.

### Finance page
- Monthly summary cards: Total Income, Total Expenses, Net Saved
- Month selector (prev/next arrows + current month label)
- Donut chart of spending by category (Recharts PieChart)
- Line chart of daily spending (Recharts LineChart)
- Transaction table: Date, Description, Category, Amount
- Add Transaction modal: date, type toggle, amount, category, account, description
- AI Insights button → calls `/api/insights` → displays response in panel below charts

### Tasks page
- Three columns: To Do, In Progress, Done
- Task cards showing title, assigned_to (Matt/Julia), due_date
- Add Task form: title, description, assigned_to (Matt / Julia), due_date
- Click card to advance to next status

### Meals page
- Input: pantry/fridge textarea, cuisine preferences dropdown, servings count
- Suggest Meals button → calls `/api/meals/suggest`
- 7 day cards (Mon–Sun) showing meal name and key ingredients
- Grocery list as categorized checklist below
- Save This Plan button

---

## GITHUB ACTIONS CI

`.github/workflows/ci.yml`:
- Triggers on push to any branch and PRs to main
- Runs on ubuntu-latest, Node 20
- `npm ci` on client and server separately
- `npm run lint` on client
- `npm run build` on client

---

## BUILD ORDER

1. Root `package.json` with workspace config and PM2 scripts
2. `CLAUDE.md`, `.gitignore`, `.env.example`, `client/.env.example`
3. `BACKLOG.md` — feature backlog tracker
4. Server: `package.json`, Drizzle schema, seed file, database connection, `drizzle.config.js`
5. Server: AI provider abstraction (`provider.js`, `anthropic.js`, `ollama.js`)
6. Server: CORS config and Express server bound to `0.0.0.0`
7. Server: all route files
8. Server: `index.js` wiring everything together
9. `ecosystem.config.js` PM2 config
10. Client: Vite scaffold with `host: '0.0.0.0'` in `vite.config.js`
11. Client: `client/src/lib/api.js` with `API_BASE` using `VITE_HOST_IP`
12. Client: Tailwind config, `postcss.config.js`, React Router, Navbar, page shells
13. Client: Finance page (summary cards, charts, transaction table, add modal, AI insights panel)
14. Client: Tasks page
15. Client: Meals page
16. GitHub Actions CI workflow
17. Commit everything: `feat: initial project scaffold — all modules`
