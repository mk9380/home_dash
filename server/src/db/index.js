const path = require('path')
const fs = require('fs')
const initSqlJs = require('sql.js')
const { drizzle } = require('drizzle-orm/sql-js')
const schema = require('./schema')

const dbPath = path.join(__dirname, '..', '..', 'dashboard.sqlite')

let db = null
let sqlite = null

async function getDb() {
  if (db) return { db, sqlite }

  console.log('Initializing database at:', dbPath)
  console.log('Database file exists:', fs.existsSync(dbPath))

  const SQL = await initSqlJs()

  // Load existing database file if it exists, otherwise create new
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    sqlite = new SQL.Database(fileBuffer)
    console.log('Loaded existing database')
  } else {
    sqlite = new SQL.Database()
    console.log('Created new empty database — run npm run db:seed to populate')
  }

  sqlite.run('PRAGMA foreign_keys = ON')

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

// Auto-save every 5 seconds if there are changes
setInterval(() => {
  saveDb()
}, 5000)

// Save on process exit
process.on('exit', saveDb)
process.on('SIGINT', () => { saveDb(); process.exit() })
process.on('SIGTERM', () => { saveDb(); process.exit() })

module.exports = { getDb, saveDb }
