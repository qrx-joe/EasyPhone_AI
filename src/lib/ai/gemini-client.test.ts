import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { createGeminiClient } from './gemini-client.ts'

const BASE_CONFIG = {
  apiKey: 'test-key',
  model: 'gemini-3.5-flash',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
  timeoutMs: 1000,
} as const

describe('createGeminiClient', () => {
  test('缺少 API key 时 disabled', async () => {
    const client = createGeminiClient({ ...BASE_CONFIG, apiKey: '' })
    assert.equal(client.isEnabled(), false)
    await assert.rejects(
      client.chat({ system: 'system', user: 'user' }),
      /missing apiKey/,
    )
  })

  test('按 Gemini generateContent 合约发送结构化请求', async () => {
    let capturedUrl = ''
    let capturedInit: RequestInit | undefined
    const fetchImpl: typeof fetch = async (input, init) => {
      capturedUrl = String(input)
      capturedInit = init
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: '{"decision":"keep"}' }] } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }
    const client = createGeminiClient({ ...BASE_CONFIG, fetchImpl })
    const responseSchema = {
      type: 'object',
      properties: { decision: { type: 'string' } },
      required: ['decision'],
    }

    const result = await client.chat({
      system: '只输出 JSON',
      user: '检查这条消息',
      maxTokens: 80,
      responseSchema,
    })

    assert.equal(result, '{"decision":"keep"}')
    assert.equal(
      capturedUrl,
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',
    )
    const headers = new Headers(capturedInit?.headers)
    assert.equal(headers.get('x-goog-api-key'), 'test-key')
    const body = JSON.parse(String(capturedInit?.body))
    assert.equal(body.systemInstruction.parts[0].text, '只输出 JSON')
    assert.equal(body.contents[0].parts[0].text, '检查这条消息')
    assert.equal(body.generationConfig.responseMimeType, 'application/json')
    assert.deepEqual(body.generationConfig.responseSchema, responseSchema)
  })

  test('非 2xx 和缺失文本均抛出可诊断错误', async () => {
    const httpFailure = createGeminiClient({
      ...BASE_CONFIG,
      fetchImpl: async () => new Response('quota exceeded', { status: 429 }),
    })
    await assert.rejects(
      httpFailure.chat({ system: 's', user: 'u' }),
      /Gemini HTTP 429/,
    )

    const malformed = createGeminiClient({
      ...BASE_CONFIG,
      fetchImpl: async () =>
        new Response(JSON.stringify({ candidates: [] }), { status: 200 }),
    })
    await assert.rejects(
      malformed.chat({ system: 's', user: 'u' }),
      /missing candidates/,
    )
  })
})
