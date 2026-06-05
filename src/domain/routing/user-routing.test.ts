/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * buildRouteForInput + routeToInput 的安全不变量测试(4 风险等级/URL 参数/兜底/Router 集成)。
 *
 * ## 输入
 * 文件内造的风险文本(各等级)+ fakeRouter({ push: () => void })(mock 注入)。
 *
 * ## 输出
 * node --test 跑过的 pass/fail 计数(本文件 12 个 case,4 个 suite)。
 *
 * ## 定位
 * routing domain 的**安全合同测试**。**不**测风险判断(那是 classify-risk.test.ts);
 * 只测"高风险绝不进 /confirm"这条安全不变量。
 *
 * ## 依赖
 * - `node:test` + `node:assert/strict`
 * - `./user-routing.ts` (被测)
 *
 * ## 维护规则
 * **改这个测试 = 改安全核心,必须 review**。12 个 case 锁住:
 *   - high/critical 绝不进 /confirm
 *   - 跳转永远带 text
 *   - 空文本兜底 '/'
 *   - 多关键词逗号拼接
 */
/**
 * buildRouteForInput 测试 —— 安全核心,所有 PR 必过。
 *
 * 重点:
 * 1. **安全不变量**:高风险输入绝不进 /confirm
 * 2. URL 参数完整(risk-alert 需要 level/keywords/reason)
 * 3. 空/纯空白文本兜底回首页
 * 4. 关键字逗号拼接(给 risk-alert 渲染 matched keywords 列表用)
 */

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { buildRouteForInput, routeToInput } from './user-routing.ts'

describe('buildRouteForInput — 安全不变量', () => {
  test('critical 风险(屏幕共享)→ /risk-alert,绝不进 /confirm', () => {
    const r = buildRouteForInput('对方让我开屏幕共享')
    assert.equal(r.level, 'critical')
    assert.ok(r.href.startsWith('/risk-alert?'), `应跳 /risk-alert,实际 ${r.href}`)
    assert.ok(!r.href.includes('/confirm'), '绝不能进 /confirm')
  })

  test('high 风险(陌生链接)→ /risk-alert', () => {
    const r = buildRouteForInput('点这个陌生链接领奖')
    assert.equal(r.level, 'high')
    assert.ok(r.href.startsWith('/risk-alert?'))
  })

  test('medium 风险(手机号)→ /confirm(中风险还需要二次确认)', () => {
    const r = buildRouteForInput('对方问我手机号')
    assert.equal(r.level, 'medium')
    assert.ok(r.href.startsWith('/confirm?'))
  })

  test('low 风险(微信没声音)→ /confirm', () => {
    const r = buildRouteForInput('微信没有声音了')
    assert.equal(r.level, 'low')
    assert.ok(r.href.startsWith('/confirm?'))
  })
})

describe('buildRouteForInput — URL 参数', () => {
  test('risk-alert 跳转带 level/keywords/reason 三个参数', () => {
    const r = buildRouteForInput('对方让我开屏幕共享')
    const params = new URL(r.href, 'http://x').searchParams
    assert.equal(params.get('text'), '对方让我开屏幕共享')
    assert.equal(params.get('level'), 'critical')
    assert.ok(params.get('keywords'))
    assert.ok(params.get('reason'))
  })

  test('confirm 跳转只带 text(risk 留给 /confirm 内部判断)', () => {
    const r = buildRouteForInput('微信没有声音了')
    const params = new URL(r.href, 'http://x').searchParams
    assert.equal(params.get('text'), '微信没有声音了')
    assert.equal(params.get('level'), null)
  })

  test('多关键词用逗号拼接', () => {
    const r = buildRouteForInput('我是公安局的,把钱转账到所谓的安全账户')
    const params = new URL(r.href, 'http://x').searchParams
    const keywords = (params.get('keywords') ?? '').split(',')
    assert.ok(keywords.length >= 2, `多关键词应拼接成长串,实际 ${keywords}`)
  })

  test('URL 编码:中文/空格/特殊字符不会破坏 URL', () => {
    const r = buildRouteForInput('"对方问我 验证码"')
    // 不抛错就是 OK —— 浏览器解析无误
    const params = new URL(r.href, 'http://x').searchParams
    assert.ok(params.get('text'))
  })
})

describe('buildRouteForInput — 兜底', () => {
  test('空字符串 → /', () => {
    const r = buildRouteForInput('')
    assert.equal(r.href, '/')
  })

  test('纯空白 → /', () => {
    const r = buildRouteForInput('   \t\n  ')
    assert.equal(r.href, '/')
  })
})

describe('routeToInput — Router 集成', () => {
  test('调用 router.push(buildRouteForInput 的 href)', () => {
    // `as` cast 突破 closure narrowing:TS 不会追踪 fakeRouter.push 里的赋值,
    // 如果显式标 `: string | null = null`,后续 pushed 会被 narrow 成 `null`,
    // `null?.startsWith(...)` 让链式访问推为 `never`。
    let pushed = null as string | null
    const fakeRouter = {
      push: (href: string) => {
        pushed = href
      },
    }
    routeToInput(fakeRouter, '微信没声音')
    assert.ok(pushed?.startsWith('/confirm?'))
  })

  test('空文本时 router.push("/")', () => {
    let pushed = null as string | null
    const fakeRouter = {
      push: (href: string) => {
        pushed = href
      },
    }
    routeToInput(fakeRouter, '')
    assert.equal(pushed, '/')
  })
})

describe('buildRouteForInput — classification 透传(PR #1 review #2)', () => {
  // PR #1 review finding #2:routeWithAiRecheck 之前会二次跑 `classifyRiskByRules`
  // 拿 matchedKeywords / reason。一旦分类器引入非确定性(缓存 / locale / 时间衰减),
  // 两次调用会得到不同结果,导致 AI 看到与路由决策不一致的分类。
  // 修复:`buildRouteForInput` 直接返回 classification,上游只跑一次。
  // 这两个测试锁住"返回值自带 classification,内容真实反映 classifyRiskByRules 输出"。

  test('critical 输入 → classification.matchedKeywords 包含"验证码"(同一份分类对象)', () => {
    const r = buildRouteForInput('把验证码发我')
    // 关键断言:classification 字段存在 + 包含真实命中词
    assert.ok(r.classification, '返回值必须带 classification 字段(PR #1 review #2 修复)')
    assert.equal(r.classification.level, 'critical')
    assert.ok(
      r.classification.matchedKeywords.includes('验证码'),
      `classification.matchedKeywords 应包含"验证码",实际 ${JSON.stringify(r.classification.matchedKeywords)}`,
    )
  })

  test('low 输入(微信没声音)→ classification.level === "low" 且无关键词命中', () => {
    const r = buildRouteForInput('微信没有声音了')
    assert.ok(r.classification, 'low 输入也必须带 classification 字段')
    assert.equal(r.classification.level, 'low')
    assert.deepEqual(
      r.classification.matchedKeywords,
      [],
      'low 输入应无关键词命中(回归空数组契约)',
    )
    assert.equal(r.classification.reason, '')
  })
})
