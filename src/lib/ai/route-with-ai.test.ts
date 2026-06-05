/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * `routeWithAiRecheck` 单元测试 —— 验证 AI 兜底和关键词保险丝的协作。
 *
 * ## 输入
 * - 文件内造的中文输入(各风险等级)+ 显式 mock 的 DeepSeekClient
 *
 * ## 输出
 * node --test 跑过的 pass/fail 计数(本文件 9+ case,3 个 suite)
 *
 * ## 定位
 * 锁住"AI 在路由层的接入边界":AI 永远是补漏,不替换关键词保险丝。
 *
 * ## 关键不变量
 * 1. 高/中风险输入 → **AI 永远不被调**(关键词保险丝优先)
 * 2. AI escalate → 升级到 /risk-alert
 * 3. AI 失败 → 降级到 buildRouteForInput 原结果
 * 4. **空文本 → /** (同 buildRouteForInput 兜底)
 *
 * ## 依赖
 * node:test + node:assert/strict;`./route-with-ai.ts` 的 `routeWithAiRecheck`;
 * `./deepseek-client.ts` 的 `DeepSeekClient` 类型;`process.env.ENABLE_AI_RISK_RECHECK`。
 *
 * ## 维护规则
 * 任何 PR 改 routeWithAiRecheck → 跑这 8+ 个 case;漏一个 = 安全不变量缺口。
 * 任何 PR 改 routeWithAiRecheck → 跑这 8 个 case;漏一个 = 安全不变量缺口。
 */

import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, test } from 'node:test'

import type { DeepSeekClient } from './deepseek-client.ts'
import { routeWithAiRecheck } from './route-with-ai.ts'

let prevEnabled: string | undefined

beforeEach(() => {
  prevEnabled = process.env.ENABLE_AI_RISK_RECHECK
  delete process.env.ENABLE_AI_RISK_RECHECK // 默认启用
})

afterEach(() => {
  if (prevEnabled === undefined) delete process.env.ENABLE_AI_RISK_RECHECK
  else process.env.ENABLE_AI_RISK_RECHECK = prevEnabled
})

function makeClient(
  chatImpl: (req: { system: string; user: string }) => Promise<string>,
): DeepSeekClient {
  return {
    isEnabled: () => true,
    chat: chatImpl,
  }
}

describe('routeWithAiRecheck — 旁路 AI(高/中风险)', () => {
  test('critical 风险(屏幕共享) → AI 不被调,直走 /risk-alert', async () => {
    const client = makeClient(async () => {
      throw new Error('AI should not be called for critical risk')
    })
    const r = await routeWithAiRecheck('对方让我开屏幕共享', client)
    assert.equal(r.level, 'critical')
    assert.ok(r.href.startsWith('/risk-alert?'))
  })

  test('high 风险(陌生链接) → AI 不被调,直走 /risk-alert', async () => {
    const client = makeClient(async () => {
      throw new Error('AI should not be called for high risk')
    })
    const r = await routeWithAiRecheck('点这个陌生链接领奖', client)
    assert.equal(r.level, 'high')
    assert.ok(r.href.startsWith('/risk-alert?'))
  })

  test('medium 风险 → AI 不被调,直走 /confirm', async () => {
    const client = makeClient(async () => {
      throw new Error('AI should not be called for medium risk')
    })
    const r = await routeWithAiRecheck('对方问我手机号', client)
    assert.equal(r.level, 'medium')
    assert.ok(r.href.startsWith('/confirm?'))
  })
})

describe('routeWithAiRecheck — AI 决策(LOW 输入)', () => {
  test('AI keep → 保持 /confirm', async () => {
    const client = makeClient(async () =>
      JSON.stringify({ decision: 'keep', reason: '系统操作类' }),
    )
    const r = await routeWithAiRecheck('微信没有声音了', client)
    assert.ok(r.href.startsWith('/confirm?'), `实际 ${r.href}`)
    assert.equal(r.level, 'low')
  })

  test('AI escalate → 升级到 /risk-alert,level=high', async () => {
    const client = makeClient(async () =>
      JSON.stringify({ decision: 'escalate', reason: '嗅到诈骗' }),
    )
    const r = await routeWithAiRecheck('我闺女让我帮她弄一下', client)
    assert.ok(r.href.startsWith('/risk-alert?'), `实际 ${r.href}`)
    assert.equal(r.level, 'high')
    // 升级后 URL 里应带 reason,给 risk-alert 页显示用
    const params = new URL(r.href, 'http://x').searchParams
    assert.ok(params.get('reason')?.includes('AI 兜底'))
  })

  test('AI 抛错 → 降级到 buildRouteForInput 原结果(还是 /confirm)', async () => {
    const client = makeClient(async () => {
      throw new Error('network down')
    })
    const r = await routeWithAiRecheck('微信没有声音了', client)
    assert.ok(r.href.startsWith('/confirm?'))
    assert.equal(r.level, 'low')
  })

  test('AI 返回 malformed → 降级到 /confirm', async () => {
    const client = makeClient(async () => 'not json')
    const r = await routeWithAiRecheck('微信没有声音了', client)
    assert.ok(r.href.startsWith('/confirm?'))
    assert.equal(r.level, 'low')
  })
})

describe('routeWithAiRecheck — 兜底', () => {
  test('空字符串 → /', async () => {
    const client = makeClient(async () => {
      throw new Error('should not be called')
    })
    const r = await routeWithAiRecheck('', client)
    assert.equal(r.href, '/')
  })

  test('纯空白 → /', async () => {
    const client = makeClient(async () => {
      throw new Error('should not be called')
    })
    const r = await routeWithAiRecheck('   \t\n  ', client)
    assert.equal(r.href, '/')
  })
})
