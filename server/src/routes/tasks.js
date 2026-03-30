const express = require('express')
const { getDb, saveDb } = require('../db')
const { tasks, subtasks, comments } = require('../db/schema')
const { eq, and, sql } = require('drizzle-orm')

const router = express.Router()

// GET /api/tasks — list all with filters
router.get('/', async (req, res) => {
  try {
    const { db } = await getDb()
    const { status, project_id, priority, tag, theme, assigned_to } = req.query
    const conditions = []

    if (status) conditions.push(eq(tasks.status, status))
    if (project_id) conditions.push(eq(tasks.project_id, parseInt(project_id)))
    if (priority) conditions.push(eq(tasks.priority, priority))
    if (tag) conditions.push(eq(tasks.tag, tag))
    if (theme) conditions.push(eq(tasks.theme, theme))
    if (assigned_to) conditions.push(eq(tasks.assigned_to, assigned_to))

    let query = db.select().from(tasks)
    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }
    query = query.orderBy(sql`${tasks.created_at} DESC`)

    const result = await query

    // Attach subtask counts
    const allSubtasks = await db.select().from(subtasks)
    const tasksWithCounts = result.map(t => {
      const taskSubtasks = allSubtasks.filter(s => s.task_id === t.id)
      return {
        ...t,
        subtask_count: taskSubtasks.length,
        subtask_complete: taskSubtasks.filter(s => s.is_complete).length
      }
    })

    res.json(tasksWithCounts)
  } catch (err) {
    console.error('GET /api/tasks error:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/tasks/:id — single task with subtasks and comments
router.get('/:id', async (req, res) => {
  try {
    const { db } = await getDb()
    const taskId = parseInt(req.params.id)

    const taskResult = await db.select().from(tasks)
      .where(eq(tasks.id, taskId))
    if (taskResult.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const taskSubtasks = await db.select().from(subtasks)
      .where(eq(subtasks.task_id, taskId))
      .orderBy(sql`${subtasks.created_at} ASC`)

    const taskComments = await db.select().from(comments)
      .where(eq(comments.task_id, taskId))
      .orderBy(sql`${comments.created_at} DESC`)

    res.json({
      ...taskResult[0],
      subtasks: taskSubtasks,
      comments: taskComments
    })
  } catch (err) {
    console.error('GET /api/tasks/:id error:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/tasks — create
router.post('/', async (req, res) => {
  try {
    const { db } = await getDb()
    const { project_id, title, description, assigned_to, priority, theme, tag, due_date } = req.body
    const result = await db.insert(tasks).values({
      project_id: project_id || null,
      title, description, assigned_to,
      priority: priority || 'medium',
      theme: theme || null,
      tag: tag || 'home',
      due_date
    }).returning()
    saveDb()
    res.status(201).json(result[0])
  } catch (err) {
    console.error('POST /api/tasks error:', err)
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/tasks/:id — update
router.put('/:id', async (req, res) => {
  try {
    const { db } = await getDb()
    const { project_id, title, description, assigned_to, status, priority, theme, tag, due_date } = req.body
    const updates = {}
    if (project_id !== undefined) updates.project_id = project_id
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (assigned_to !== undefined) updates.assigned_to = assigned_to
    if (status !== undefined) {
      updates.status = status
      if (status === 'done') {
        updates.completed_at = new Date().toISOString()
      } else {
        updates.completed_at = null
      }
    }
    if (priority !== undefined) updates.priority = priority
    if (theme !== undefined) updates.theme = theme
    if (tag !== undefined) updates.tag = tag
    if (due_date !== undefined) updates.due_date = due_date

    const result = await db.update(tasks)
      .set(updates)
      .where(eq(tasks.id, parseInt(req.params.id)))
      .returning()
    if (result.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    saveDb()
    res.json(result[0])
  } catch (err) {
    console.error('PUT /api/tasks/:id error:', err)
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/tasks/:id — delete (also deletes subtasks and comments)
router.delete('/:id', async (req, res) => {
  try {
    const { db } = await getDb()
    const taskId = parseInt(req.params.id)

    await db.delete(subtasks).where(eq(subtasks.task_id, taskId))
    await db.delete(comments).where(eq(comments.task_id, taskId))

    const result = await db.delete(tasks)
      .where(eq(tasks.id, taskId))
      .returning()
    if (result.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    saveDb()
    res.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/tasks/:id error:', err)
    res.status(500).json({ error: err.message })
  }
})

// --- SUBTASKS ---

// POST /api/tasks/:id/subtasks — add subtask
router.post('/:id/subtasks', async (req, res) => {
  try {
    const { db } = await getDb()
    const { title } = req.body
    const result = await db.insert(subtasks).values({
      task_id: parseInt(req.params.id),
      title
    }).returning()
    saveDb()
    res.status(201).json(result[0])
  } catch (err) {
    console.error('POST /api/tasks/:id/subtasks error:', err)
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/tasks/:id/subtasks/:subtaskId — toggle or update subtask
router.put('/:id/subtasks/:subtaskId', async (req, res) => {
  try {
    const { db } = await getDb()
    const { title, is_complete } = req.body
    const updates = {}
    if (title !== undefined) updates.title = title
    if (is_complete !== undefined) updates.is_complete = is_complete

    const result = await db.update(subtasks)
      .set(updates)
      .where(eq(subtasks.id, parseInt(req.params.subtaskId)))
      .returning()
    if (result.length === 0) {
      return res.status(404).json({ error: 'Subtask not found' })
    }
    saveDb()
    res.json(result[0])
  } catch (err) {
    console.error('PUT subtask error:', err)
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/tasks/:id/subtasks/:subtaskId
router.delete('/:id/subtasks/:subtaskId', async (req, res) => {
  try {
    const { db } = await getDb()
    const result = await db.delete(subtasks)
      .where(eq(subtasks.id, parseInt(req.params.subtaskId)))
      .returning()
    if (result.length === 0) {
      return res.status(404).json({ error: 'Subtask not found' })
    }
    saveDb()
    res.json({ success: true })
  } catch (err) {
    console.error('DELETE subtask error:', err)
    res.status(500).json({ error: err.message })
  }
})

// --- COMMENTS ---

// POST /api/tasks/:id/comments — add comment
router.post('/:id/comments', async (req, res) => {
  try {
    const { db } = await getDb()
    const { author, body } = req.body
    const result = await db.insert(comments).values({
      task_id: parseInt(req.params.id),
      author,
      body
    }).returning()
    saveDb()
    res.status(201).json(result[0])
  } catch (err) {
    console.error('POST comment error:', err)
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/tasks/:id/comments/:commentId
router.delete('/:id/comments/:commentId', async (req, res) => {
  try {
    const { db } = await getDb()
    const result = await db.delete(comments)
      .where(eq(comments.id, parseInt(req.params.commentId)))
      .returning()
    if (result.length === 0) {
      return res.status(404).json({ error: 'Comment not found' })
    }
    saveDb()
    res.json({ success: true })
  } catch (err) {
    console.error('DELETE comment error:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/tasks/themes — list unique themes
router.get('/themes/list', async (req, res) => {
  try {
    const { sqlite } = await getDb()
    const result = sqlite.exec('SELECT DISTINCT theme FROM tasks WHERE theme IS NOT NULL AND theme != "" ORDER BY theme')
    const themes = result.length > 0 ? result[0].values.map(r => r[0]) : []
    res.json(themes)
  } catch (err) {
    console.error('GET themes error:', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
