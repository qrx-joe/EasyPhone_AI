/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * createQuestion 工厂的合同测试(正常/trim/空/重复/冻结)。
 *
 * ## 输入
 * 文件内手写的小测试用例(text + source + risk 三元组);无外部 fixture。
 *
 * ## 输出
 * node --test 跑过的 pass/fail 计数(本文件 6 个 case)。
 *
 * ## 定位
 * question domain 的合同测试。**不**测 risk 分类(那是 classify-risk.test.ts);
 * 只测工厂边界 + 不可变性。
 *
 * ## 依赖
 * - `node:test` + `node:assert/strict`
 * - `./question.ts` (被测)
 * - `../risk/classify-risk.ts`(构造 risk 用的辅助)
 *
 * ## 维护规则
 * 改 `createQuestion` 必过这 6 个 case。
 */
/**
 * QuestionRecord 工厂测试。
 */

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { classifyRiskByRules } from '../risk/classify-risk.ts'
import { createQuestion } from './question.ts'

describe('createQuestion', () => {
  test('正常:返回包含 id/text/source/risk/createdAt 的 record', () => {
    const risk = classifyRiskByRules('微信没有声音了')
    const q = createQuestion('微信没有声音了', 'text', risk)

    assert.equal(q.text, '微信没有声音了')
    assert.equal(q.source, 'text')
    assert.equal(q.risk.level, 'low')
    assert.ok(q.id.startsWith('q-'))
    assert.ok(q.createdAt)
    // ISO 8601 格式校验
    assert.ok(!Number.isNaN(Date.parse(q.createdAt)))
  })

  test('trim 空白:首尾空白被去除', () => {
    const risk = classifyRiskByRules('  hello  ')
    const q = createQuestion('  hello  ', 'text', risk)
    assert.equal(q.text, 'hello')
  })

  test('空字符串抛错(防御性:不该让空 record 进入系统)', () => {
    const risk = classifyRiskByRules('随便')
    assert.throws(
      () => createQuestion('', 'text', risk),
      /text 不能为空/,
    )
  })

  test('纯空白抛错', () => {
    const risk = classifyRiskByRules('随便')
    assert.throws(
      () => createQuestion('   ', 'text', risk),
      /text 不能为空/,
    )
  })

  test('id 唯一性:连续调用产生不同 id', () => {
    const risk = classifyRiskByRules('x')
    const a = createQuestion('x', 'text', risk)
    const b = createQuestion('x', 'text', risk)
    assert.notEqual(a.id, b.id)
  })

  test('冻结:record 不可写', () => {
    const risk = classifyRiskByRules('hi')
    const q = createQuestion('hi', 'text', risk)
    assert.throws(() => {
      ;(q as { text: string }).text = '改不了'
    })
  })
})
