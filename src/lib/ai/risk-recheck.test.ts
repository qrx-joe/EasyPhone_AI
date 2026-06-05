/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * `recheckLowRisk` 单元测试 —— AI 兜底复检主流程。
 *
 * ## 输入
 * - 文件内造的 RiskClassification(全部走 LOW,因为是"low 复检"语义)
 * - 通过 DeepSeekClient 参数注入 mock(不依赖 env)
 *
 * ## 输出
 * node --test 跑过的 pass/fail 计数(本文件 9+ case,3 个 suite)
 *
 * ## 定位
 * 锁住"AI 兜底"的安全行为:fail-open 永不抛出 + 各种失败模式都降级到 keep。
 *
 * ## 覆盖维度
 * 1. env 缺失 / kill-switch / 长度 cap → 全部 fail-open (source: fallback)
 * 2. AI 返回 keep / escalate / malformed / throws → 行为正确
 * 3. 关键不变量:fail-open **永不抛出**
 *
 * ## 依赖
 * node:test + node:assert/strict;`./risk-recheck.ts` 的 `recheckLowRisk`;
 * `./deepseek-client.ts` 的 `DeepSeekClient` 类型;`../../domain/risk/types.ts` 的 `RiskClassification`。
 *
 * ## 维护规则
 * - 改 fail-open 路径 = 改安全哲学,需 ADR
 * - 改 env 行为要补 env 相关 case
 */

import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, test } from 'node:test'

import type { RiskClassification } from '../../domain/risk/types.ts'
import type { DeepSeekClient } from './deepseek-client.ts'
import { recheckLowRisk } from './risk-recheck.ts'

/**
 * mock client 工厂;每个测试用 `clientOverride` 跑一个行为分支。
 */
function makeMockClient(overrides: Partial<DeepSeekClient> = {}): DeepSeekClient {
  return {
    isEnabled: () => true,
    chat: async () => '{"decision":"keep","reason":"mock"}',
    ...overrides,
  }
}

const LOW_CLASSIFICATION: RiskClassification = {
  level: 'low',
  matchedKeywords: [],
  reason: '',
}

describe('recheckLowRisk — fail-open 路径(AI 不跑)', () => {
  let prevEnabled: string | undefined
  let prevKey: string | undefined

  beforeEach(() => {
    prevEnabled = process.env.ENABLE_AI_RISK_RECHECK
    prevKey = process.env.DEEPSEEK_API_KEY
  })

  afterEach(() => {
    // 还原 env,避免污染
    if (prevEnabled === undefined) delete process.env.ENABLE_AI_RISK_RECHECK
    else process.env.ENABLE_AI_RISK_RECHECK = prevEnabled
    if (prevKey === undefined) delete process.env.DEEPSEEK_API_KEY
    else process.env.DEEPSEEK_API_KEY = prevKey
  })

  test('ENABLE_AI_RISK_RECHECK=false → 跳过 AI,keep', async () => {
    process.env.ENABLE_AI_RISK_RECHECK = 'false'
    // 即便 client.isEnabled()=true 也不应被调
    const client = makeMockClient({
      chat: async () => {
        throw new Error('should not be called')
      },
    })
    const r = await recheckLowRisk('微信没声音', LOW_CLASSIFICATION, client)
    assert.equal(r.decision, 'keep')
    assert.equal(r.source, 'fallback')
    assert.equal(r.reason, 'globally disabled')
  })

  test('client.isEnabled()=false(无 API key) → keep', async () => {
    delete process.env.ENABLE_AI_RISK_RECHECK
    const client = makeMockClient({ isEnabled: () => false })
    const r = await recheckLowRisk('微信没声音', LOW_CLASSIFICATION, client)
    assert.equal(r.decision, 'keep')
    assert.equal(r.source, 'fallback')
    assert.equal(r.reason, 'no api key')
  })

  test('输入超过 200 字 → 跳过 AI,keep', async () => {
    delete process.env.ENABLE_AI_RISK_RECHECK
    const client = makeMockClient({
      chat: async () => {
        throw new Error('should not be called')
      },
    })
    const long = '啊'.repeat(201)
    const r = await recheckLowRisk(long, LOW_CLASSIFICATION, client)
    assert.equal(r.decision, 'keep')
    assert.equal(r.source, 'fallback')
    assert.equal(r.reason, 'text too long')
  })
})

describe('recheckLowRisk — AI 决策路径', () => {
  let prevEnabled: string | undefined

  beforeEach(() => {
    prevEnabled = process.env.ENABLE_AI_RISK_RECHECK
    delete process.env.ENABLE_AI_RISK_RECHECK // 默认启用
  })

  afterEach(() => {
    if (prevEnabled === undefined) delete process.env.ENABLE_AI_RISK_RECHECK
    else process.env.ENABLE_AI_RISK_RECHECK = prevEnabled
  })

  test('AI 返回 keep → 透传,source=ai', async () => {
    const client = makeMockClient({
      chat: async () =>
        JSON.stringify({ decision: 'keep', reason: '系统操作类' }),
    })
    const r = await recheckLowRisk('微信没声音', LOW_CLASSIFICATION, client)
    assert.equal(r.decision, 'keep')
    assert.equal(r.source, 'ai')
    assert.equal(r.reason, '系统操作类')
  })

  test('AI 返回 escalate → 升级,source=ai', async () => {
    const client = makeMockClient({
      chat: async () =>
        JSON.stringify({ decision: 'escalate', reason: '嗅到冒充亲属' }),
    })
    const r = await recheckLowRisk(
      '我闺女让我帮她弄一下',
      LOW_CLASSIFICATION,
      client,
    )
    assert.equal(r.decision, 'escalate')
    assert.equal(r.source, 'ai')
    assert.equal(r.reason, '嗅到冒充亲属')
  })

  test('AI 返回无法解析的 JSON → fail-open', async () => {
    const client = makeMockClient({
      chat: async () => 'I am confused, here is my answer...',
    })
    const r = await recheckLowRisk('微信没声音', LOW_CLASSIFICATION, client)
    assert.equal(r.decision, 'keep')
    assert.equal(r.source, 'fallback')
    assert.equal(r.reason, 'unparseable')
  })

  test('AI 返回缺字段的 JSON → fail-open', async () => {
    const client = makeMockClient({
      chat: async () => JSON.stringify({ decision: 'keep' }),
    })
    const r = await recheckLowRisk('微信没声音', LOW_CLASSIFICATION, client)
    assert.equal(r.decision, 'keep')
    assert.equal(r.source, 'fallback')
    assert.equal(r.reason, 'unparseable')
  })

  test('AI 抛错(网络/超时/HTTP 5xx) → fail-open', async () => {
    const client = makeMockClient({
      chat: async () => {
        throw new Error('DeepSeek timeout after 2000ms')
      },
    })
    const r = await recheckLowRisk('微信没声音', LOW_CLASSIFICATION, client)
    assert.equal(r.decision, 'keep')
    assert.equal(r.source, 'fallback')
    assert.equal(r.reason, 'error')
  })

  test('AI 抛非 Error 异常 → fail-open', async () => {
    const client = makeMockClient({
      chat: async () => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw 'string error'
      },
    })
    const r = await recheckLowRisk('微信没声音', LOW_CLASSIFICATION, client)
    assert.equal(r.decision, 'keep')
    assert.equal(r.source, 'fallback')
    assert.equal(r.reason, 'error')
  })
})

describe('recheckLowRisk — 不变量:永不抛出', () => {
  test('client.chat 抛同步异常也吞掉', async () => {
    const client: DeepSeekClient = {
      isEnabled: () => true,
      chat: () => {
        throw new Error('sync throw')
      },
    }
    // 关键断言:不抛
    const r = await recheckLowRisk('x', LOW_CLASSIFICATION, client)
    assert.equal(r.source, 'fallback')
  })
})
