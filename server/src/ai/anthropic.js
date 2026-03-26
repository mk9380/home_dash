const Anthropic = require('@anthropic-ai/sdk')

let client = null

function getClient() {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return client
}

async function generateWithAnthropic(systemPrompt, userPrompt) {
  const anthropic = getClient()

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  })

  return response.content[0].text
}

module.exports = { generateWithAnthropic }
