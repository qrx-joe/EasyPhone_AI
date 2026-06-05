/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * `tryConsume()` 单元测试 —— in-process rate limit + 日预算。
 *
 * ## 输入
 * - `__resetRateLimitStateForTests(now?)` 重置 state + 注入时间源
 * - `process.env.AI_RATE_LIMIT_PER_10MIN` / `AI_DAILY_BUDGET` 控制额度
 *
 * ## 输出
 * node --test 跑过的 pass/fail 计数(本文件 7+ case,3 个 suite)
 *
 * ## 定位
 * 锁住"成本/滥用护栏"的正确性。**漏一个 case = 成本可能失控**。
 *
 * ## 依赖
 * node:test + node:assert/strict;`./rate-limit.ts` 的 `tryConsume` / `snapshot`。
 *
 * ## 维护规则
 * 改默认值 = 改产品成本预算,需 review。改算法(滑窗 / 漏桶)要重写这些 case。
 */

import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, test } from 'node:test'

import {
  __resetRateLimitStateForTests,
  snapshot,
  tryConsume,
} from './rate-limit.ts'

let prevRate: string | undefined
let prevBudget: string | undefined

beforeEach(() => {
  prevRate = process.env.AI_RATE_LIMIT_PER_10MIN
  prevBudget = process.env.AI_DAILY_BUDGET
  delete process.env.AI_RATE_LIMIT_PER_10MIN
  delete process.env.AI_DAILY_BUDGET
  __resetRateLimitStateForTests()
})

afterEach(() => {
  if (prevRate === undefined) delete process.env.AI_RATE_LIMIT_PER_10MIN
  else process.env.AI_RATE_LIMIT_PER_10MIN = prevRate
  if (prevBudget === undefined) delete process.env.AI_DAILY_BUDGET
  else process.env.AI_DAILY_BUDGET = prevBudget
  __resetRateLimitStateForTests()
})

describe('tryConsume — 默认额度', () => {
  test('单次调用允许', () => {
    assert.equal(tryConsume(), true)
  })

  test('snapshot 返回当前用量', () => {
    tryConsume()
    tryConsume()
    const s = snapshot()
    assert.equal(s.usedInWindow, 2)
    assert.equal(s.usedToday, 2)
    assert.ok(s.limitPer10Min > 0)
    assert.ok(s.limitPerDay > 0)
  })
})

describe('tryConsume — 10 分钟窗口额度', () => {
  test('窗口内连续 N 次后第 N+1 次拒绝', () => {
    process.env.AI_RATE_LIMIT_PER_10MIN = '3'
    __resetRateLimitStateForTests()
    assert.equal(tryConsume(), true)
    assert.equal(tryConsume(), true)
    assert.equal(tryConsume(), true)
    assert.equal(tryConsume(), false) // 第 4 次被拒
  })

  test('时间过了窗口,旧记录被剔除', () => {
    process.env.AI_RATE_LIMIT_PER_10MIN = '2'
    let mockNow = 1_000_000
    __resetRateLimitStateForTests(() => mockNow)

    assert.equal(tryConsume(), true)
    assert.equal(tryConsume(), true)
    assert.equal(tryConsume(), false) // 满了

    // 跳到 11 分钟后
    mockNow += 11 * 60 * 1000
    assert.equal(tryConsume(), true) // 旧记录出窗口,新额度可用
  })
})

describe('tryConsume — 日预算', () => {
  test('超过日预算拒绝', () => {
    process.env.AI_RATE_LIMIT_PER_10MIN = '100'
    process.env.AI_DAILY_BUDGET = '2'
    __resetRateLimitStateForTests()

    assert.equal(tryConsume(), true)
    assert.equal(tryConsume(), true)
    assert.equal(tryConsume(), false) // 日预算满
  })

  test('跨日重置', () => {
    process.env.AI_DAILY_BUDGET = '1'
    let mockNow = 1_000_000
    __resetRateLimitStateForTests(() => mockNow)

    assert.equal(tryConsume(), true)
    assert.equal(tryConsume(), false) // 当日满

    // 跳到第二天
    mockNow += 24 * 60 * 60 * 1000
    assert.equal(tryConsume(), true) // 新一天
  })
})
