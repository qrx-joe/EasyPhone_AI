/**
 * Smoke test —— 验证生产构建后所有关键路由能 200 渲染。
 *
 * 启动方式:
 *   pnpm build && pnpm start &
 *   node scripts/smoke.mjs
 *
 * 测试目标(覆盖 MVP 的 3 个 demo 场景 + 首页入口):
 *   - /                                          首页
 *   - /tutorial/demo?case=wechat                低风险 demo 1 → /confirm
 *   - /tutorial/demo?case=font                  低风险 demo 2 → /confirm
 *   - /risk-alert/demo?case=medical-sms         高风险 demo 1 → /risk-alert
 *   - /risk-alert/demo?case=public-security     高风险 demo 2 → /risk-alert
 *
 * 断言:
 *   1. HTTP 200
 *   2. HTML 包含预期关键文本(验证服务端真的渲染了)
 *
 * 不依赖:
 *   - 没用 puppeteer / playwright(零依赖,Node 24+ fetch 原生)
 *   - 没用第三方断言库(node:assert 就够)
 *
 * 对应 OpenPrd quality 门禁 `smoke`(必需,缺证据)。
 *
 * @typedef {object} Check
 * @property {string} url
 * @property {readonly string[]} expectAny
 * @property {boolean} [followRedirect]
 */

import assert from 'node:assert/strict'

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:3000'

/** @type {readonly Check[]} */
const CHECKS = [
  {
    url: '/',
    expectAny: ['爸妈别急', '您遇到什么问题'],
  },
  {
    url: '/tutorial/demo?case=wechat',
    expectAny: ['您是不是想解决', '微信没有声音'],
    followRedirect: true,
  },
  {
    url: '/tutorial/demo?case=font',
    expectAny: ['您是不是想解决', '手机字太小'],
    followRedirect: true,
  },
  {
    url: '/risk-alert/demo?case=medical-sms',
    expectAny: ['先别操作', '验证码', '停'],
    followRedirect: true,
  },
  {
    url: '/risk-alert/demo?case=public-security',
    expectAny: ['先别操作', '公安局', '停'],
    followRedirect: true,
  },
]

let passed = 0
let failed = 0

for (const check of CHECKS) {
  const fullUrl = BASE + check.url
  process.stdout.write(`  ${check.url} ... `)
  try {
    const res = await fetch(fullUrl, {
      redirect: check.followRedirect ? 'follow' : 'manual',
    })
    assert.equal(
      res.status,
      200,
      `expected 200, got ${res.status} for ${fullUrl}`,
    )
    const html = await res.text()
    const hit = check.expectAny.find((needle) => html.includes(needle))
    assert.ok(
      hit,
      `none of [${check.expectAny.join(', ')}] found in ${fullUrl} response (len=${html.length})`,
    )
    process.stdout.write(`✓ (matched "${hit}")\n`)
    passed++
  } catch (err) {
    process.stdout.write(`✗\n`)
    console.error(`    ${err instanceof Error ? err.message : String(err)}`)
    failed++
  }
}

console.log(`\nsmoke result: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  process.exit(1)
}
