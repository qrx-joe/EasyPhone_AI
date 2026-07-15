/** Provider-neutral server-side model gateway used by the safety features. */
export type JsonSchema = Readonly<Record<string, unknown>>

export interface ChatRequest {
  readonly system: string
  readonly user: string
  readonly maxTokens?: number
  readonly responseSchema?: JsonSchema
  readonly signal?: AbortSignal
}

export interface AiClient {
  isEnabled(): boolean
  chat(req: ChatRequest): Promise<string>
}
