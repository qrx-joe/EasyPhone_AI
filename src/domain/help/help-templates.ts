/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * HelpRequest 模板层。`buildHelpRequest(question)` 根据 question.risk.level
 * 选 summary + suggestions,生成 HelpRequest。
 *
 * ## 输入
 * - `question`: 必填,且 `question.risk.level !== 'low'`(否则抛错)
 *
 * ## 输出
 * - `HelpRequest`: createHelpRequest(question, summary, suggestions) 产物
 * - `SUGGESTIONS_BY_LEVEL`: 内部模板表(medium 3 条 / high 4 条 / critical 5 条)
 *
 * ## 定位
 * 关注点分离:**类型/工厂在 help-request.ts,模板策略在 help-templates.ts**。
 * M5 接 AI 改写 summary 时,只换这个文件,UI/工厂不动。
 *
 * ## 依赖
 * - `../risk/types.ts` 的 `RiskLevel`
 * - `../question/question.ts` 的 `QuestionRecord`
 * - `./help-request.ts` 的 `createHelpRequest` / `HelpRequest`
 *
 * ## 维护规则
 * - 按场景(scenario)细分建议的设计**当前不做**(参 help-templates.ts 顶部注释):
 *   模板按等级兜底,scenario 信息通过 `question.risk.reason` 已经在 summary 里体现。
 * - summary 兜底:`question.risk.reason` 为空时,降级为通用"遇到了需要您帮忙的事"。
 * - 改模板要更新对应的 `help.test.ts`(现有 12 个 case 覆盖)。
 */
/**
 * HelpRequest 模板层 —— 根据 question.risk 生成对应的 summary + suggestions。
 *
 * 这一层独立于 help-request.ts(类型 + 工厂),目的是:
 *   1. **关注点分离** —— 类型是契约,模板是策略,后续可能接 AI 生成
 *      (M5 把这个文件换掉就行,UI/工厂不动)。
 *   2. **可测试** —— summary 和 suggestions 是有规则的行为,不是数据。
 *   3. **可本地化** —— 后续要 i18n 时,只动这个文件,不动类型。
 *
 * 现阶段(M2)用规则模板;M5 可让 AI 改写 summary(同 docs/05 §3.3「AI 只做分类/改写」)。
 */

import type { RiskLevel } from '../risk/types.ts'
import type { QuestionRecord } from '../question/question.ts'
import { createHelpRequest, type HelpRequest } from './help-request.ts'

/**
 * 按风险等级兜底的建议(老人 + 家人通用版)。
 *
 * 为什么是「按等级兜底」而不是「按场景(scenario)分桶」:
 *   - 场景在 classify-risk 内部有 9 个(scenarioTag),
 *     但**给家人的建议并不需要这么细** —— 老人被骗时,家人的动作几乎都是同一套
 *     (问清楚、别转账、报警)。场景细分会导致 UI 上 9 套几乎重复的卡片。
 *   - 等级细分有意义:medium = 谨慎,high = 拒绝,critical = 立刻停下。
 *   - summary 部分会带上 scenario 的人话 reason(用 question.risk.reason),所以
 *     家人还是能看到「这是哪类问题」。
 */
const SUGGESTIONS_BY_LEVEL: Record<
  Exclude<RiskLevel, 'low'>,
  readonly string[]
> = {
  medium: [
    '先问清楚对方是谁、是哪家机构的',
    '不要在电话/短信里说验证码、密码、身份证号',
    '可以回拨对方声称的机构官方电话核实',
  ],
  high: [
    '不要转账、不要扫码、不要点链接',
    '不要告诉对方验证码、密码、身份证号',
    '把这个情况跟其他家人说一下,大家帮忙判断',
    '真有事就打 110 或 96110(反诈专线)',
  ],
  critical: [
    '立刻停下来,不要再操作手机',
    '不要转账、不要扫码、不要点链接、不要开屏幕共享',
    '不要告诉对方任何验证码、密码、身份证号',
    '马上把这件事告诉身边的家人',
    '真有事就打 110 或 96110(反诈专线)',
  ],
}

/**
 * 给定 question 生成 HelpRequest。
 *
 * - summary 优先用 question.risk.reason(关键词库已经写好的人话解释),
 *   兜底用「遇到了需要您帮忙的事」(防止 reason 为空时卡片白板)。
 * - suggestions 按风险等级从模板里取,critical 风险下加一条红色 CTA 强调。
 *
 * 抛错(同 createHelpRequest):
 *   - question.risk.level === 'low' 时抛错
 */
export function buildHelpRequest(question: QuestionRecord): HelpRequest {
  if (question.risk.level === 'low') {
    throw new Error(
      'buildHelpRequest: 低风险不应该生成 HelpRequest,走 /tutorial 路径',
    )
  }

  const summary = question.risk.reason || '遇到了需要您帮忙的事'
  const suggestions = SUGGESTIONS_BY_LEVEL[question.risk.level]

  return createHelpRequest(question, summary, suggestions)
}
