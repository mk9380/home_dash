const express = require('express')
const { db } = require('../db')
const { categories } = require('../db/schema')

const router = express.Router()

// GET /api/categories — all categories
router.get('/', async (req, res) => {
  try {
    const result = await db.select().from(categories)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/accounts — all accounts
// Mounted separately in index.js

module.exports = router
