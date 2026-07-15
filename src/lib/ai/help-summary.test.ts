/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * `generateFamilySummary` 编排层测试:ok / fail-open 各路径 + 安全闸联动。
 *
 * ## 输入
 * mock AiClient(可控返回/抛错)+ 受控 env。
 *
 * ## 输出
 * node --test pass/fail 计数。
 *
 * ## 定位
 * 形态 ③ 的合同测试。重点:**任何失败路径都必须返回 null 而不是抛出**。
 *
 * ## 依赖
 * node:test + node:assert/strict;./help-summary.ts(被测);
 * ./rate-limit.ts 的 __resetRateLimitStateForTests(隔离共享限流状态)。
 *
 * ## 维护规则
 * 新增 fail-open 分支(新 stage)时补对应用例。
 */
import assert from 'node:assert/strict'
import { beforeEach, describe, test } from 'node:test'

import type { AiClient } from './ai-client.ts'
import { generateFamilySummary } from './help-summary.ts'
import { __resetRateLimitStateForTests } from './rate-limit.ts'

const VALID_SUMMARY =
  '我收到一条短信说医保卡不能用了,让我点链接输验证码,我担心是骗子。'

function mockClient(
  behavior: 'ok' | 'forbidden' | 'garbage' | 'throw' | 'disabled',
): AiClient {
  return {
    isEnabled: () => behavior !== 'disabled',
    async chat() {
      switch (behavior) {
        case 'ok':
          return JSON.stringify({ summary: VALID_SUMMARY })
        case 'forbidden':
          // 命中「教给出去」闸:把验证码发
          return JSON.stringify({
            summary: '客服说把验证码发过去就能解冻账户,请家人帮忙确认一下。',
          })
        case 'garbage':
          return '抱歉我无法输出 JSON'
        case 'throw':
          throw new Error('Gemini timeout after 8000ms')
        case 'disabled':
          throw new Error('unreachable')
      }
    },
  }
}

beforeEach(() => {
  __resetRateLimitStateForTests()
  delete process.env.ENABLE_AI_RISK_RECHECK
})

describe('generateFamilySummary — ok 路径', () => {
  test('合法输出 → summary + source=ai', async () => {
    const r = await generateFamilySummary('短信让我输验证码', 'high', ['验证码'], mockClient('ok'))
    assert.equal(r.source, 'ai')
    assert.equal(r.summary, VALID_SUMMARY)
  })
})

describe('generateFamilySummary — fail-open(全部返回 null,绝不抛出)', () => {
  test('安全闸拦截(教给出去话术)→ null', async () => {
    const r = await generateFamilySummary('短信让我输验证码', 'high', [], mockClient('forbidden'))
    assert.equal(r.summary, null)
    assert.equal(r.source, 'fallback')
  })

  test('非 JSON 输出 → null', async () => {
    const r = await generateFamilySummary('短信让我输验证码', 'high', [], mockClient('garbage'))
    assert.equal(r.summary, null)
  })

  test('client 抛错(超时等)→ null,不向上抛', async () => {
    const r = await generateFamilySummary('短信让我输验证码', 'critical', [], mockClient('throw'))
    assert.equal(r.summary, null)
    assert.equal(r.source, 'fallback')
  })

  test('client 未启用(无 key)→ null', async () => {
    const r = await generateFamilySummary('短信让我输验证码', 'high', [], mockClient('disabled'))
    assert.equal(r.summary, null)
  })

  test('kill-switch(ENABLE_AI_RISK_RECHECK=false)→ null,不调 client', async () => {
    process.env.ENABLE_AI_RISK_RECHECK = 'false'
    let called = false
    const spy: AiClient = {
      isEnabled: () => true,
      async chat() {
        called = true
        return JSON.stringify({ summary: VALID_SUMMARY })
      },
    }
    const r = await generateFamilySummary('短信让我输验证码', 'high', [], spy)
    assert.equal(r.summary, null)
    assert.equal(called, false)
  })

  test('超长输入(>200 字)→ null,不调 client', async () => {
    let called = false
    const spy: AiClient = {
      isEnabled: () => true,
      async chat() {
        called = true
        return JSON.stringify({ summary: VALID_SUMMARY })
      },
    }
    const r = await generateFamilySummary('长'.repeat(201), 'high', [], spy)
    assert.equal(r.summary, null)
    assert.equal(called, false)
  })
})
