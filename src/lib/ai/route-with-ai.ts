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
import { classifyRiskByRules } from '../../domain/risk/classify-risk.ts'
import type { RiskClassification } from '../../domain/risk/types.ts'
import { defaultDeepSeekClient, type DeepSeekClient } from './deepseek-client.ts'
import { recheckLowRisk } from './risk-recheck.ts'

/**
 * 在关键词保险丝之上叠加 AI 复检。
 *
 * 流程:
 *   1. trim(text) → 统一入口(避免 /risk-alert URL 和 AI prompt 看到不同形态)
 *   2. buildRouteForInput(trimmed) ←── 关键词保险丝(不动)
 *   3. if level === 'low' → recheckLowRisk(trimmed, classifyRiskByRules(trimmed), client)
 *   4. AI escalate ? 覆盖为 /risk-alert?source=ai : 保持原路
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

  // 构造一份 classification 给 AI 看(关键词规则的视角)
  // buildRouteForInput 不返回 classification,这里重新跑一份纯函数;
  // 接受这个成本,因为它仍然是纯函数 + 无 I/O,代价可忽略
  // base.level === 'low' 时,classifyRiskByRules(trimmed).level 也 === 'low'
  // (因为 buildRouteForInput 内部用的就是同一个 classifyRiskByRules)
  // —— 所以这里复用 base.level 安全;但 matchedKeywords / reason 仍是真实关键词结果
  const classification: RiskClassification = classifyRiskByRules(trimmed)

  let ai
  try {
    ai = await recheckLowRisk(trimmed, classification, client)
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
