/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * `parseAiRecheckOutput` 单元测试 —— LLM 输出解析与 schema 校验。
 *
 * ## 输入
 * 文件内造的 LLM 原始字符串(有效 JSON / 无效 JSON / 缺字段 / 类型错 / reason 过长)
 *
 * ## 输出
 * node --test 跑过的 pass/fail 计数(本文件 12+ case,3 个 suite)
 *
 * ## 定位
 * 这是 LLM 输出最常见的失败点(幻觉 / 格式漂移),必须严格守住。
 * 单测覆盖所有 fail-open 路径。
 *
 * ## 依赖
 * node:test + node:assert/strict(同项目其他测试);`./risk-recheck.ts` 的 `parseAiRecheckOutput`。
 *
 * ## 维护规则
 * 改 parse 逻辑要补边界 case;漏一个 schema 失败模式 = 线上一次 fail-open 缺解释。
 */

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { parseAiRecheckOutput } from './risk-recheck.ts'

describe('parseAiRecheckOutput — 正常路径', () => {
  test('keep 决策', () => {
    const r = parseAiRecheckOutput(
      JSON.stringify({ decision: 'keep', reason: '系统操作类' }),
    )
    assert.deepEqual(r, { decision: 'keep', reason: '系统操作类' })
  })

  test('escalate 决策', () => {
    const r = parseAiRecheckOutput(
      JSON.stringify({ decision: 'escalate', reason: '嗅到诈骗模式' }),
    )
    assert.deepEqual(r, { decision: 'escalate', reason: '嗅到诈骗模式' })
  })

  test('reason 带前后空白,trim 后保留', () => {
    const r = parseAiRecheckOutput(
      JSON.stringify({ decision: 'keep', reason: '  微信设置  ' }),
    )
    assert.equal(r?.reason, '微信设置')
  })
})

describe('parseAiRecheckOutput — schema 失败', () => {
  test('非 JSON → null', () => {
    assert.equal(parseAiRecheckOutput('not json'), null)
  })

  test('空字符串 → null', () => {
    assert.equal(parseAiRecheckOutput(''), null)
  })

  test('数组 → null', () => {
    assert.equal(parseAiRecheckOutput('[]'), null)
  })

  test('null → null', () => {
    assert.equal(parseAiRecheckOutput('null'), null)
  })

  test('decision 字段缺失 → null', () => {
    assert.equal(
      parseAiRecheckOutput(JSON.stringify({ reason: 'x' })),
      null,
    )
  })

  test('decision 字段值非法 → null', () => {
    assert.equal(
      parseAiRecheckOutput(
        JSON.stringify({ decision: 'maybe', reason: 'x' }),
      ),
      null,
    )
  })

  test('reason 字段缺失 → null', () => {
    assert.equal(
      parseAiRecheckOutput(JSON.stringify({ decision: 'keep' })),
      null,
    )
  })

  test('reason 不是 string → null', () => {
    assert.equal(
      parseAiRecheckOutput(
        JSON.stringify({ decision: 'keep', reason: 123 }),
      ),
      null,
    )
  })

  test('reason 空字符串 → null', () => {
    assert.equal(
      parseAiRecheckOutput(
        JSON.stringify({ decision: 'keep', reason: '   ' }),
      ),
      null,
    )
  })
})

describe('parseAiRecheckOutput — reason 长度 cap', () => {
  test('超过 100 字截断到 100', () => {
    const long = '一'.repeat(150)
    const r = parseAiRecheckOutput(
      JSON.stringify({ decision: 'keep', reason: long }),
    )
    assert.ok(r)
    assert.equal(r.reason.length, 100)
  })
})
