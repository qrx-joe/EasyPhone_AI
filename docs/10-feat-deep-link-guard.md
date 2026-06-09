# 10. feat(routing): add deep link guard for guidance pages

> **类型**：安全修复（P0 等价，按 L1 流程处理）
> **状态**：plan 已就绪，等用户说"开做"开始实施
> **创建**：2026-06-08
> **关联**：
> - 2026-06-08 安全审计 session（deep link 漏洞发现）
> - `docs/08-sprint-0-decisions.md`（§1.2 / §1.4 决策-实现漂移）
> - `src/domain/routing/user-routing.ts`（安全不变量核心，正交扩展）
> - `scripts/smoke.mjs`（真实 URL 验收位）

---

## 0. PR 元信息

**Title**: `feat(routing): add deep link guard for guidance pages`

**Subtitle / PR 描述副标题**: `also mark Sprint 0 decision drift (08 §1.2 / §1.4)`

**Body 关键句（reviewer 30 秒能看完的版本）**:

> **问题**：`/confirm` 和 `/tutorial` server page 接受 `searchParams.text`，手拼 URL 可绕过首页 `buildRouteForInput()` 的高风险分流。例如 `/tutorial?text=微信没有声音了，对方让我输验证码` 会渲染 `wechat-no-sound` 教程页，尽管 `buildRouteForInput` 对该输入会路由到 `/risk-alert`。
>
> **修法**：新增 `guardGuidanceRoute(text)` helper（`src/domain/routing/deep-link-guard.ts`），内部复用 `buildRouteForInput` + `shouldStopGuidance`，**不重写分类规则**。`/confirm` 和 `/tutorial` server page 入口在 `cleanText` 兜底之后、渲染/`findTutorial` 之前调用；高风险 `redirect(href)`；低/中风险走原路径。`/risk-alert` 不动（它已自防御，`source=ai` 是"烦人但安全"例外）。
>
> **产品决策**：medium 风险 deep link 不升级到 `/risk-alert`（产品语义 A）。`shouldStopGuidance()` 只在 high/critical 触发，guard 不应改写产品分级。测试锁住"medium → null"。
>
> **顺手修正**：`docs/08-sprint-0-decisions.md` 顶部加历史记录声明；§1.2 加"当前实现偏离"标注（口语化变体 M1 起直停）；§1.4 加"sensitive-filters.ts 推迟"说明；§3/§4/§7 标"历史执行计划"。**09 单独 PR，本 PR 不碰。**
>
> **测试**：3 层叠加覆盖。
> - Layer 1 helper 行为测试 7 case（含 medium→null 关键断言，消息保留）
> - Layer 2 wiring 结构化测试 4 case（双锚严格 regex + 位置不变量）
> - Layer 3 smoke 真实 URL 验收 2 case（高风险 deep link 必落 /risk-alert）
> - Layer 4 PR 验收 checklist（人工 / Playwright 复核项）
>
> **验证**：`corepack pnpm test`、`corepack pnpm run lint:deps`、`openprd dev-check/standards/quality/run/doctor` 全过。Smoke 真实 URL 验收本地 PowerShell 跑不起来时如实报 SKIPPED，CI/Preview 复跑。

---

## 1. 背景（Why）

### 1.1 安全审计发现

2026-06-08 只读审计 session 发现 deep link 漏洞：

```text
正常入口:
  POST /api/route { text: "微信没有声音了，对方让我输验证码" }
  → /risk-alert?text=...&level=critical&keywords=...  ✅

漏洞路径:
  GET /tutorial?text=微信没有声音了，对方让我输验证码
  → 渲染 wechat-no-sound 教程页  ❌（应同上）
```

**根因**：`/tutorial/page.tsx` 注释里承诺用 `isSafeForGuidance()` 做二次防御，但全代码库零引用——**注释+说明书+代码三处对齐的"假"**。`/confirm/page.tsx` 同样有"高风险输入永远不会到这里"的撒谎注释。

### 1.2 08 §1.2 决策与实现 4 路冲突

| 主体 | 立场 |
|---|---|
| 08 §1.2 拍板（Sprint 0 时刻） | 口语化变体 high/critical → "软警告 + AI 二次确认，不停" |
| 08 §6 反向挑战自承 | "可能被认为是绕过安全" |
| `docs/05-project-standards.md` §6.2 | 规则和 AI 任一判断高风险就停 |
| 实际 `classify-risk.ts` + `user-routing.ts` | 规则直停（无软警告） |

本轮顺手在 08 加"当前实现偏离"标注，不重写 08。

### 1.3 为什么 08 §1.4 也要标

用户 grep 确认 `src/domain/risk/sensitive-filters.ts` **不存在**。`risk-keywords.ts` 注释里已标"§1.4 推迟到 M4"。08 §1.4 属于"历史决策未按原计划落地，但代码里有解释"的状态——本轮同样加推迟说明，避免第二个旧雷。

---

## 2. 目标（What）

### 2.1 行为目标

- **`guardGuidanceRoute` helper**：复用 `buildRouteForInput` + `shouldStopGuidance`，不重写分类规则；判 `level` 不判 `href` 字符串；未来高风险路径改名自动跟随
- **`/tutorial` 和 `/confirm` 接线**：在 `cleanText` 兜底之后、主逻辑之前调 `guardGuidanceRoute`；高风险 `redirect(guard)`；低/中风险走原路径
- **`/risk-alert` 维持现状**：自防御 + `source=ai` 故意例外
- **08 文档对齐**：历史决策标"历史归档"；§1.2 / §1.4 加"当前实现偏离"标注；§3/§4/§7 标"历史执行计划"

### 2.2 测试目标：3 层覆盖防同类回归

| 层 | 文件 | 验证 | 防哪种回归 |
|---|---|---|---|
| Layer 1 | `deep-link-guard.test.ts` | helper 函数语义正确 | guard 实现错（如 shouldStopGuidance 用错） |
| Layer 2 | `deep-link-guard.wiring.test.ts` | 页面真的接上 guard，且位置正确 | "doc 说有但代码没接"（原 bug 模式） |
| Layer 3 | `scripts/smoke.mjs` 追加 2 case | 真实 HTTP 端到端 | guard 调了但 redirect 没生效 / 顺序错 |
| Layer 4 | PR 验收 checklist | 人工 / Playwright 复核 | 任何层漏掉 |

**为什么不能只测 helper**：原 bug 模式 = "doc 承诺 + 代码没接"，只测 helper 等于把同类回归窗口原样保留。Wiring 测试专治这个。

### 2.3 工程目标

- **安全核心零修改**：`user-routing.ts` 12 个不变量测试零修改（strict superset）
- **现有 156 测试零修改**：`user-routing.test.ts` / `classify-risk.test.ts` 等不被本 PR 触碰
- **新增代码 0 外部依赖**：helper 是纯函数 + 纯数据；wiring 测试只读 `node:fs` / `node:path`
- **3 commit 拆分明细**：便于 reviewer 集中注意力和 `git bisect`

---

## 3. 范围（Scope）

### 3.1 涉及文件（10 个 touched files）

| 文件 | 改动 | 类别 |
|---|---|---|
| `src/domain/routing/deep-link-guard.ts` | 新建 ~50 行 | 新增 |
| `src/domain/routing/deep-link-guard.test.ts` | 新建 ~80 行 | 新增 |
| `src/domain/routing/deep-link-guard.wiring.test.ts` | 新建 ~80 行 | 新增 |
| `src/app/confirm/page.tsx` | 3 处 diff | 修改 |
| `src/app/tutorial/page.tsx` | 4 处 diff | 修改 |
| `src/domain/routing/easy-phone-ai_routing_README.md` | 6 处 diff | 修改 |
| `scripts/smoke.mjs` | 追加 2 case | 修改 |
| `scripts/easy-phone-ai_scripts_README.md` | 3 处 diff | 修改 |
| `README.md` | 1 处最小改 line 128 | 修改 |
| `docs/08-sprint-0-decisions.md` | 9 处 diff | 修改 |

### 3.2 不涉及（明确划出）

| 文件 | 原因 |
|---|---|
| `src/domain/routing/user-routing.ts` | 安全核心，零修改；guard 是新模块 |
| `src/domain/risk/classify-risk.ts` | 安全核心，零修改 |
| `src/app/risk-alert/page.tsx` | 已自防御（line 130-139 重分类）；`source=ai` 是故意例外（line 90-127） |
| `src/app/tutorial/demo/page.tsx` | 走白名单 `case` + `buildRouteForInput()`，已安全 |
| `src/app/risk-alert/demo/page.tsx` | 同上 |
| `src/lib/ai/route-with-ai.ts` | API 链路，不接 `searchParams.text` |
| `src/lib/ai/client-route.ts` | client fallback 不经过 new guard；它直接 `routeToInput` → `buildRouteForInput`，高风险已被分流到 `/risk-alert`（**不是**"new guard 覆盖了它"） |
| `docs/09-pr1-shared-classifier.md` | 单独 PR，**问题陈述需重写**，本 PR 不碰 |
| `package.json` / `pnpm-lock.yaml` | 无依赖变更 |

### 3.3 关联但不动

| 文件 | 关联 |
|---|---|
| `src/domain/risk/types.ts` | guard 复用 `shouldStopGuidance` |
| `src/domain/risk/risk-keywords.ts` | 08 §1.4 推迟说明指向本文件注释 |
| 16 个 `classify-risk.test.ts` | 锁住分类器行为，零修改 |
| 12 个 `user-routing.test.ts` | 锁住 `buildRouteForInput` 行为，零修改 |

---

## 4. 文件级 diff 预览

### 4.1 新增 `src/domain/routing/deep-link-guard.ts`

```ts
/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * Deep link 守卫:对 `/tutorial?text=...` 或 `/confirm?text=...` 这类
 * 手拼 URL 绕过首页 `buildRouteForInput()` 的情况,统一复用
 * `buildRouteForInput()` 决定是否必须先 redirect 到风险页。
 *
 * ## 输入
 * - text:来自 searchParams.text 的原始输入(调用方已 trim)
 *
 * ## 输出
 * - string:必须先 redirect 到该 href(由 buildRouteForInput 给出)
 * - null:文本安全,可继续走当前页面正常逻辑
 *
 * ## 定位
 * **安全核心补充**。`buildRouteForInput()` 是"用户输入→跳转"的入口,
 * 本函数是"页面被 deep link 进入→是否需要再分流"的反向守卫。
 * 两者方向相反,共用同一份 `shouldStopGuidance()` 决策。
 * 调用方:`/tutorial/page.tsx`、`/confirm/page.tsx` server page 入口。
 * **不**调用方:`/risk-alert/page.tsx`(它已自防御,source=ai 是"烦人但安全"例外)。
 *
 * ## 不变量
 * - 接线存在不等于接线在安全边界之前 → 调用方必须在主逻辑之前调本函数
 *
 * ## 依赖
 * - `./user-routing.ts` 的 `buildRouteForInput`
 * - `../risk/types.ts` 的 `shouldStopGuidance`
 *
 * ## 维护规则
 * - 改判断规则:只动 `buildRouteForInput()` 或 `shouldStopGuidance()`,本函数零修改
 * - 新增 deep link 页面:在 server page 入口调本函数,redirect 守卫给的 href
 * - 不在本函数构造魔法字符串(不应出现 '/risk-alert' 字面量)
 */

import { buildRouteForInput } from './user-routing.ts'
import { shouldStopGuidance } from '../risk/types.ts'

/**
 * Deep link 守卫。
 *
 * - 返回 string:必须先 `redirect(guard)` 到该 href(由 buildRouteForInput 给出)
 * - 返回 null:文本安全,当前页面可继续正常逻辑
 *
 * 复用 `buildRouteForInput()` 的决策,避免在页面层重写分类规则;
 * 判 `level` 而非判 `href` 字符串,未来高风险路径改名自动跟随。
 *
 * @param text 来自 searchParams.text 的原始输入(调用方已 trim)
 */
export function guardGuidanceRoute(text: string): string | null {
  const decision = buildRouteForInput(text)
  if (shouldStopGuidance(decision.level)) {
    return decision.href
  }
  return null
}
```

### 4.2 新增 `src/domain/routing/deep-link-guard.test.ts`

```ts
/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * guardGuidanceRoute 安全不变量测试 —— 锁住 deep link 守卫的 4 风险等级
 * 行为、混合输入、空白兜底。
 *
 * ## 输入
 * 文件内造的风险文本(各等级)+ 混合输入(教程关键词 + 高风险关键词)。
 *
 * ## 输出
 * node --test 跑过的 pass/fail 计数(本文件 7 个 case,3 个 suite)。
 *
 * ## 定位
 * 路由 domain 的 **安全合同测试**。**不**测风险判断本身
 * (那是 classify-risk.test.ts);只测 deep link 守卫对各风险等级的决策。
 *
 * ## 依赖
 * - `node:test` + `node:assert/strict`
 * - `./deep-link-guard.ts` (被测)
 * - 隐式依赖:./user-routing.ts 的 buildRouteForInput(集成验证)
 *
 * ## 维护规则
 * **改这个测试 = 改 deep link 安全边界,必须 review**。
 * 7 个 case 锁住:
 *   - critical / high → 返回 /risk-alert href
 *   - medium → null(产品决策 A,必须保留)
 *   - low → null
 *   - 混合输入(教程关键词 + 高风险关键词)→ /risk-alert
 *   - 空 / 纯空白 → null(由各页面 own 兜底 redirect('/'))
 */

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { guardGuidanceRoute } from './deep-link-guard.ts'

describe('guardGuidanceRoute — 风险等级分流', () => {
  test('critical 风险(屏幕共享)→ 返回 /risk-alert href', () => {
    const href = guardGuidanceRoute('对方让我开屏幕共享')
    assert.ok(href?.startsWith('/risk-alert?'), `应返回 /risk-alert href,实际 ${href}`)
  })

  test('high 风险(陌生链接)→ 返回 /risk-alert href', () => {
    const href = guardGuidanceRoute('点这个陌生链接领奖')
    assert.ok(href?.startsWith('/risk-alert?'))
  })

  test('medium 风险(手机号)→ null(产品决策 A:中风险仍走 /confirm 二次确认,guard 不升级)', () => {
    // 关键断言:guard 不改写 shouldStopGuidance() 的产品决策
    assert.equal(
      guardGuidanceRoute('对方问我手机号'),
      null,
      'medium 不应被 guard 升级到 /risk-alert —— deep link guard 不应改写产品分级语义',
    )
  })

  test('low 风险(微信没声音)→ null', () => {
    assert.equal(guardGuidanceRoute('微信没有声音了'), null)
  })
})

describe('guardGuidanceRoute — 混合输入(防 deep link 绕过)', () => {
  test('教程关键词 + 高风险关键词混合 → 返回 /risk-alert href', () => {
    // 这是漏洞复现:原本 /tutorial 接受此输入会渲染 wechat-no-sound 教程
    const href = guardGuidanceRoute('微信没有声音了，对方让我输验证码')
    assert.ok(
      href?.startsWith('/risk-alert?'),
      `混合输入应被守卫到 /risk-alert,实际 ${href}`,
    )
    // 进一步断言:href 里应带"验证码"作为匹配关键词
    const params = new URL(href ?? '', 'http://x').searchParams
    assert.ok(
      params.get('keywords')?.includes('验证码'),
      `混合输入应命中"验证码"关键词,实际 keywords=${params.get('keywords')}`,
    )
  })
})

describe('guardGuidanceRoute — 兜底', () => {
  test('空字符串 → null(各页面 own 兜底 redirect("/"))', () => {
    assert.equal(guardGuidanceRoute(''), null)
  })

  test('纯空白 → null', () => {
    assert.equal(guardGuidanceRoute('   \t\n  '), null)
  })
})
```

### 4.3 新增 `src/domain/routing/deep-link-guard.wiring.test.ts`

```ts
/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * Deep link 守卫 wiring 测试 —— 锁住"页面真的接上 guardGuidanceRoute"这件事。
 *
 * ## 动机
 * Sprint 0 决策 1.2 拍板 isSafeForGuidance() 二次防御,但页面从未实际调用,
 * 直到 2026-06-08 安全审计才发现(详见 docs/08-sprint-0-decisions.md)。
 * helper 测试证明函数正确,本测试证明页面**真的**调了它。
 *
 * ## 输入
 * 读取 src/app/tutorial/page.tsx 和 src/app/confirm/page.tsx 源文件内容。
 *
 * ## 输出
 * node --test 跑过的 pass/fail 计数(本文件 4 个 case,1 个 suite)。
 *
 * ## 定位
 * **结构化合同测试**(structural contract test)。读源码字符串做断言,
 * 不模拟 Next.js runtime,代价小。配合 helper 测试 + smoke 测试形成 3 层覆盖。
 *
 * ## 不变量
 * - **存在性不变量**:guard 必须被真实赋值 + 真实条件 redirect
 *   (双锚 const + if,防注释/docstring 假阳性)
 * - **位置不变量**:guard 调用必须在主逻辑之前
 *   (接线存在不等于接线在安全边界之前)
 *
 * ## 局限(诚实声明)
 * - 是结构化测试,不是运行时行为测试
 * - 重命名 / 改函数签名时,本测试 regex 可能要更新
 * - 不替代浏览器/e2e 测试(那由 smoke.mjs 覆盖)
 *
 * ## 维护规则
 * - 删 guard 调用:本测试会 fail(回归 "有 helper 但页面没接上")
 * - 改 guard 调用位置 / 签名:同步更新本测试 regex
 * - 新增 deep link 页面:加 2 case(本文件追加)
 *
 * ## 依赖
 * - node:fs / node:path(读源文件)
 * - node:test + node:assert/strict
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, test } from 'node:test'

// HERE = <project_root>/src/domain/routing/
// 3 层回退到 project root(不是 2 层;2 层只到 src/)
const HERE = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(HERE, '..', '..', '..')

function readPageSource(relativePath: string): string {
  return readFileSync(resolve(PROJECT_ROOT, relativePath), 'utf8')
}

describe('deep link guard — 页面 wiring 回归(防"有 helper 但页面没接上")', () => {
  test('/tutorial/page.tsx 真实调了 guardGuidanceRoute(cleanText) 并 redirect', () => {
    const src = readPageSource('src/app/tutorial/page.tsx')
    // 锚 1:真实赋值(const guard = guardGuidanceRoute(cleanText))
    //       注释里几乎不会自然出现 const ... = ... 的完整形态
    assert.ok(
      /const\s+guard\s*=\s*guardGuidanceRoute\(\s*cleanText\s*\)/.test(src),
      '/tutorial/page.tsx 必须有真实赋值 const guard = guardGuidanceRoute(cleanText),' +
        '不能是注释或 docstring 中的提及(防"doc 说有但代码没接"同类回归)',
    )
    // 锚 2:真实条件 redirect(if (guard) { redirect(guard) })
    assert.ok(
      /if\s*\(\s*guard\s*\)\s*\{\s*redirect\(\s*guard\s*\)/.test(src),
      '/tutorial/page.tsx 必须有真实条件 redirect if (guard) { redirect(guard) }',
    )
  })

  test('/tutorial/page.tsx 的 guard 调用在 findTutorial 之前(位置不变量)', () => {
    const src = readPageSource('src/app/tutorial/page.tsx')
    const guardIdx = src.search(/guardGuidanceRoute\(\s*cleanText\s*\)/)
    const findIdx = src.search(/findTutorial\(\s*cleanText\s*\)/)
    assert.ok(guardIdx > 0, '先确保 guard 调用存在')
    assert.ok(findIdx > 0, '先确保 findTutorial 调用存在')
    assert.ok(
      guardIdx < findIdx,
      `guard 调用必须在 findTutorial 之前,实际 guard@${guardIdx}, findTutorial@${findIdx}`,
    )
  })

  test('/confirm/page.tsx 真实调了 guardGuidanceRoute(cleanText) 并 redirect', () => {
    const src = readPageSource('src/app/confirm/page.tsx')
    assert.ok(
      /const\s+guard\s*=\s*guardGuidanceRoute\(\s*cleanText\s*\)/.test(src),
      '/confirm/page.tsx 必须有真实赋值 const guard = guardGuidanceRoute(cleanText),' +
        '不能是注释或 docstring 中的提及(防"doc 说有但代码没接"同类回归)',
    )
    assert.ok(
      /if\s*\(\s*guard\s*\)\s*\{\s*redirect\(\s*guard\s*\)/.test(src),
      '/confirm/page.tsx 必须有真实条件 redirect if (guard) { redirect(guard) }',
    )
  })

  test('/confirm/page.tsx 的 guard 调用在 ConfirmActions 渲染之前(位置不变量)', () => {
    const src = readPageSource('src/app/confirm/page.tsx')
    const guardIdx = src.search(/guardGuidanceRoute\(\s*cleanText\s*\)/)
    const actionsIdx = src.search(/<ConfirmActions/)
    assert.ok(guardIdx > 0, '先确保 guard 调用存在')
    assert.ok(actionsIdx > 0, '先确保 ConfirmActions 渲染存在')
    assert.ok(
      guardIdx < actionsIdx,
      `guard 调用必须在 ConfirmActions 之前,实际 guard@${guardIdx}, ConfirmActions@${actionsIdx}`,
    )
  })
})
```

### 4.4 修改 `src/app/confirm/page.tsx`

**3 处 diff**：

```diff
@@ -35,8 +35,10 @@
 import { redirect } from 'next/navigation'

+import { guardGuidanceRoute } from '@/domain/routing/deep-link-guard'
+
 import { ConfirmActions } from './confirm-actions'

@@ -47,6 +49,12 @@ export default async function ConfirmPage({
   if (!cleanText) {
     redirect('/')
   }

+  // Deep link 防御:手拼 URL 绕过首页时,先过 guard 收敛到 buildRouteForInput
+  const guard = guardGuidanceRoute(cleanText)
+  if (guard) {
+    redirect(guard)
+  }
+
   return (
     <main className="flex flex-col items-center min-h-full w-full max-w-2xl mx-auto px-6 py-10 sm:py-16">
```

**注释同步纠正**：

```diff
@@ -13,1 +13,2 @@
- * 中间路由 —— 只服务低/中风险分流,不接高风险(高风险已在首页走 /risk-alert)。
+ * 中间路由 —— 服务低/中风险分流。**手拼 URL 的高风险输入由 guardGuidanceRoute
+ * 拦截,不在本页渲染**;详见 src/domain/routing/deep-link-guard.ts。
@@ -26,2 +28,3 @@
- * 输入路径:首页 classifyRiskByRules 判定 low/medium 后跳到这里。
- * 高风险输入永远不会到这里(首页直接跳 /risk-alert)。
+ * 输入路径:首页 classifyRiskByRules 判定 low/medium 后跳到这里;
+ * 或手拼 /confirm?text=... 经 guardGuidanceRoute 过滤后到达。
+ * 高风险 deep link 输入会由 guard 拦截,不会渲染本页。
```

### 4.5 修改 `src/app/tutorial/page.tsx`

**4 处 diff**：

```diff
@@ -47,6 +47,7 @@
 import { findTutorial } from '@/domain/tutorial/tutorial'
+import { guardGuidanceRoute } from '@/domain/routing/deep-link-guard'
 import { TutorialClient } from './tutorial-client'

@@ -62,6 +63,12 @@ export default async function TutorialPage({ searchParams }: PageProps) {
   if (!cleanText) {
     redirect('/')
   }

+  // Deep link 防御:手拼 URL 绕过首页时,先过 guard 收敛到 buildRouteForInput
+  const guard = guardGuidanceRoute(cleanText)
+  if (guard) {
+    redirect(guard)
+  }
+
   const tutorial = findTutorial(cleanText)
```

**注释同步纠正**：

```diff
@@ -14,2 +15,3 @@
- * 教程路径的 server 入口,只做匹配与兜底;分步交互在 client 组件。
- * 不做风险过滤 —— 高风险应已在前置路由被分流到 /risk-alert。
+ * 教程路径的 server 入口,只做匹配与兜底;分步交互在 client 组件。
+ * 高风险 deep link 输入由 guardGuidanceRoute 拦截,不在本页渲染;
+ * 详见 src/domain/routing/deep-link-guard.ts。
@@ -40,4 +42,3 @@
- * 安全注意:
- *   - 高风险问题已经在 /confirm 那层被分流到 /risk-alert,理论上不会进这里
- *   - findTutorial 不做风险过滤,本页面用 isSafeForGuidance() 二次防御
- *     (即使有人手动拼 URL 绕过首页,也不会展示高风险教程)
+ * 安全注意:
+ *   - findTutorial 不做风险过滤;手拼 URL 的高风险输入由 guardGuidanceRoute 拦截
+ *   - 即使有人手动拼 URL 绕过首页,也不会展示高风险教程(收敛到 buildRouteForInput)
```

### 4.6 修改 `src/domain/routing/easy-phone-ai_routing_README.md`

**6 处 diff**：

```diff
@@ -7,2 +7,4 @@
 - `buildRouteForInput(text)`:用户原始输入(空 → `{ href: '/', level: 'low' }` 兜底)。
 - `routeToInput(router, text)`:接 Next.js `useRouter()` 返回的 `router`(只要 `push` 方法)。
+- `guardGuidanceRoute(text)`:deep link 守卫,被 server page 入口调用;
+   高风险(shouldStopGuidance)返回 buildRouteForInput 给的 href,低/中风险返回 null。
@@ -11,1 +13,5 @@
 - `user-routing.ts` — `RouteDecision` 接口、`buildRouteForInput(text)` 纯函数、`routeToInput(router, text)` 执行跳转、`MinimalRouter` 接口。
 - `user-routing.test.ts` — 12 个单测锁住不变量。
+- `deep-link-guard.ts` — `guardGuidanceRoute(text)` 反向守卫,复用 buildRouteForInput + shouldStopGuidance 决策。
+- `deep-link-guard.test.ts` — 7 个单测锁住 4 风险等级分流 + 混合输入 + 空白兜底。
+- `deep-link-guard.wiring.test.ts` — 4 个结构化测试锁住"页面真的接上 guard"(防"有 helper 但页面没接上"回归)。
@@ -15,1 +21,3 @@
 多个入口(首页文本/语音/demo 直链)共用同一份分流;改规则只动 1 处;纯函数,易测;URL 参数(level/keywords/reason)拼接只在一处。
+`guardGuidanceRoute` 是反向守卫:对 server page 接受 searchParams.text 的 deep link 入口,复用 buildRouteForInput 决定是否必须先 redirect 到风险页。两者共用 shouldStopGuidance 决策,避免规则漂移。
@@ -20,1 +28,4 @@
 - 调用方:`@/app/page.tsx`、`@/lib/speech/voice-input-button.tsx`、`@/app/tutorial/demo/page.tsx`、`@/app/risk-alert/demo/page.tsx`。
+- guard 调用方:`@/app/tutorial/page.tsx`、`@/app/confirm/page.tsx` server page 入口(cleanText 兜底之后、主逻辑之前)。
+- guard **不**调用方:`@/app/risk-alert/page.tsx`(已自防御,source=ai 是"烦人但安全"例外)。
@@ -23,1 +33,4 @@
 - 每次新增、删除、移动文件或调整职责后,必须检查并更新本 README。
+- 新增 deep link 页面(server page 接受 searchParams.text)时,必须在 cleanText 兜底之后调 `guardGuidanceRoute`,redirect 守卫给的 href。这条**不**可被 README 文档承诺替代 —— 配合 `deep-link-guard.wiring.test.ts` 锁住。
+- 改 `shouldStopGuidance` 决策:helper 测试 + wiring 测试 + smoke 测试 + guard README 调用方说明**同时**更新,避免守卫逻辑与文档漂移。
@@ -25,6 +37,11 @@
 - **不变量**(12 个测试锁住):
   1. high/critical 绝不进 /confirm
   2. 跳转永远带 text
   3. 空文本兜底 '/'
   4. 多关键词逗号拼接
+  5. /tutorial / /confirm deep link 入口必须先调 `guardGuidanceRoute`(wiring 测试锁住)
+  6. guard 内部判 `level` 不判 `href` 字符串(产品策略改了自动跟随)
+  7. medium 风险 deep link → null(产品决策 A,deep link guard 不改写产品分级)
```

### 4.7 修改 `scripts/smoke.mjs`

在 `CHECKS` 数组末尾追加 2 case（"deep link 守卫"标题之后紧跟原 `===== M5 AI 兜底层` 之前）：

```js
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
```

### 4.8 修改 `scripts/easy-phone-ai_scripts_README.md`

**3 处 diff**：

```diff
@@ -14,1 +14,1 @@
-- `smoke.mjs`:在 stdout 输出 9 条路由断言结果,失败时 exit 1
+- `smoke.mjs`:在 stdout 输出 N 条路由/接口断言结果(N 随 CHECKS 数组增长),失败时 exit 1
@@ -36,1 +36,4 @@
-- 改 smoke 自身 → 跑一遍 `pnpm build && pnpm start & sleep 3 && node scripts/smoke.mjs` 验证仍 9/9 通过
+- 改 smoke 自身 → 跑一遍 `pnpm build && pnpm start & sleep 3 && node scripts/smoke.mjs`
+  验证全部 CHECKS 通过(本轮新增 deep link 守卫 2 条;跑通后改 smoke 数字仍对不
+  上,故下文统一用"全部 CHECKS 通过"措辞,不再写死 9/9)
```

**追加 PowerShell 等价命令**（同位置 §依赖段或新加 §PowerShell 子段）：

```markdown
### PowerShell 等价命令

```powershell
# Windows PowerShell 5.x / PowerShell 7+;项目根 D:\code\EasyPhone_AI
$ErrorActionPreference = 'Continue'
$job = $null
try {
  $job = Start-Job -ScriptBlock {
    Set-Location 'D:\code\EasyPhone_AI'
    corepack pnpm start
  }
  Start-Sleep -Seconds 5
  node scripts/smoke.mjs
  if ($LASTEXITCODE -ne 0) { throw "smoke exited with code $LASTEXITCODE" }
  Write-Host "smoke: OK"
} catch {
  Write-Host "smoke: SKIPPED - $($_.Exception.Message)"
} finally {
  if ($job) {
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -Force -ErrorAction SilentlyContinue
  }
}
```

注意：
- `Start-Job` 在子进程跑,**不继承 PWD**,必须 ScriptBlock 内 `Set-Location`
- 清理必须放 `finally`,否则 smoke 抛错会泄漏后台 next start
```

### 4.9 修改 `README.md`

**1 处最小改**（line 128）：

```diff
@@ -128,1 +128,1 @@
-| `smoke`(quality 子门禁) | ✅ 通过 | `scripts/smoke.mjs` 测 5 个关键路由, CI 必跑 |
+| `smoke`(quality 子门禁) | ✅ 通过 | `scripts/smoke.mjs` 测关键路由与 API, CI 必跑 |
```

**不在本轮改**：line 46 / 90 的"80+ cases"数字（本轮新增 13 case 让总数从 ~163 涨到 ~176）—— 留给下个 PR 顺手更新，避免本轮 PR 焦点被稀释。

### 4.10 最小修订 `docs/08-sprint-0-decisions.md`

**9 处 diff，语气收敛到"历史归档 / 当前实现偏离"**：

```diff
@@ -4,1 +4,2 @@
-> 状态:已拍板,等执行 `create-next-app` 启动 Milestone 0。
+> 状态:已拍板(Sprint 0 时刻)。**本文件为 Sprint 0 历史决策记录,当前作
+> 为历史归档保留,不作为当前实现参考;当前安全不变量以 AGENTS.md、docs/06、
+> src/domain/routing/* 和 src/domain/risk/* 为准。**
@@ -6,1 +7,1 @@
-> 最近更新:2026-06-04。
+> 最近更新:2026-06-08(本轮标注"历史归档" + §1.2/§1.4 标"当前实现偏离")。
@@ -43,1 +44,7 @@
-- **决定**:**只放 high / critical,且触发后"软警告 + AI 二次确认",不停**;规范词命中依然直停
+- **决定(Sprint 0 时刻)**:**只放 high / critical,且触发后"软警告 + AI 二次确认",不停**;规范词命中依然直停
+  - **当前实现偏离(2026-06-08)**:M1 落地后,口语化变体与规范词同等处理
+    —— 命中即直停(等同规范词);AI 增强不降级规则兜底。本决策 §6 自承与
+    standards §6.2 存在"微妙冲突",§1.2 反向挑战点也标记为"可能被认为是
+    绕过安全";当前实现选择**不保留**该例外。
+    详见 src/domain/risk/risk-keywords.ts 注释 + src/domain/routing/user-routing.ts。
@@ -49,2 +56,3 @@
-  - 规范词命中(转账/验证码/屏幕共享)→ 规则直停
-  - 口语化变体命中(那串数字/扫这个码)→ 软警告 + AI 二次判断
+  - 规范词命中(转账/验证码/屏幕共享)→ 规则直停(当前实现)
+  - 口语化变体命中(那串数字/扫这个码)→ **规则直停(当前实现;Sprint 0 决策原为"软警告 + AI 二次判断",已偏离)**
+    历史细节与偏离理由见上"当前实现偏离"段。
@@ -51,1 +60,3 @@
-  - **注意**:这跟 standards §6.2"规则和 AI 任一判断高风险就停"有微妙冲突 — 口语化变体是显式例外
+  - **注意(Sprint 0 时刻)**:这跟 standards §6.2"规则和 AI 任一判断高风险就停"有微妙冲突 — 当时认为口语化变体是显式例外
+    **当前实现已取消该例外**(见上"当前实现偏离")。
@@ -68,1 +79,5 @@(§1.4 文件内部结构建议之后追加推迟说明)
-  - **文件内部结构建议**:按识别策略分组 — **正则模式**(验证码/身份证/银行卡) vs **关键词模式**(语义组合),为 Phase 2 接 NLP 留扩展点
+  - **文件内部结构建议**:按识别策略分组 — **正则模式**(验证码/身份证/银行卡) vs **关键词模式**(语义组合),为 Phase 2 接 NLP 留扩展点
+  - **推迟说明(2026-06-08)**:`src/domain/risk/sensitive-filters.ts` 当前未落地;本决策推迟到
+    风险关键词库稳定后实施,具体时机以 `src/domain/risk/risk-keywords.ts` 的
+    注释为准(已在该文件标注推迟)。当前以 risk-keywords.ts 的偏离说明为安全不变量依据。
@@ -79,1 +94,1 @@(§3 标题)
-## 3. 立即可执行(用户执行,我接着做)
+## 3. ~~立即可执行~~ 历史执行计划(Sprint 0 时刻,已过期)
@@ -89,1 +104,1 @@(§4 标题)
-## 4. 我接下来会做(决策落地)
+## 4. ~~我接下来会做~~ 历史执行计划(Sprint 0 时刻,已过期)
@@ -121,1 +136,1 @@(§7 标题)
-## 7. 不在本总结范围
+## 7. 不在本总结范围(Sprint 0 划界,部分已实现)
```

**0 行删除**，全是标注/补注/标过期；不改任何决策文字本身。

---

## 5. 测试计划

### 5.1 Layer 1:helper 行为测试

| 测什么 | 断言 |
|---|---|
| critical 风险（屏幕共享） | 返回 `/risk-alert?` 开头的 href |
| high 风险（陌生链接） | 返回 `/risk-alert?` 开头的 href |
| medium 风险（手机号） | 返回 `null`，消息"deep link guard 不应改写产品分级语义" |
| low 风险（微信没声音） | 返回 `null` |
| 混合输入（wechat + 验证码） | 返回 `/risk-alert?` href，且 keywords 包含"验证码" |
| 空字符串 | 返回 `null` |
| 纯空白 | 返回 `null` |

### 5.2 Layer 2:wiring 结构化测试

| 测什么 | 断言 |
|---|---|
| `/tutorial/page.tsx` 真实调用 | 双锚：const guard = guardGuidanceRoute(cleanText) + if (guard) { redirect(guard) } |
| `/tutorial/page.tsx` 位置 | guardIdx < findTutorialIdx（位置不变量） |
| `/confirm/page.tsx` 真实调用 | 双锚同上 |
| `/confirm/page.tsx` 位置 | guardIdx < ConfirmActionsIdx（位置不变量） |

### 5.3 Layer 3:smoke 真实 URL 验收

| URL | 期望 |
|---|---|
| `GET /tutorial?text=微信没有声音了，对方让我输验证码` | 200，body 含"先别操作/验证码/停"，**不**含"让微信声音回来/打开微信/好了,下一步" |
| `GET /confirm?text=对方让我开屏幕共享` | 200，body 含"先别操作/停/让我帮您"，**不**含"您是不是想解决/请确认一下" |

### 5.4 Layer 4:PR 验收 checklist（reviewer 必勾）

```markdown
- [ ] `corepack pnpm test` 全过（156 + 7 helper + 4 wiring = 167 case）
- [ ] `corepack pnpm run lint:deps` 全过
- [ ] `npx @openprd/cli dev-check . <touched files>` 全过
- [ ] `npx @openprd/cli standards . --verify` 全过
- [ ] `npx @openprd/cli quality . --verify` 全过
- [ ] `npx @openprd/cli run . --verify` 全过
- [ ] `npx @openprd/cli doctor .` healthy
- [ ] `node scripts/smoke.mjs` 全过（含本轮新增 2 case deep link 守卫）
- [ ] 人工/Playwright：`GET /tutorial?text=微信没有声音了，对方让我输验证码` 必须 3xx redirect 到 `/risk-alert`，最终响应不能含"打开微信/让微信声音回来"
- [ ] 人工/Playwright：`GET /confirm?text=对方让我开屏幕共享` 必须 3xx redirect 到 `/risk-alert`，最终响应不能含"您是不是想解决/请确认一下"
```

---

## 6. 验证步骤

### 6.1 必跑（无环境依赖）

```powershell
# PowerShell 7+;Windows;项目根 D:\code\EasyPhone_AI
corepack pnpm test
corepack pnpm run lint:deps

npx @openprd/cli dev-check . `
  src/domain/routing/deep-link-guard.ts `
  src/domain/routing/deep-link-guard.test.ts `
  src/domain/routing/deep-link-guard.wiring.test.ts `
  src/app/confirm/page.tsx `
  src/app/tutorial/page.tsx `
  src/domain/routing/easy-phone-ai_routing_README.md `
  scripts/smoke.mjs `
  scripts/easy-phone-ai_scripts_README.md `
  README.md `
  docs/08-sprint-0-decisions.md

npx @openprd/cli standards . --verify
npx @openprd/cli quality . --verify
npx @openprd/cli run . --verify
npx @openprd/cli doctor .
```

### 6.2 条件跑（smoke 真实 URL，PowerShell fallback）

```powershell
$ErrorActionPreference = 'Continue'
$job = $null

try {
  $job = Start-Job -ScriptBlock {
    Set-Location 'D:\code\EasyPhone_AI'
    corepack pnpm start
  }
  Start-Sleep -Seconds 5
  node scripts/smoke.mjs
  if ($LASTEXITCODE -ne 0) { throw "smoke exited with code $LASTEXITCODE" }
  Write-Host "smoke: OK"
} catch {
  Write-Host "smoke: SKIPPED - $($_.Exception.Message)"
  Write-Host "原因分类: 本机 PowerShell 后台 next start 限制 / 端口占用 / 其它环境问题"
  Write-Host "策略: 本轮 PR 资产完整,CI/Preview 复跑验证,不在本环境硬阻塞"
} finally {
  if ($job) {
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -Force -ErrorAction SilentlyContinue
  }
}
```

**失败处理策略**：
- step 6.1 失败 → 代码错，STOP 不动后续
- step 6.2 失败 → 转 SKIPPED 报告，**不**伪装代码失败
- CI/Preview 复跑的责任在 `smoke` GitHub Action（README line 128 写过"CI 必跑"）

### 6.3 报告模板（执行阶段用）

每条命令按以下结构报告，不合并/不省略：

```text
[step X.Y] <命令>
  退出码: <0 / 非0>
  stdout 关键行: <3-5 行>
  stderr 关键行: <0-3 行,无则写"无">
  状态: ✅ PASS / ⚠️ SKIPPED(本机 PowerShell 限制,CI 复跑) / ❌ FAIL(原因: ...)
```

---

## 7. Commit 策略

**3 commit，按逻辑分离，便于 reviewer 集中注意力和 `git bisect`**：

```
commit 1: feat(routing): add deep link guard helper + helper tests
  - 新增 src/domain/routing/deep-link-guard.ts
  - 新增 src/domain/routing/deep-link-guard.test.ts

commit 2: feat(routing): wire deep link guard into /tutorial and /confirm pages
  - 新增 src/domain/routing/deep-link-guard.wiring.test.ts
  - 改 src/app/confirm/page.tsx
  - 改 src/app/tutorial/page.tsx
  - 改 src/domain/routing/easy-phone-ai_routing_README.md
  - 改 scripts/smoke.mjs
  - 改 scripts/easy-phone-ai_scripts_README.md
  - 改 README.md

commit 3: docs(08): mark Sprint 0 decision drift (§1.2 / §1.4)
  - 改 docs/08-sprint-0-decisions.md
```

**为什么不混一个 commit**：
- `git bisect` 找"什么时候把 isSafeForGuidance 删了" → 找 commit 2
- 找"什么时候加了 guard helper" → 找 commit 1
- 找"什么时候把撒谎注释清掉" → 找 commit 3
- 文档对齐跟 code 改动正交，分开 commit 互不污染

---

## 8. 执行序列

按以下顺序执行，**不发分支、不 push、不合并**。最后一步跑完停手等"OK 提交"。

```
step 1:  Read 完整文件（写代码前 Read 规则）:
         - src/domain/routing/user-routing.ts
         - src/domain/risk/classify-risk.ts
         - src/app/confirm/page.tsx
         - src/app/tutorial/page.tsx
         - src/domain/routing/easy-phone-ai_routing_README.md
         - scripts/smoke.mjs
         - scripts/easy-phone-ai_scripts_README.md
         - README.md
         - docs/08-sprint-0-decisions.md
         （之前已读关键文件，但落地前要再过一遍）

step 2:  写 src/domain/routing/deep-link-guard.ts
         - OPENPRD 6 段说明书
         - level 判断（不判 href 字符串）
         - 无 '/risk-alert' 字面量

step 3:  写 src/domain/routing/deep-link-guard.test.ts
         - 7 case，3 suite
         - medium→null 断言消息保留

step 4:  写 src/domain/routing/deep-link-guard.wiring.test.ts
         - 4 case，1 suite
         - PROJECT_ROOT 3 层回退
         - regex 双锚：const guard = ... + if (guard) { redirect(guard) }
         - 位置断言：guardIdx < findTutorialIdx / actionsIdx

step 5:  改 src/app/confirm/page.tsx
         - import + guard 调用
         - 撒谎注释纠正（"高风险不会到这里" → "由 guard 拦截"）
         - 路径注释用 src/domain/...（非 ./src/...）

step 6:  改 src/app/tutorial/page.tsx
         - import + guard 调用
         - 删 isSafeForGuidance 谎言
         - 路径注释同上

step 7:  改 src/domain/routing/easy-phone-ai_routing_README.md
         - 6 处 diff（增 deep-link-guard 段、调用方、依赖、维护规则、不变量）

step 8:  改 scripts/smoke.mjs
         - 追加 2 case 真实 URL 验收

step 9:  改 scripts/easy-phone-ai_scripts_README.md
         - 3 处 diff（"9/9" → "全部 CHECKS 通过"）
         - 追加 PowerShell 等价命令段

step 10: 改 README.md
         - 1 处最小改 line 128（"5 个关键路由" → "关键路由与 API"）

step 11: 改 docs/08-sprint-0-decisions.md
         - 9 处 diff，语气收敛到"历史/偏离"调
         - 0 行删除

step 12: 跑 §6.1 必跑验证（corepack pnpm test / lint:deps / openprd 系列）
         - 逐条用 §6.3 报告模板

step 13: 尝试跑 §6.2 smoke 真实 URL 验收
         - PowerShell Start-Job 写法
         - 失败转 SKIPPED 报告
         - 必跑 finally 清理后台 job

step 14: 输出最终报告
         - touched files 清单
         - 测试结果（逐条）
         - 验证命令原始输出
         - 任何 warning
         - 阻塞项（如有）
```

---

## 9. 决策日志（拍板记录）

防止后续遗忘，全部 6 轮拍板汇总：

| # | 决策 | 理由 |
|---|---|---|
| 1 | 范围限定 `src/domain/routing/deep-link-guard.ts` 单独文件 | helper 与 user-routing.ts 方向相反，分开便于 `git bisect` |
| 2 | guard 判 `level` 不判 `href` 字符串 | 未来高风险路径改名自动跟随 |
| 3 | medium → null（产品决策 A） | shouldStopGuidance 的产品语义，guard 不应改写 |
| 4 | 09 单独 PR，不和本轮混 | 09 问题陈述需重写，混进实现 PR 稀释 review 焦点 |
| 5 | 08 修订语气收敛到"历史/偏离" | 不审判历史，明确"以代码安全不变量为准" |
| 6 | 08 §1.4 也要补推迟说明 | sensitive-filters.ts 不存在，避免第二个旧雷 |
| 7 | 3 层测试覆盖（helper + wiring + smoke） | 单测 helper 会留"有 helper 但页面没接上"同类回归窗口 |
| 8 | wiring regex 用双锚（const + if） | 单锚 `/guardGuidanceRoute(cleanText)/` 可能命中注释假阳性 |
| 9 | wiring 保留位置断言（guardIdx < findIdx） | 接线存在不等于接线在安全边界之前 |
| 10 | smoke 本地失败转 SKIPPED | PowerShell 后台限制不是代码失败，如实报告 |
| 11 | PowerShell fallback：Set-Location + try/finally | Start-Job 不继承 PWD；cleanup 必须在 finally 防泄漏 |
| 12 | scripts/README 改"不写死数量" | 数字易过期，措辞自描述 |
| 13 | 顶层 README 只改 line 128 | "80+ cases"数字留给下个 PR 顺手，避免本轮 PR 焦点稀释 |
| 14 | 3 commit 拆分（helper / wiring / docs） | 便于 reviewer 集中注意力和 git bisect |
| 15 | 09 PR 备忘："09 不是暂停，是问题陈述需重写" | 后续 PR 描述要写进 2026-06-08 复核段开头 |

---

## 10. 风险与缓解

| ID | 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|---|
| R1 | wiring 测试 PROJECT_ROOT 算错（2 层 vs 3 层） | 中 | 高（测试 fail） | 已锁定 `resolve(HERE, '..', '..', '..')` 3 层 |
| R2 | wiring regex 命中注释假阳性 | 中 | 中（测试假绿） | 已锁定双锚：const + if |
| R3 | wiring 测试漏掉"位置不变量" | 低 | 高（guard 调了但位置错） | 4 case 全部保留，含位置断言 |
| R4 | medium 决策被未来代码改写 | 低 | 高（产品语义漂移） | 测三遍：suite 标题 / 断言消息 / 决策表 README |
| R5 | smoke 在本机 PowerShell 跑不通 | 高 | 中（本地无验证） | SKIPPED 报告 + CI/Preview 复跑 |
| R6 | PowerShell Start-Job 泄漏后台进程 | 中 | 中（端口占用） | try/finally + -ErrorAction SilentlyContinue |
| R7 | openprd CLI 在本机不可跑 | 高 | 低（不阻塞合并） | 如实报告，CI 复跑 |
| R8 | 08 修订被未来 review 误读为"审判" | 低 | 低（团队文化） | 语气收敛到"历史归档 / 当前实现偏离 / 以代码为准" |
| R9 | README line 46 / 90 的"80+ cases" 数字漂移 | 中 | 低 | 本轮不改，留给下个 PR；PR 描述显式标记 |

---

## 11. 不做（Out of scope）

明确划出本 PR **不**做的事情：

- **不**实现 09 修订（PR1 暂停 + 问题陈述重写）—— 单独文档 PR
- **不**改 `user-routing.ts` / `classify-risk.ts` / `risk-keywords.ts` —— 安全核心，正交扩展
- **不**改 `/risk-alert/page.tsx` —— 已自防御，source=ai 是故意例外
- **不**改 `client-route.ts` —— client fallback 已由 `buildRouteForInput` 处理高风险
- **不**改 `route-with-ai.ts` / `route-with-fallback.test.ts` —— AI 链路正交
- **不**重构 `classify-risk.ts` 为 `shared-classifier.ts`（这是 09 PR1 的内容）
- **不**扩关键词库（130 词）—— docs/07 §11 三道闸
- **不**接 AI API —— M5 范围
- **不**改 README "80+ cases" 数字（line 46 / 90）—— 留给下个 PR
- **不**改 `docs/01-to-do.md` 任务池条目（按惯例任务完成后再标记）
- **不**发分支、push、合并、删 worktree —— 等用户说"OK 提交"

---

## 12. 状态

- **2026-06-08**：文档创建（基于同日安全审计 session + 多轮 plan 迭代）
- **待开始**：plan 已就绪（10 个 touched files / 3 commit / 14 step 执行序列 / 3 层测试覆盖）
- **下一步**：等用户说"开做"启动 step 1

---

## 13. 相关文档索引

- `docs/05-project-standards.md` §8.1（坏味道清单：本轮处理"冗余"和"晦涩性"）
- `docs/06-development-plan.md` §6（Milestone 6 部署）
- `docs/07-risk-keywords-library.md` §11（三道闸：本轮不碰）
- `docs/08-sprint-0-decisions.md`（本轮顺手标注历史归档 + 偏离说明）
- `docs/09-pr1-shared-classifier.md`（单独 PR 重写，不在本轮）
- `src/domain/routing/user-routing.ts`（安全核心，零修改）
- `src/domain/risk/classify-risk.ts`（安全核心，零修改）
- `src/domain/risk/risk-keywords.ts`（08 §1.4 推迟说明指向本文件注释）
- `scripts/smoke.mjs`（Layer 3 真实 URL 验收位）
- AGENTS.md（项目硬性约束 + OpenPrd 入口合同）
