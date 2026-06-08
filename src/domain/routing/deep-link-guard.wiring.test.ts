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
    // 关键:OPENPRD 说明书第 10 行有 "<ConfirmActions>" 提及(docstring),
    // 真实 JSX 是 "<ConfirmActions text=..."(后跟空白),用 \s 锚定排除 docstring 假阳性
    const actionsIdx = src.search(/<ConfirmActions\s/)
    assert.ok(guardIdx > 0, '先确保 guard 调用存在')
    assert.ok(actionsIdx > 0, '先确保 ConfirmActions 渲染存在')
    assert.ok(
      guardIdx < actionsIdx,
      `guard 调用必须在 ConfirmActions 之前,实际 guard@${guardIdx}, ConfirmActions@${actionsIdx}`,
    )
  })
})
