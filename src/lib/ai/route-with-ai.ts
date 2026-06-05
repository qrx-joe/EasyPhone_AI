/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * `routeWithAiRecheck(text)` —— 在 `buildRouteForInput()` 之上叠加 AI 兜底复检。
 *
 * ## 输入
 * - `text`: 用户原始输入(已由调用方读取)
 *
 * ## 输出
 * `RouteDecision`:`{ href, level }` —— 与 `buildRouteForInput()` 形态一致。
 *
 * ## 定位
 * **形态 ① 落地点**:关键词保险丝 → AI 复检(仅 LOW)→ 最终路由。
 * - 不修改 `buildRouteForInput()`,不破坏 12 个安全不变量测试。
 * - 不修改 `classify-risk.ts`,不破坏 16 个 MAX(level) 验收用例。
 * - AI escalate 时按 HIGH 路由到 /risk-alert?source=ai,risk-alert 页看到
 *   ?source=ai 时信任该升级(不再用 classifyRiskByRules 二次降级,避免
 *   AI 嗅到的语义风险被关键词规则"擦掉")。
 *
 * ## 失败哲学
 * 任何异常 → 返回 `buildRouteForInput()` 原结果(fail-open,关键词保险丝是主防线)。
 *
 * ## 依赖
 * `../../domain/routing/user-routing` 的 `buildRouteForInput` —— 关键词保险丝
 * `./risk-recheck` 的 `recheckLowRisk` —— AI 兜底
 *
 * ## 维护规则
 * 改 escalate 的目标等级(HIGH 而不是 CRITICAL)要 review:
 *   HIGH 触发"家人求助卡",CRITICAL 也会;这里选 HIGH 是因为
 *   AI 嗅到的是"疑似",关键词规则没命中,留一道人工/家人复核余量。
 */
import {
  buildRouteForInput,
  type RouteDecision,
} from '../../domain/routing/user-routing.ts'
import { defaultDeepSeekClient, type DeepSeekClient } from './deepseek-client.ts'
import { recheckLowRisk } from './risk-recheck.ts'

/**
 * 在关键词保险丝之上叠加 AI 复检。
 *
 * 流程:
 *   1. trim(text) → 统一入口(避免 /risk-alert URL 和 AI prompt 看到不同形态)
 *   2. buildRouteForInput(trimmed) ←── 关键词保险丝(不动);**自带 classification**
 *   3. if base.level === 'low' → recheckLowRisk(trimmed, base.classification, client)
 *   4. AI escalate ? 覆盖为 /risk-alert?source=ai : 保持原路
 *
 * 关键修复(PR #1 review #2):
 *   旧版曾在此处二次调用 `classifyRiskByRules(trimmed)` 拿 matchedKeywords / reason;
 *   一旦分类器引入非确定性(缓存 / locale / 时间衰减)就会和 `buildRouteForInput`
 *   内部那次调用产生分歧,导致 AI 看到与路由决策不同的分类视图。
 *   现在直接复用 `base.classification`,保证单次请求只有 1 份分类真相。
 *
 * 任何步骤异常(理论上 recheckLowRisk 内部已 fail-open)→ 兜底返回 buildRouteForInput。
 *
 * @param client 可选:注入的 DeepSeek client;默认走模块级 defaultDeepSeekClient。
 *               单测时注入 mock client,生产代码不传(用 default)。
 */
export async function routeWithAiRecheck(
  text: string,
  client: DeepSeekClient = defaultDeepSeekClient,
): Promise<RouteDecision> {
  // 入口 trim:统一 AI prompt、URL、审计日志的输入形态,避免空白歧义
  const trimmed = text.trim()
  const base = buildRouteForInput(trimmed)

  // 只在 LOW 上做 AI 复检 —— medium/high/critical 关键词保险丝已给更强信号
  if (base.level !== 'low') {
    return base
  }

  // 复用 `buildRouteForInput` 自带的 classification —— 同一份分类结果同时
  // 用于 (a) 路由决策 和 (b) 喂给 AI。消除二次跑 `classifyRiskByRules` 引入的
  // 非确定性风险(形态 ① 安全保险丝)。
  let ai
  try {
    ai = await recheckLowRisk(trimmed, base.classification, client)
  } catch {
    // recheckLowRisk 内部已经 fail-open,理论上不会到这里;
    // 留一个保险:万一是上游 bug,也回退到关键词结果
    return base
  }

  if (ai.decision !== 'escalate') {
    return base
  }

  // AI 嗅到风险 → 升级到 /risk-alert
  // query 上加 source=ai:risk-alert 页 server-side 看到 ?source=ai 时信任该升级,
  // 不再用 classifyRiskByRules 二次降级(AI 嗅到的语义风险关键词规则看不到)。
  // 威胁模型:用户可手拼 ?source=ai 强制进 /risk-alert,但 → "烦人但安全",
  // 风险页 help 卡本身就保守(家人求助卡不会教错)。
  const qs = new URLSearchParams({ text: trimmed })
  qs.set('level', 'high')
  qs.set('reason', `AI 兜底:${ai.reason}`)
  qs.set('source', 'ai')

  return {
    href: `/risk-alert?${qs.toString()}`,
    level: 'high',
  }
}
