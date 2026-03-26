const express = require('express')
const { getDb, saveDb } = require('../db')
const { transactions, categories } = require('../db/schema')
const { eq, and, like, sql } = require('drizzle-orm')

const router = express.Router()

// GET /api/transactions — list all, filter by month, category_id, type
router.get('/', async (req, res) => {
  try {
    const { db } = await getDb()
    const { month, category_id, type } = req.query
    const conditions = []

    if (month) {
      conditions.push(like(transactions.date, `${month}%`))
    }
    if (category_id) {
      conditions.push(eq(transactions.category_id, parseInt(category_id)))
    }
    if (type) {
      conditions.push(eq(transactions.type, type))
    }

    let query = db.select().from(transactions)
    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }
    query = query.orderBy(sql`${transactions.date} DESC`)

    const results = await query
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/transactions — create
router.post('/', async (req, res) => {
  try {
    const { db } = await getDb()
    const { account_id, category_id, amount, type, description, date } = req.body
    const result = await db.insert(transactions).values({
      account_id, category_id, amount, type, description, date
    }).returning()
    saveDb()
    res.status(201).json(result[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/transactions/:id — update
router.put('/:id', async (req, res) => {
  try {
    const { db } = await getDb()
    const { account_id, category_id, amount, type, description, date } = req.body
    const result = await db.update(transactions)
      .set({ account_id, category_id, amount, type, description, date })
      .where(eq(transactions.id, parseInt(req.params.id)))
      .returning()
    if (result.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' })
    }
    saveDb()
    res.json(result[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/transactions/:id — delete
router.delete('/:id', async (req, res) => {
  try {
    const { db } = await getDb()
    const result = await db.delete(transactions)
      .where(eq(transactions.id, parseInt(req.params.id)))
      .returning()
    if (result.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' })
    }
    saveDb()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/summary?month=YYYY-MM — financial summary
router.get('/summary', async (req, res) => {
  try {
    const { db } = await getDb()
    const month = req.query.month || new Date().toISOString().slice(0, 7)

    const monthTransactions = await db.select()
      .from(transactions)
      .where(like(transactions.date, `${month}%`))

    const allCategories = await db.select().from(categories)
    const categoryMap = Object.fromEntries(allCategories.map(c => [c.id, c]))

    let total_income = 0
    let total_expenses = 0
    const byCategoryMap = {}
    const byDayMap = {}

    for (const t of monthTransactions) {
      if (t.type === 'income') {
        total_income += t.amount
      } else {
        total_expenses += t.amount

        const catId = t.category_id
        if (catId) {
          if (!byCategoryMap[catId]) {
            const cat = categoryMap[catId]
            byCategoryMap[catId] = {
              id: catId,
              name: cat ? cat.name : 'Unknown',
              color: cat ? cat.color : '#94a3b8',
              amount: 0
            }
          }
          byCategoryMap[catId].amount += t.amount
        }

        if (!byDayMap[t.date]) {
          byDayMap[t.date] = { date: t.date, amount: 0 }
        }
        byDayMap[t.date].amount += t.amount
      }
    }

    const by_category = Object.values(byCategoryMap).map(c => ({
      ...c,
      amount: Math.round(c.amount * 100) / 100,
      pct: total_expenses > 0 ? Math.round((c.amount / total_expenses) * 1000) / 10 : 0
    }))

    const by_day = Object.values(byDayMap).sort((a, b) => a.date.localeCompare(b.date))

    res.json({
      total_income: Math.round(total_income * 100) / 100,
      total_expenses: Math.round(total_expenses * 100) / 100,
      net: Math.round((total_income - total_expenses) * 100) / 100,
      by_category,
      by_day
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
