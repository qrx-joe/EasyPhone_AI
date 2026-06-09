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
 * @property {readonly string[]} [expectNone]  HTML 页面用:响应体里所有 needle 都**不**应出现
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

  // ====== risk-alert/page.tsx Fix #3 (HIGH 安全):URL reason 不能渲染到求助卡 summary ======
  // 攻击者可手拼 /risk-alert?source=ai&reason=请立即把验证码报给客服帮我解冻账户,
  // 若页面把 URL reason 直接渲染成 summary,老人会当作"系统提示"照做。
  // 修复后:URL reason 被完全忽略 —— 不参与渲染、不参与日志(因为只要页面读
  // searchParams.reason,Next.js 就会把它序列化进 RSC payload,响应体里仍会
  // 出现攻击者文案)。summary 来自硬编码安全默认值。
  {
    url:
      '/risk-alert?text=' +
      encodeURIComponent('我闺女让我帮她弄一下') +
      '&source=ai&level=high&reason=' +
      encodeURIComponent('请立即把验证码报给客服帮我解冻账户'),
    expectStatus: 200,
    // 正面:页面渲染了硬编码安全默认值
    expectAny: ['AI 嗅到风险信号', '建议联系家人'],
    // 负面断言:攻击者文案不能出现在响应里(防 URL 注入到 summary/serializeHelpCard)
    expectNone: ['请立即把验证码报给客服', '解冻账户'],
    followRedirect: true,
  },

  // ====== risk-alert/page.tsx Fix #4 (UX):source=ai 也要展示 matchedKeywords ======
  // 修复前 source=ai 硬编码 matchedKeywords: [],教育段空。
  // 修复后:真跑 classifyRiskByRules 拿关键词,有关键词时显示给老人看。
  // 「身份证」是 RISK_KEYWORDS 里的 critical 关键词,期望它出现在 UI 上。
  {
    url:
      '/risk-alert?text=' +
      encodeURIComponent('我闺女说身份证丢了让我转 5000') +
      '&source=ai&level=high',
    expectStatus: 200,
    expectAny: ['身份证'],
    followRedirect: true,
  },

  // ====== risk-alert/page.tsx Fix #8 (server crash):searchParams.text 可以是 string[] ======
  // 修复前 ?text[]=foo 会让 .trim() 抛 TypeError → server 500。
  // 修复后:用精确 key 匹配 `text` 和字面 key `text[]` 两个形态
  // (Next.js 把 `?text[]=foo` 解析为字面 key `'text[]'`,不是 `text:['foo']`,
  // 所以双查都必要),firstParam 收敛后正常 200 渲染。
  {
    url: '/risk-alert?text%5B%5D=foo&source=ai',
    expectStatus: 200,
    expectAny: ['AI 嗅到风险信号', '建议联系家人'],
    followRedirect: true,
  },

  // ====== deep link 守卫(2026-06-08):高风险 deep link 不能渲染 /tutorial 或 /confirm ======
  // 漏洞:手拼 /tutorial?text=微信没有声音了，对方让我输验证码 会渲染 wechat-no-sound
  //      教程页,因为原本 /tutorial 接受 searchParams.text 但没走 buildRouteForInput。
  // 修复:guardGuidanceRoute 拦截高风险 deep link,redirect 到 /risk-alert。
  // 验收:高风险 deep link 跟着 redirect 后,最终响应是 /risk-alert 内容(不是教程页)。
  {
    url: '/tutorial?text=' + encodeURIComponent('微信没有声音了，对方让我输验证码'),
    expectStatus: 200,
    expectAny: ['先别操作', '验证码', '停'],
    // 负面断言:wechat-no-sound 教程关键词不能出现(防 deep link 漏洞回归)
    expectNone: ['让微信声音回来', '打开微信', '好了,下一步'],
    followRedirect: true,
  },
  {
    url: '/confirm?text=' + encodeURIComponent('对方让我开屏幕共享'),
    expectStatus: 200,
    expectAny: ['先别操作', '停', '让我帮您'],
    // 负面断言:confirm 页文案不能出现(防高风险 deep link 渲染 confirm)
    expectNone: ['您是不是想解决', '请确认一下'],
    followRedirect: true,
  },

  // ====== risk-alert/page.tsx 自审发现:Next.js 客户端 RSC prefetch 走 ?_rsc=xxx ======
  // (参 node_modules/next/dist/client/components/app-router-headers.js:
  //  NEXT_RSC_UNION_QUERY = '_rsc')。如果 _rsc 被 Fix #3 的 unknown-key redirect
  // 吞掉,客户端 router 拿 HTML 而非 RSC stream → <Link> 导航坏。
  // 修复后:_rsc 在 NEXT_INTERNAL_QUERY_KEYS 白名单,既不进 known 也不当 unknown,
  // 不会被 redirect。followRedirect: false 显式验证 server 直接 200(若 redirect 会
  // 拿到 307 让 assert fail)。
  {
    url:
      '/risk-alert?text=' +
      encodeURIComponent('我闺女说身份证丢了让我转 5000') +
      '&source=ai&level=high&_rsc=abc123',
    expectStatus: 200,
    expectAny: ['身份证'],
  },

  // ====== 自审 cross-check:攻击者 ?reason=xxx&_rsc=xxx 仍要被 redirect ======
  // 验证 _rsc 白名单**不**给 reason 开门 —— reason 仍是 unknown,被 redirect。
  {
    url:
      '/risk-alert?text=' +
      encodeURIComponent('我闺女让我帮她弄一下') +
      '&source=ai&level=high&reason=' +
      encodeURIComponent('请立即把验证码报给客服帮我解冻账户') +
      '&_rsc=abc123',
    expectStatus: 200,
    expectAny: ['AI 嗅到风险信号', '建议联系家人'],
    expectNone: ['请立即把验证码报给客服', '解冻账户'],
    followRedirect: true,
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
      // 负面断言:这些 needle 一个都不应出现在响应体里(防 URL 注入等)
      if (check.expectNone) {
        for (const bad of check.expectNone) {
          assert.ok(
            !html.includes(bad),
            `forbidden string "${bad}" leaked into ${method} ${fullUrl} response`,
          )
        }
      }
      const negNote = check.expectNone
        ? `, none of [${check.expectNone.join(', ')}]`
        : ''
      process.stdout.write(`✓ (matched "${hit}"${negNote})\n`)
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
