const express = require('express')
const { getDb, saveDb } = require('../db')
const { mealPlans } = require('../db/schema')
const { sql } = require('drizzle-orm')
const { generateResponse } = require('../ai/provider')

const router = express.Router()

// POST /api/meals/suggest — AI-powered meal suggestions
router.post('/suggest', async (req, res) => {
  try {
    const { ingredients, preferences, servings } = req.body

    const systemPrompt = `You are a helpful meal planning assistant. Generate exactly 7 dinner suggestions for a week (Monday through Sunday). For each meal, include the meal name and a list of key ingredients. Also generate a consolidated grocery list organized by category (produce, protein, dairy, pantry, etc). Respond ONLY with valid JSON in this exact format:
{
  "meals": [
    { "day": "Monday", "name": "Meal Name", "ingredients": ["ingredient1", "ingredient2"] },
    ...
  ],
  "grocery_list": [
    { "category": "Produce", "items": ["item1", "item2"] },
    ...
  ]
}`

    const userPrompt = `Plan 7 dinners for ${servings || 2} people.
${ingredients ? `Available ingredients: ${ingredients}` : ''}
${preferences ? `Cuisine preferences: ${preferences}` : ''}
Use the available ingredients when possible and add what's needed to the grocery list.`

    const response = await generateResponse(systemPrompt, userPrompt)

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Failed to parse AI response' })
    }

    const parsed = JSON.parse(jsonMatch[0])
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/meals/save — save meal plan
router.post('/save', async (req, res) => {
  try {
    const { db } = await getDb()
    const { week_start, meals, grocery_list } = req.body
    const result = await db.insert(mealPlans).values({
      week_start,
      meals: JSON.stringify(meals),
      grocery_list: JSON.stringify(grocery_list)
    }).returning()
    saveDb()
    res.status(201).json(result[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/meals/current — most recent meal plan
router.get('/current', async (req, res) => {
  try {
    const { db } = await getDb()
    const result = await db.select()
      .from(mealPlans)
      .orderBy(sql`${mealPlans.created_at} DESC`)
      .limit(1)

    if (result.length === 0) {
      return res.json(null)
    }

    const plan = result[0]
    res.json({
      ...plan,
      meals: JSON.parse(plan.meals),
      grocery_list: plan.grocery_list ? JSON.parse(plan.grocery_list) : []
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
