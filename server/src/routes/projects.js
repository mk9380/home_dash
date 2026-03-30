const express = require('express')
const { getDb, saveDb } = require('../db')
const { projects, tasks } = require('../db/schema')
const { eq, sql } = require('drizzle-orm')

const router = express.Router()

// GET /api/projects — list all, optionally filter by status
router.get('/', async (req, res) => {
  try {
    const { db } = await getDb()
    const { status } = req.query
    let query = db.select().from(projects)
    if (status) {
      query = query.where(eq(projects.status, status))
    }
    query = query.orderBy(sql`${projects.created_at} DESC`)
    const result = await query

    // Get task counts per project
    const allTasks = await db.select().from(tasks)
    const projectsWithCounts = result.map(p => {
      const projectTasks = allTasks.filter(t => t.project_id === p.id)
      return {
        ...p,
        task_count: projectTasks.length,
        completed_count: projectTasks.filter(t => t.status === 'done').length
      }
    })

    res.json(projectsWithCounts)
  } catch (err) {
    console.error('GET /api/projects error:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/projects/:id — single project
router.get('/:id', async (req, res) => {
  try {
    const { db } = await getDb()
    const result = await db.select().from(projects)
      .where(eq(projects.id, parseInt(req.params.id)))
    if (result.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }
    res.json(result[0])
  } catch (err) {
    console.error('GET /api/projects/:id error:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/projects — create
router.post('/', async (req, res) => {
  try {
    const { db } = await getDb()
    const { name, description, color } = req.body
    const result = await db.insert(projects).values({
      name, description, color
    }).returning()
    saveDb()
    res.status(201).json(result[0])
  } catch (err) {
    console.error('POST /api/projects error:', err)
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/projects/:id — update
router.put('/:id', async (req, res) => {
  try {
    const { db } = await getDb()
    const { name, description, status, color } = req.body
    const updates = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (status !== undefined) updates.status = status
    if (color !== undefined) updates.color = color

    const result = await db.update(projects)
      .set(updates)
      .where(eq(projects.id, parseInt(req.params.id)))
      .returning()
    if (result.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }
    saveDb()
    res.json(result[0])
  } catch (err) {
    console.error('PUT /api/projects/:id error:', err)
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/projects/:id — delete (also deletes associated tasks, subtasks, comments)
router.delete('/:id', async (req, res) => {
  try {
    const { db, sqlite } = await getDb()
    const projectId = parseInt(req.params.id)

    // Delete comments and subtasks for tasks in this project
    sqlite.run('DELETE FROM comments WHERE task_id IN (SELECT id FROM tasks WHERE project_id = ?)', [projectId])
    sqlite.run('DELETE FROM subtasks WHERE task_id IN (SELECT id FROM tasks WHERE project_id = ?)', [projectId])

    // Delete tasks in this project
    await db.delete(tasks).where(eq(tasks.project_id, projectId))

    // Delete the project
    const result = await db.delete(projects)
      .where(eq(projects.id, projectId))
      .returning()
    if (result.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }
    saveDb()
    res.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/projects/:id error:', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
