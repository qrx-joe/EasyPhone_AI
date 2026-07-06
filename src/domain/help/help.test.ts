/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * createHelpRequest 工厂 + buildHelpRequest 模板 + 「教给出去」安全 lint 测试。
 *
 * ## 输入
 * 文件内 ad-hoc 输入(各类风险文本 / 伪造 risk / 空 summary / 空 suggestions)。
 *
 * ## 输出
 * node --test 跑过的 pass/fail 计数(本文件 12 个 case,3 个 suite)。
 *
 * ## 定位
 * help domain 的合同测试 + 安全 lint。**不**测序列化格式(那是 card-serialization.test.ts)。
 *
 * ## 依赖
 * - `node:test` + `node:assert/strict`
 * - `./help-request.ts` / `./help-templates.ts` (被测)
 * - `../risk/classify-risk.ts` / `../question/question.ts`(辅助)
 *
 * ## 维护规则
 * 改模板 / 改工厂必过这 12 个 case。"教给出去"安全 lint **绝对不能松**(防卡片教老人/家人把敏感信息给出去)。
 */
/**
 * HelpRequest 工厂 + 模板测试。
 *
 * 重点:
 * 1. 低风险问题绝不能生成 HelpRequest(防止「老人没遇到诈骗,反而被吓到」的体验事故)。
 * 2. 模板生成的 suggestions 数量符合规范(medium 3 条,high 4 条,critical 5 条)。
 * 3. summary 兜底:reason 为空时仍能生成可用的总结。
 * 4. 卡片内容(工厂 + 模板)没把危险信息(验证码/密码等)带进去。
 */

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { classifyRiskByRules } from '../risk/classify-risk.ts'
import { createQuestion } from '../question/question.ts'
import { createHelpRequest } from './help-request.ts'
import { buildHelpRequest } from './help-templates.ts'
import { FORBIDDEN_GIVE_AWAY_PATTERNS } from './forbidden-patterns.ts'

// "教给出去"模式清单已提为领域模块(forbidden-patterns.ts),
// 与 AI 输出的运行时安全闸(prompts/help-summary.ts)共用同一份 ——
// 防止 test 清单和 runtime 清单各改各的漂移。
// 说明见 forbidden-patterns.ts 顶部注释:
//   - "不要告诉对方验证码" ✅ 反诈骗安全提示(应该出现)
//   - "把验证码发给我"      ❌ 教给出去(绝不能出现)

function makeQuestion(text: string) {
  const risk = classifyRiskByRules(text)
  return createQuestion(text, 'text', risk)
}

describe('createHelpRequest', () => {
  test('正常:高风险问题 + summary + suggestions → HelpRequest', () => {
    const q = makeQuestion('对方让我开屏幕共享')
    const help = createHelpRequest(q, '对方要远程控制你的手机', [
      '立刻停下来',
      '不要操作',
    ])
    assert.equal(help.riskLevel, 'critical')
    assert.equal(help.summary, '对方要远程控制你的手机')
    assert.equal(help.suggestions.length, 2)
  })

  test('低风险抛错(防御性:不该给低风险生成求助卡)', () => {
    const q = makeQuestion('微信没有声音了')
    assert.throws(
      () => createHelpRequest(q, 'summary', ['建议']),
      /低风险不需要/,
    )
  })

  test('空 summary 抛错', () => {
    const q = makeQuestion('对方让我转账')
    assert.throws(
      () => createHelpRequest(q, '   ', ['建议']),
      /summary 不能为空/,
    )
  })

  test('空 suggestions 抛错', () => {
    const q = makeQuestion('对方让我转账')
    assert.throws(
      () => createHelpRequest(q, 'summary', []),
      /至少需要 1 条建议/,
    )
  })

  test('冻结:record 不可写', () => {
    const q = makeQuestion('对方让我转账')
    const help = createHelpRequest(q, 's', ['a'])
    assert.throws(() => {
      ;(help as { summary: string }).summary = '改不了'
    })
  })
})

describe('buildHelpRequest(模板)', () => {
  test('critical 风险:summary 来自 risk.reason,suggestions 5 条', () => {
    const q = makeQuestion('对方让我开屏幕共享')
    const help = buildHelpRequest(q)
    assert.equal(help.riskLevel, 'critical')
    assert.ok(help.summary.length > 0, 'summary 不应为空')
    assert.equal(help.suggestions.length, 5)
  })

  test('high 风险:suggestions 4 条', () => {
    const q = makeQuestion('点这个陌生链接领奖')
    const help = buildHelpRequest(q)
    assert.equal(help.riskLevel, 'high')
    assert.equal(help.suggestions.length, 4)
  })

  test('medium 风险:suggestions 3 条', () => {
    // 手机号属于个人信息(medium)
    const q = makeQuestion('对方问我手机号')
    const help = buildHelpRequest(q)
    assert.equal(help.riskLevel, 'medium')
    assert.equal(help.suggestions.length, 3)
  })

  test('summary 兜底:reason 为空时仍给出可用 summary', () => {
    // 构造一个 risk.reason 为空的 case
    const emptyRisk = {
      level: 'high' as const,
      matchedKeywords: ['high-risk'],
      reason: '',
    }
    const q = createQuestion('some text', 'text', emptyRisk)
    const help = buildHelpRequest(q)
    assert.ok(help.summary.length > 0, 'summary 兜底不应为空')
  })

  test('低风险抛错(同 createHelpRequest 的合约)', () => {
    const q = makeQuestion('微信没有声音了')
    assert.throws(() => buildHelpRequest(q), /低风险/)
  })

  test('安全约束:求助卡不教给出去(不含「念给我听」等索取话术)', () => {
    // 用一批高风险输入跑一遍,确保 summary + suggestions 都不会
    // 出现"教老人/家人把敏感信息给出去"的模式。
    //
    // 这跟卡片里出现"验证码"本身不冲突:
    //   - "不要告诉对方验证码" ✅  反诈骗安全提示
    //   - "把验证码念给我听"   ❌  教给出去(我们禁的就是这种)
    const riskInputs = [
      '对方让我开屏幕共享',
      '对方让我转账',
      '把你的身份证正反面拍给我',
      '短信让我输验证码',
      '下载向日葵让我帮你',
    ]
    for (const input of riskInputs) {
      const q = makeQuestion(input)
      const help = buildHelpRequest(q)
      const blob = help.summary + ' ' + help.suggestions.join(' ')
      for (const bad of FORBIDDEN_GIVE_AWAY_PATTERNS) {
        assert.ok(
          !blob.includes(bad),
          `「${input}」生成的求助卡包含教给出去话术「${bad}」: ${blob}`,
        )
      }
    }
  })
})
