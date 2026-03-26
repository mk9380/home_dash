const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') })

const { getDb, saveDb } = require('./index')

async function seed() {
  const { sqlite } = await getDb()

  // Create tables
  sqlite.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  sqlite.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      color TEXT
    )
  `)
  sqlite.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER REFERENCES accounts(id),
      category_id INTEGER REFERENCES categories(id),
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  sqlite.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      assigned_to TEXT,
      status TEXT DEFAULT 'todo',
      due_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  sqlite.run(`
    CREATE TABLE IF NOT EXISTS meal_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start TEXT NOT NULL,
      meals TEXT NOT NULL,
      grocery_list TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Seed accounts
  sqlite.run('INSERT OR IGNORE INTO accounts (id, name, type) VALUES (?, ?, ?)', [1, 'Chase Checking', 'checking'])
  sqlite.run('INSERT OR IGNORE INTO accounts (id, name, type) VALUES (?, ?, ?)', [2, 'Amex Blue', 'credit'])

  // Seed categories
  const allCategories = [
    [1, 'Mortgage', 'expense', '#6366f1'],
    [2, 'Groceries', 'expense', '#8b5cf6'],
    [3, 'Utilities', 'expense', '#a78bfa'],
    [4, 'Dining', 'expense', '#ec4899'],
    [5, 'Subscriptions', 'expense', '#f43f5e'],
    [6, 'Dog', 'expense', '#f97316'],
    [7, 'Entertainment', 'expense', '#fb923c'],
    [8, 'Gas', 'expense', '#facc15'],
    [9, 'Shopping', 'expense', '#4ade80'],
    [10, 'Home', 'expense', '#2dd4bf'],
    [11, 'Healthcare', 'expense', '#38bdf8'],
    [12, 'Other', 'expense', '#94a3b8'],
    [13, 'Salary', 'income', '#10b981'],
    [14, 'Freelance', 'income', '#059669']
  ]

  for (const [id, name, type, color] of allCategories) {
    sqlite.run('INSERT OR IGNORE INTO categories (id, name, type, color) VALUES (?, ?, ?, ?)', [id, name, type, color])
  }

  saveDb()

  console.log('Database seeded successfully!')
  console.log('  - 2 accounts created')
  console.log(`  - ${allCategories.length} categories created`)

  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
