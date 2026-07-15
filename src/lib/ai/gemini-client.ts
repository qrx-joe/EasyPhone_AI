import type { AiClient, ChatRequest } from './ai-client.ts'

export interface GeminiConfig {
  readonly apiKey: string
  readonly model: string
  readonly baseUrl: string
  readonly timeoutMs: number
  readonly fetchImpl?: typeof fetch
}

const DEFAULT_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_MODEL = 'gemini-3.5-flash'
const DEFAULT_TIMEOUT_MS = 8000
const DEFAULT_MAX_TOKENS = 120

export function createGeminiClient(config: GeminiConfig): AiClient {
  const enabled = config.apiKey.trim().length > 0
  const fetchImpl = config.fetchImpl ?? fetch

  return {
    isEnabled: () => enabled,
    async chat(req: ChatRequest): Promise<string> {
      if (!enabled) {
        throw new Error('Gemini client disabled: missing apiKey')
      }

      const internalController = new AbortController()
      const timer = setTimeout(() => internalController.abort(), config.timeoutMs)
      const onExternalAbort = () => internalController.abort()
      if (req.signal) {
        if (req.signal.aborted) internalController.abort()
        else req.signal.addEventListener('abort', onExternalAbort, { once: true })
      }

      const endpoint = `${config.baseUrl.replace(/\/$/, '')}/${encodeURIComponent(config.model)}:generateContent`

      try {
        const res = await fetchImpl(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': config.apiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: req.system }] },
            contents: [{ role: 'user', parts: [{ text: req.user }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
              responseMimeType: 'application/json',
              ...(req.responseSchema
                ? { responseSchema: req.responseSchema }
                : {}),
            },
          }),
          signal: internalController.signal,
        })

        if (!res.ok) {
          const body = await res.text().catch(() => '')
          throw new Error(`Gemini HTTP ${res.status}: ${body.slice(0, 200)}`)
        }

        const json = (await res.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> }
          }>
        }
        const content = json.candidates?.[0]?.content?.parts?.[0]?.text
        if (typeof content !== 'string') {
          throw new Error(
            'Gemini response missing candidates[0].content.parts[0].text',
          )
        }
        return content
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error(`Gemini timeout after ${config.timeoutMs}ms`)
        }
        throw err
      } finally {
        clearTimeout(timer)
        req.signal?.removeEventListener('abort', onExternalAbort)
      }
    },
  }
}

function parseTimeoutMs(raw: string | undefined): number | null {
  if (!raw) return null
  const value = Number.parseInt(raw, 10)
  return Number.isFinite(value) && value > 0 ? value : null
}

export const defaultGeminiClient: AiClient = createGeminiClient({
  apiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? '',
  model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
  baseUrl: process.env.GEMINI_BASE_URL || DEFAULT_BASE_URL,
  timeoutMs:
    parseTimeoutMs(process.env.AI_RECHECK_TIMEOUT_MS) ?? DEFAULT_TIMEOUT_MS,
})

export function isAiRecheckGloballyEnabled(): boolean {
  return process.env.ENABLE_AI_RISK_RECHECK !== 'false'
}
