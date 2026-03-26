const path = require('path')
const Database = require('better-sqlite3')
const { drizzle } = require('drizzle-orm/better-sqlite3')
const schema = require('./schema')

const dbPath = path.join(__dirname, '..', '..', 'dashboard.sqlite')
const sqlite = new Database(dbPath)

// Enable WAL mode for better concurrent read performance
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

const db = drizzle(sqlite, { schema })

module.exports = { db, sqlite }
