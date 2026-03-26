const { generateWithAnthropic } = require('./anthropic')
const { generateWithOllama } = require('./ollama')

async function generateResponse(systemPrompt, userPrompt) {
  const provider = process.env.AI_PROVIDER || 'anthropic'

  if (provider === 'anthropic') {
    return generateWithAnthropic(systemPrompt, userPrompt)
  } else if (provider === 'ollama') {
    return generateWithOllama(systemPrompt, userPrompt)
  } else {
    throw new Error(`Unknown AI provider: ${provider}`)
  }
}

module.exports = { generateResponse }
