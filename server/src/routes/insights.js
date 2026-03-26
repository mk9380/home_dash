const express = require('express')
const { generateResponse } = require('../ai/provider')

const router = express.Router()

// POST /api/insights — AI financial insights
router.post('/', async (req, res) => {
  try {
    const { months } = req.body

    if (!months || !Array.isArray(months) || months.length === 0) {
      return res.status(400).json({ error: 'Provide an array of monthly summary objects' })
    }

    const systemPrompt = `You are a personal finance advisor analyzing household spending data. Provide concise, actionable insights in a friendly tone. Focus on:
- Notable spending trends or changes
- Categories where spending seems high or unusual
- Practical suggestions for saving money
- Positive observations about good financial habits
Keep your response to 3-5 short paragraphs. Be specific — reference actual numbers and categories from the data.`

    const userPrompt = `Here is our household financial data for the last ${months.length} month(s):\n\n${JSON.stringify(months, null, 2)}`

    const response = await generateResponse(systemPrompt, userPrompt)
    res.json({ insights: response })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
