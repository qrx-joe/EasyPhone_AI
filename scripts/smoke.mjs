/**
 * @file Smoke test —— 验证生产构建后所有关键路由能 200 渲染 / 关键 API 端点契约。
 *
 * ## 核心功能
 * 用 Node 原生 fetch 跑 N 个 HTTP 断言,覆盖 PRD §13 的 3 个 demo 场景 + 首页 +
 * 真实流程路径 + 风险页 + M5 AI 兜底层 /api/route 端到端契约。失败时 exit 1,适合 CI gate。
 *
 * ## 输入
 * - 环境变量 `SMOKE_BASE` 可选,默认 `http://localhost:3000`
 * - 前提:`pnpm start` 已在 SMOKE_BASE 上跑起来(或任意等价生产构建)
 *
 * ## 输出
 * - stdout:`✓`/`✗` 行 + 末尾 `smoke result: N passed, M failed`
 * - 进程 exit code:`0`(全过)/ `1`(任一失败)
 *
 * ## 定位
 * 位于 `scripts/`(工程脚本目录),是 OpenPrd quality 门禁 `smoke` 的唯一证据源。
 * 不替代领域单元测试(`pnpm test`),只验证"生产构建 → HTTP 入口"这条链路没坏。
 *
 * ## 依赖
 * - 内部:无(纯黑盒 HTTP)
 * - 外部:`node:assert/strict`、`node:fetch`(Node 24+ 原生),零三方包
 *
 * ## 维护规则
 * - 每次新增/删除/重命名 App Router 页面或 API 端点,必须更新下方 `CHECKS` 数组
 * - 文案关键词(`expectAny`)/ 契约谓词(`expectJson`)随页面/端点调整时同步更新
 * - 改动后必须跑:`pnpm build && pnpm start & sleep 3 && node scripts/smoke.mjs`
 *
 * @typedef {object} Check
 * @property {string} url
 * @property {readonly string[]} [expectAny]  HTML 页面用:响应体里任一命中
 * @property {(data: unknown) => boolean} [expectJson]  API 用:JSON 响应契约谓词
 * @property {number} [expectStatus]  默认 200
 * @property {string} [method]  默认 GET
 * @property {Record<string, string>} [headers]  可选
 * @property {string} [body]  POST/PUT 用
 * @property {boolean} [followRedirect]  GET 页面用
 */

import assert from 'node:assert/strict'

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:3000'

/** @type {readonly Check[]} */
const CHECKS = [
  // ====== HTML 页面 ======
  // 首页
  {
    url: '/',
    expectAny: ['爸妈别急', '您遇到什么问题'],
  },
  // 真实流程路径(不经过 demo 直链)
  {
    url: '/tutorial?text=' + encodeURIComponent('微信没有声音了'),
    expectAny: ['让微信声音回来', '打开微信', '好了,下一步'],
  },
  {
    url: '/tutorial?text=' + encodeURIComponent('手机字太小看不清'),
    expectAny: ['把手机字变大', '设置', '好了,下一步'],
  },
  {
    url: '/confirm?text=' + encodeURIComponent('微信没有声音了'),
    expectAny: ['您是不是想解决', '微信没有声音了'],
  },
  // Demo 直链(给投资人/家人看)
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
  // 风险页真流程
  {
    url: '/risk-alert?text=' + encodeURIComponent('对方让我开屏幕共享'),
    expectAny: ['先别操作', '停', '让我帮您'],
  },

  // ====== M5 AI 兜底层 /api/route 端到端契约 ======
  // LOW 输入 → /confirm(AI 嗅 keep 或 fail-open,关键词保险丝定 low)
  {
    url: '/api/route',
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ text: '微信没声音' }),
    expectStatus: 200,
    expectJson: (data) =>
      typeof data === 'object' &&
      data !== null &&
      typeof data.href === 'string' &&
      data.href.startsWith('/confirm?') &&
      data.level === 'low',
  },
  // critical 关键词 → /risk-alert(critical,AI 不被调)
  {
    url: '/api/route',
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ text: '把验证码发我' }),
    expectStatus: 200,
    expectJson: (data) =>
      typeof data === 'object' &&
      data !== null &&
      typeof data.href === 'string' &&
      data.href.startsWith('/risk-alert?') &&
      (data.level === 'critical' || data.level === 'high'),
  },
  // 400 契约:text 字段缺失
  {
    url: '/api/route',
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({}),
    expectStatus: 400,
    expectJson: (data) =>
      typeof data === 'object' && data !== null && typeof data.error === 'string',
  },
  // 400 契约:text 不是 string
  {
    url: '/api/route',
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ text: null }),
    expectStatus: 400,
    expectJson: (data) =>
      typeof data === 'object' && data !== null && typeof data.error === 'string',
  },
  // 400 契约:非法 JSON
  {
    url: '/api/route',
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: 'not json',
    expectStatus: 400,
    expectJson: (data) =>
      typeof data === 'object' && data !== null && typeof data.error === 'string',
  },
  // 400 契约:body 是字面量 null(必须走 400,不能 500)
  {
    url: '/api/route',
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: 'null',
    expectStatus: 400,
    expectJson: (data) =>
      typeof data === 'object' && data !== null && typeof data.error === 'string',
  },
  // 400 契约:body 是 JSON 数组(不是 object)
  {
    url: '/api/route',
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: '[1,2,3]',
    expectStatus: 400,
    expectJson: (data) =>
      typeof data === 'object' && data !== null && typeof data.error === 'string',
  },
]

let passed = 0
let failed = 0

for (const check of CHECKS) {
  const fullUrl = BASE + check.url
  const method = check.method ?? 'GET'
  const expectedStatus = check.expectStatus ?? 200
  process.stdout.write(`  ${method} ${check.url} ... `)
  try {
    const res = await fetch(fullUrl, {
      method,
      headers: check.headers,
      body: check.body,
      redirect: check.followRedirect ? 'follow' : 'manual',
    })
    assert.equal(
      res.status,
      expectedStatus,
      `expected ${expectedStatus}, got ${res.status} for ${method} ${fullUrl}`,
    )

    if (check.expectJson) {
      const data = await res.json()
      assert.ok(
        check.expectJson(data),
        `JSON contract failed for ${method} ${fullUrl}: ${JSON.stringify(data).slice(0, 200)}`,
      )
      process.stdout.write(`✓ (json contract ok)\n`)
    } else {
      const html = await res.text()
      const hit = check.expectAny?.find((needle) => html.includes(needle))
      assert.ok(
        hit,
        `none of [${check.expectAny?.join(', ')}] found in ${method} ${fullUrl} response (len=${html.length})`,
      )
      process.stdout.write(`✓ (matched "${hit}")\n`)
    }
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
