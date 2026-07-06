/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * `parseHelpSummaryOutput` 四道安全闸的单元测试 + prompt 构造器冒烟。
 *
 * ## 输入
 * 文件内 ad-hoc LLM 输出样例(合法 / 坏 JSON / 超长 / URL / 教给出去话术)。
 *
 * ## 输出
 * node --test pass/fail 计数。
 *
 * ## 定位
 * 形态 ③ 安全闸的合同测试。**安全闸用例只能加不能删**。
 *
 * ## 依赖
 * node:test + node:assert/strict;./help-summary.ts(被测)。
 *
 * ## 维护规则
 * forbidden-patterns.ts 加新模式时,在「教给出去」suite 补对应用例。
 */
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  buildHelpSummaryUserPrompt,
  parseHelpSummaryOutput,
} from './help-summary.ts'

describe('parseHelpSummaryOutput — 合法输出', () => {
  test('标准 JSON → 返回 trim 后的 summary', () => {
    const raw = JSON.stringify({
      summary: '  我收到一条短信说医保卡不能用了,让我点链接输验证码,我担心是骗子。  ',
    })
    const out = parseHelpSummaryOutput(raw)
    assert.ok(out)
    assert.equal(
      out.summary,
      '我收到一条短信说医保卡不能用了,让我点链接输验证码,我担心是骗子。',
    )
  })
})

describe('parseHelpSummaryOutput — 闸 1:JSON/类型', () => {
  test('非 JSON → null', () => {
    assert.equal(parseHelpSummaryOutput('先别急,这可能有风险'), null)
  })
  test('JSON 但缺 summary 字段 → null', () => {
    assert.equal(parseHelpSummaryOutput('{"text":"..."}'), null)
  })
  test('summary 不是 string → null', () => {
    assert.equal(parseHelpSummaryOutput('{"summary":123}'), null)
  })
  test('JSON 数组 → null', () => {
    assert.equal(parseHelpSummaryOutput('["a"]'), null)
  })
})

describe('parseHelpSummaryOutput — 闸 2:长度窗口', () => {
  test('太短(LLM 没理解任务)→ null', () => {
    assert.equal(parseHelpSummaryOutput('{"summary":"好的"}'), null)
  })
  test('超长(LLM 跑偏)→ null', () => {
    const long = '我'.repeat(161)
    assert.equal(parseHelpSummaryOutput(JSON.stringify({ summary: long })), null)
  })
  test('上限内(160 字)→ 通过', () => {
    const ok = '我'.repeat(160)
    assert.ok(parseHelpSummaryOutput(JSON.stringify({ summary: ok })))
  })
})

describe('parseHelpSummaryOutput — 闸 3:禁 URL', () => {
  test('含 http 链接 → null', () => {
    const raw = JSON.stringify({
      summary: '我收到短信让我打开 http://evil.example 这个网站,请帮我看看。',
    })
    assert.equal(parseHelpSummaryOutput(raw), null)
  })
  test('含 www. → null', () => {
    const raw = JSON.stringify({
      summary: '有人让我访问 www.某某网站 说可以领补贴,我不确定。',
    })
    assert.equal(parseHelpSummaryOutput(raw), null)
  })
})

describe('parseHelpSummaryOutput — 闸 4:禁「教给出去」话术', () => {
  test('「把验证码发」→ null(即使整体像正常求助)', () => {
    const raw = JSON.stringify({
      summary: '我收到短信,客服说把验证码发过去就能解冻账户,请帮我确认。',
    })
    assert.equal(parseHelpSummaryOutput(raw), null)
  })
  test('「念给我听」→ null', () => {
    const raw = JSON.stringify({
      summary: '对方说把收到的号码念给我听就可以帮我处理医保问题了。',
    })
    assert.equal(parseHelpSummaryOutput(raw), null)
  })
  test('反诈提示方向(「不要告诉对方验证码」)→ 合法通过', () => {
    const raw = JSON.stringify({
      summary: '我收到可疑短信要验证码,我没有告诉对方验证码,请帮我确认是不是骗子。',
    })
    assert.ok(parseHelpSummaryOutput(raw))
  })
})

describe('buildHelpSummaryUserPrompt', () => {
  test('包含老人原话与等级语气,关键词空时显式标注', () => {
    const p = buildHelpSummaryUserPrompt('闺女让我打钱', 'high', [])
    assert.ok(p.includes('闺女让我打钱'))
    assert.ok(p.includes('高('))
    assert.ok(p.includes('(无,由 AI 语义识别)'))
  })
  test('critical 语气 + 关键词逗号拼接', () => {
    const p = buildHelpSummaryUserPrompt('要开屏幕共享', 'critical', [
      '屏幕共享',
      '远程',
    ])
    assert.ok(p.includes('极高('))
    assert.ok(p.includes('屏幕共享, 远程'))
  })
})
