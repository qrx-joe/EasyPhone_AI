/**
 * 家人求助卡 —— 当 question 被分类为 high/critical 时,生成一张可以
 * 一键发给家人的求助卡。
 *
 * 设计原则(来自 docs/05 §3.4 数据最小化 + §3.1 安全优先):
 * 1. **不进卡片的内容** —— 验证码 / 银行卡号 / 身份证号 / 支付密码 / 通讯录 / 定位
 *    永不展示给家人(家人不需要这些去帮忙,只需要知道「发生了什么 + 该怎么帮」)。
 * 2. **summary 是给家人一句话懂的总结**,不是「系统检测到 critical 风险」黑话。
 * 3. **suggestions 是具体动作**,3-5 条,按风险等级递增。
 * 4. **低风险不生成 HelpRequest** —— 工厂函数会抛错,避免在低风险路径误用。
 * 5. 字段全 readonly,数据一旦生成不允许修改(防「卡片显示后又偷偷改」的安全漏洞)。
 */

import type { RiskLevel } from '../risk/types.ts'
import type { QuestionRecord } from '../question/question.ts'

export interface HelpRequest {
  readonly id: string
  /** 关联的原始问题。卡片需要回显老人说了什么,让家人能确认场景。 */
  readonly question: QuestionRecord
  readonly riskLevel: RiskLevel
  /** 一句话总结,给家人一眼看懂发生了什么事。 */
  readonly summary: string
  /** 给家人的具体动作建议,3-5 条。 */
  readonly suggestions: readonly string[]
  readonly createdAt: string
}

// ─────────────────────────────────────────────────────────────────────
// 工厂
// ─────────────────────────────────────────────────────────────────────

let helpCounter = 0

function genHelpId(): string {
  helpCounter += 1
  return `h-${Date.now().toString(36)}-${helpCounter.toString(36)}`
}

/**
 * 工厂函数:从 question + summary + suggestions 生成 HelpRequest。
 *
 * 抛错的情况(都是写代码漏的迹象,不该静默吞):
 *   - question.risk.level === 'low'    —— 不该给低风险生成求助卡
 *   - summary.trim() 为空              —— 卡片上没字等于没帮上忙
 *   - suggestions 为空数组              —— 没建议等于把问题甩给家人
 */
export function createHelpRequest(
  question: QuestionRecord,
  summary: string,
  suggestions: readonly string[],
): HelpRequest {
  if (question.risk.level === 'low') {
    throw new Error(
      'createHelpRequest: 低风险不需要生成求助卡(走 /tutorial 路径)',
    )
  }
  if (!summary.trim()) {
    throw new Error('createHelpRequest: summary 不能为空')
  }
  if (suggestions.length === 0) {
    throw new Error('createHelpRequest: 至少需要 1 条建议')
  }
  return Object.freeze({
    id: genHelpId(),
    question,
    riskLevel: question.risk.level,
    summary: summary.trim(),
    suggestions: Object.freeze([...suggestions]),
    createdAt: new Date().toISOString(),
  })
}
