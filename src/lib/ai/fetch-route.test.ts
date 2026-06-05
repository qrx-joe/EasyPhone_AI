/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * `fetchRoute` 单元测试 —— 锁住"服务端响应字段"runtime 校验。
 *
 * ## 输入
 * 通过 mock `globalThis.fetch` 注入不同形态的 Response(2xx/4xx + JSON 形态)
 *
 * ## 输出
 * node --test 跑过的 pass/fail 计数(本文件 ~6 case)
 *
 * ## 定位
 * 服务端 JSON 不可信:TypeScript 的 `as RouteDecision` 在 runtime 不存在,
 * 必须有 runtime 校验兜住脏数据(否则 `data.level = 'banana'` 会带着"安全"
 * 的类型穿过调用链,污染下游 /risk-alert 或 /confirm 的决策)。
 *
 * ## 关键不变量
 * 1. 缺失 href → throw
 * 2. level 不在白名单('low'|'medium'|'high'|'critical') → throw
 * 3. level 类型不是 string(如 number/object) → throw
 * 4. HTTP 非 2xx → throw(原本就有的行为)
 * 5. 合法响应 → 返回 RouteDecision
 *
 * ## 依赖
 * node:test + node:assert/strict;`./fetch-route.ts` 的 `fetchRoute`;
 * 临时覆盖 `globalThis.fetch`(afterEach 还原)。
 *
 * ## 维护规则
 * 服务端响应字段变了 → 同步改本测试 + `fetch-route.ts` 的 cast 形态。
 */

import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'

import { fetchRoute } from './fetch-route.ts'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

function mockFetch(impl: typeof fetch) {
  globalThis.fetch = impl
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('fetchRoute — happy path', () => {
  test('合法响应 → 返回 {href, level}', async () => {
    mockFetch(async () => jsonResponse(200, { href: '/confirm?text=hi', level: 'low' }))
    const r = await fetchRoute('hi')
    assert.equal(r.href, '/confirm?text=hi')
    assert.equal(r.level, 'low')
  })

  test('4 个合法 level 都能通过', async () => {
    for (const level of ['low', 'medium', 'high', 'critical'] as const) {
      mockFetch(async () => jsonResponse(200, { href: '/x', level }))
      const r = await fetchRoute('x')
      assert.equal(r.level, level)
    }
  })
})

describe('fetchRoute — runtime 校验', () => {
  test('缺失 href → throw', async () => {
    mockFetch(async () => jsonResponse(200, { level: 'low' }))
    await assert.rejects(() => fetchRoute('x'), /missing href/)
  })

  test('href 不是 string(比如 number) → throw', async () => {
    mockFetch(async () => jsonResponse(200, { href: 42, level: 'low' }))
    await assert.rejects(() => fetchRoute('x'), /missing href/)
  })

  test('level 不在白名单(脏数据 "banana") → throw', async () => {
    mockFetch(async () => jsonResponse(200, { href: '/x', level: 'banana' }))
    await assert.rejects(() => fetchRoute('x'), /invalid level: banana/)
  })

  test('level 不在白名单("unknown") → throw', async () => {
    mockFetch(async () => jsonResponse(200, { href: '/x', level: 'unknown' }))
    await assert.rejects(() => fetchRoute('x'), /invalid level: unknown/)
  })

  test('level 缺失 → throw', async () => {
    mockFetch(async () => jsonResponse(200, { href: '/x' }))
    await assert.rejects(() => fetchRoute('x'), /invalid level/)
  })

  test('level 不是 string(比如 number) → throw', async () => {
    mockFetch(async () => jsonResponse(200, { href: '/x', level: 2 }))
    await assert.rejects(() => fetchRoute('x'), /invalid level/)
  })

  test('level 是 null → throw', async () => {
    mockFetch(async () => jsonResponse(200, { href: '/x', level: null }))
    await assert.rejects(() => fetchRoute('x'), /invalid level/)
  })
})

describe('fetchRoute — HTTP 状态', () => {
  test('HTTP 500 → throw', async () => {
    mockFetch(async () => jsonResponse(500, { href: '/x', level: 'low' }))
    await assert.rejects(() => fetchRoute('x'), /HTTP 500/)
  })

  test('HTTP 400 → throw', async () => {
    mockFetch(async () => jsonResponse(400, { error: 'bad' }))
    await assert.rejects(() => fetchRoute('x'), /HTTP 400/)
  })
})
