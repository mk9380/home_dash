const path = require('path')
const fs = require('fs')
const initSqlJs = require('sql.js')
const { drizzle } = require('drizzle-orm/sql-js')
const schema = require('./schema')

const dbPath = path.join(__dirname, '..', '..', 'dashboard.sqlite')

let db = null
let sqlite = null

const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER REFERENCES accounts(id),
    category_id INTEGER REFERENCES categories(id),
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    color TEXT DEFAULT '#6366f1',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(id),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    theme TEXT,
    tag TEXT DEFAULT 'home',
    due_date TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS subtasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER REFERENCES tasks(id) NOT NULL,
    title TEXT NOT NULL,
    is_complete INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER REFERENCES tasks(id) NOT NULL,
    author TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS meal_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start TEXT NOT NULL,
    meals TEXT NOT NULL,
    grocery_list TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`

const SEED_SQL = `
  INSERT OR IGNORE INTO accounts (id, name, type) VALUES (1, 'Chase Checking', 'checking');
  INSERT OR IGNORE INTO accounts (id, name, type) VALUES (2, 'Amex Blue', 'credit');
  INSERT OR IGNORE INTO categories (id, name, type, color) VALUES (1, 'Mortgage', 'expense', '#6366f1');
  INSERT OR IGNORE INTO categories (id, name, type, color) VALUES (2, 'Groceries', 'expense', '#8b5cf6');
  INSERT OR IGNORE INTO categories (id, name, type, color) VALUES (3, 'Utilities', 'expense', '#a78bfa');
  INSERT OR IGNORE INTO categories (id, name, type, color) VALUES (4, 'Dining', 'expense', '#ec4899');
  INSERT OR IGNORE INTO categories (id, name, type, color) VALUES (5, 'Subscriptions', 'expense', '#f43f5e');
  INSERT OR IGNORE INTO categories (id, name, type, color) VALUES (6, 'Dog', 'expense', '#f97316');
  INSERT OR IGNORE INTO categories (id, name, type, color) VALUES (7, 'Entertainment', 'expense', '#fb923c');
  INSERT OR IGNORE INTO categories (id, name, type, color) VALUES (8, 'Gas', 'expense', '#facc15');
  INSERT OR IGNORE INTO categories (id, name, type, color) VALUES (9, 'Shopping', 'expense', '#4ade80');
  INSERT OR IGNORE INTO categories (id, name, type, color) VALUES (10, 'Home', 'expense', '#2dd4bf');
  INSERT OR IGNORE INTO categories (id, name, type, color) VALUES (11, 'Healthcare', 'expense', '#38bdf8');
  INSERT OR IGNORE INTO categories (id, name, type, color) VALUES (12, 'Other', 'expense', '#94a3b8');
  INSERT OR IGNORE INTO categories (id, name, type, color) VALUES (13, 'Salary', 'income', '#10b981');
  INSERT OR IGNORE INTO categories (id, name, type, color) VALUES (14, 'Freelance', 'income', '#059669');
`

async function getDb() {
  if (db) return { db, sqlite }

  console.log('Initializing database at:', dbPath)

  const SQL = await initSqlJs()

  // Load existing database file if it exists, otherwise create new
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    sqlite = new SQL.Database(fileBuffer)
    console.log('Loaded existing database')
  } else {
    sqlite = new SQL.Database()
    console.log('Created new database')
  }

  sqlite.run('PRAGMA foreign_keys = ON')

  // Always ensure tables and seed data exist
  sqlite.run(CREATE_TABLES_SQL)
  sqlite.run(SEED_SQL)

  // Migrate existing tasks table if missing new columns
  const MIGRATIONS = [
    { column: 'project_id', sql: 'ALTER TABLE tasks ADD COLUMN project_id INTEGER REFERENCES projects(id)' },
    { column: 'priority', sql: "ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'medium'" },
    { column: 'theme', sql: 'ALTER TABLE tasks ADD COLUMN theme TEXT' },
    { column: 'tag', sql: "ALTER TABLE tasks ADD COLUMN tag TEXT DEFAULT 'home'" },
    { column: 'completed_at', sql: 'ALTER TABLE tasks ADD COLUMN completed_at TEXT' }
  ]
  for (const m of MIGRATIONS) {
    try { sqlite.run(m.sql) } catch (e) {
      if (!e.message.includes('duplicate column')) throw e
    }
  }

  saveDb()
  console.log('Database tables and seed data verified')

  db = drizzle(sqlite, { schema })

  return { db, sqlite }
}

// Save database to disk
function saveDb() {
  if (sqlite) {
    const data = sqlite.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
  }
}

// Auto-save every 5 seconds
setInterval(() => {
  saveDb()
}, 5000)

// Save on process exit
process.on('exit', saveDb)
process.on('SIGINT', () => { saveDb(); process.exit() })
process.on('SIGTERM', () => { saveDb(); process.exit() })

module.exports = { getDb, saveDb }
