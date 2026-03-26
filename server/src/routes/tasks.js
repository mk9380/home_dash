const express = require('express')
const { db } = require('../db')
const { tasks } = require('../db/schema')
const { eq, sql } = require('drizzle-orm')

const router = express.Router()

// GET /api/tasks — list all, filter by status
router.get('/', async (req, res) => {
  try {
    const { status } = req.query
    let query = db.select().from(tasks)
    if (status) {
      query = query.where(eq(tasks.status, status))
    }
    query = query.orderBy(sql`${tasks.created_at} DESC`)
    const result = await query
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/tasks — create
router.post('/', async (req, res) => {
  try {
    const { title, description, assigned_to, due_date } = req.body
    const result = await db.insert(tasks).values({
      title, description, assigned_to, due_date
    }).returning()
    res.status(201).json(result[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/tasks/:id — update including status
router.put('/:id', async (req, res) => {
  try {
    const { title, description, assigned_to, status, due_date } = req.body
    const updates = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (assigned_to !== undefined) updates.assigned_to = assigned_to
    if (status !== undefined) updates.status = status
    if (due_date !== undefined) updates.due_date = due_date

    const result = await db.update(tasks)
      .set(updates)
      .where(eq(tasks.id, parseInt(req.params.id)))
      .returning()
    if (result.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    res.json(result[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/tasks/:id — delete
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.delete(tasks)
      .where(eq(tasks.id, parseInt(req.params.id)))
      .returning()
    if (result.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
