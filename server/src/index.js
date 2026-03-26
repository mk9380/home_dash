const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })

const express = require('express')
const cors = require('cors')
const { db } = require('./db')
const { accounts } = require('./db/schema')

const transactionsRouter = require('./routes/transactions')
const categoriesRouter = require('./routes/categories')
const tasksRouter = require('./routes/tasks')
const mealsRouter = require('./routes/meals')
const insightsRouter = require('./routes/insights')

const app = express()
const PORT = process.env.SERVER_PORT || 3001

// CORS — allow all local network origins
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

app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Accounts route (simple, inline)
app.get('/api/accounts', async (req, res) => {
  try {
    const result = await db.select().from(accounts)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Mount routers
app.use('/api/transactions', transactionsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/meals', mealsRouter)
app.use('/api/insights', insightsRouter)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`)
})
