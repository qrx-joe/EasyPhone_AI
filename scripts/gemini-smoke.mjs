import { createHash } from 'node:crypto'

import { createGeminiClient } from '../src/lib/ai/gemini-client.ts'

const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? ''
const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash'
const baseUrl =
  process.env.GEMINI_BASE_URL ||
  'https://generativelanguage.googleapis.com/v1beta/models'

if (!apiKey.trim()) {
  console.error(
    'Gemini smoke test skipped: set GEMINI_API_KEY or GOOGLE_API_KEY in this terminal.',
  )
  process.exit(2)
}

const testInput =
  'My niece says I must send $5,000 now. She asked me not to call and to share the OTP.'
const inputHash = createHash('sha256').update(testInput).digest('hex').slice(0, 12)
const responseSchema = {
  type: 'object',
  properties: {
    action: { type: 'string', enum: ['keep', 'escalate'] },
    reason: { type: 'string' },
  },
  required: ['action', 'reason'],
  additionalProperties: false,
}

const client = createGeminiClient({
  apiKey,
  model,
  baseUrl,
  timeoutMs: 20_000,
})

const startedAt = Date.now()
const raw = await client.chat({
  system:
    'Classify whether a phone-safety question should remain low risk or be escalated. Escalate impersonation, urgent transfer, OTP, unknown links, screen sharing, or remote control. Return JSON only.',
  user: testInput,
  maxTokens: 120,
  responseSchema,
})
const latencyMs = Date.now() - startedAt
const parsed = JSON.parse(raw)

if (
  !parsed ||
  parsed.action !== 'escalate' ||
  typeof parsed.reason !== 'string' ||
  parsed.reason.trim().length === 0
) {
  throw new Error('Gemini smoke test failed semantic validation')
}

console.log(
  JSON.stringify(
    {
      provider: 'Google Gemini API',
      model,
      endpoint: `${baseUrl}/${model}:generateContent`,
      inputHash,
      inputLength: testInput.length,
      action: parsed.action,
      reason: parsed.reason,
      latencyMs,
      apiKeyLogged: false,
      inputLogged: false,
      testedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
)
