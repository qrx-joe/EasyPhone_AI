/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * `generateFamilySummary()` —— 形态 ③:AI 把老人原话改写成家人可读的求助单
 * summary。server-only。
 *
 * ## 输入
 * - `text`: 老人原始输入(已 trim)
 * - `level`: 'high' | 'critical'(风险页已定级,只影响语气,不影响任何安全决策)
 * - `keywords`: 关键词命中(给 LLM 场景参考)
 *
 * ## 输出
 * `FamilySummaryResult`:
 *   - `summary: string | null` —— null = 生成失败/被安全闸拦下,调用方保持模板
 *   - `source: 'ai' | 'fallback'`
 *
 * ## 定位
 * M5 AI 层的第二个能力(第一个是 risk-recheck)。与 recheck 共用
 * deepseek-client / rate-limit / kill-switch / 审计日志骨架。
 * **只增强展示,不参与任何风险决策** —— 风险等级、suggestions、路由
 * 全部与本函数无关。
 *
 * ## 失败哲学:fail-open(回退到模板 summary)
 * AI 挂 / 超时 / 解析失败 / 安全闸拦截 / 限流 → 一律返回 null。
 * 求助卡永远有模板兜底,AI 只是把它写得更像人话。
 *
 * ## 依赖
 * `./deepseek-client.ts`、`./rate-limit.ts`、`./prompts/help-summary.ts`、
 * `./risk-recheck.ts` 的 `auditInputHash`。
 *
 * ## 维护规则
 * - 本函数的输出**只能**用于 summary 展示,不得回流进风险判断。
 * - 改安全闸(prompts/help-summary.ts 的 parse)= 改安全边界,需 review。
 * - 审计日志 tag 是 `[ai-help-summary]`,聚合端解析要同步。
 * - server-only 保证与 risk-recheck 同策略:不加 `import 'server-only'`
 *   (node --test 下会 throw),靠「只被 API route import」+ review 守门。
 */
import {
  defaultDeepSeekClient,
  isAiRecheckGloballyEnabled,
  type DeepSeekClient,
} from './deepseek-client.ts'
import { tryConsume } from './rate-limit.ts'
import { auditInputHash } from './risk-recheck.ts'
import {
  HELP_SUMMARY_SYSTEM_PROMPT,
  buildHelpSummaryUserPrompt,
  parseHelpSummaryOutput,
} from './prompts/help-summary.ts'

/** 与 risk-recheck 同一口径:超长输入跳过 AI(cost + 注入面)。 */
const MAX_TEXT_LENGTH = 200

/**
 * summary 生成给的 token 余量。
 * 90 字中文 + JSON 包裹 ≈ 150 token;给 300 防 finish_reason=length 截断
 * (截断的 JSON 解析必失败 → 白白浪费一次调用)。
 */
const SUMMARY_MAX_TOKENS = 300

export interface FamilySummaryResult {
  readonly summary: string | null
  readonly source: 'ai' | 'fallback'
}

/**
 * 生成家人求助单 summary。任何失败 → `{ summary: null, source: 'fallback' }`,
 * **不抛出** —— 这层是展示增强,异常不能影响风险页主流程。
 *
 * @param client 单测注入 mock;生产不传(用 defaultDeepSeekClient)。
 */
export async function generateFamilySummary(
  text: string,
  level: 'high' | 'critical',
  keywords: readonly string[],
  client: DeepSeekClient = defaultDeepSeekClient,
): Promise<FamilySummaryResult> {
  const start = Date.now()

  // 1. 全局 kill-switch(与 recheck 共用:关 AI = 全关)
  if (!isAiRecheckGloballyEnabled()) {
    return logAndReturn(null, 'fallback', start, 'disabled', text, level)
  }

  // 2. 客户端就绪(API key 缺失 = 不可用)
  if (!client.isEnabled()) {
    return logAndReturn(null, 'fallback', start, 'no-key', text, level)
  }

  // 3. 长度 cap
  if (text.length > MAX_TEXT_LENGTH) {
    return logAndReturn(null, 'fallback', start, 'too-long', text, level)
  }

  // 3.5 Rate limit / 日预算(与 recheck 共享额度 —— 总成本一个口子管)
  if (!tryConsume()) {
    return logAndReturn(null, 'fallback', start, 'rate-limited', text, level)
  }

  // 4. 调 AI;任何失败都 fail-open
  try {
    const raw = await client.chat({
      system: HELP_SUMMARY_SYSTEM_PROMPT,
      user: buildHelpSummaryUserPrompt(text, level, keywords),
      maxTokens: SUMMARY_MAX_TOKENS,
    })

    const parsed = parseHelpSummaryOutput(raw)
    if (!parsed) {
      // 解析失败或安全闸拦截(JSON 坏 / 超长 / URL / 教给出去话术)
      return logAndReturn(null, 'fallback', start, 'parse-or-guard-fail', text, level)
    }

    return logAndReturn(parsed.summary, 'ai', start, 'ok', text, level)
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown error'
    return logAndReturn(
      null,
      'fallback',
      start,
      `error: ${reason.slice(0, 80)}`,
      text,
      level,
    )
  }
}

/**
 * 审计日志:每次生成写一行 JSON(tag `[ai-help-summary]`)。
 * 不上 PII:text 只上 hash + 长度;AI summary 只上长度(它是老人场景的转述,同样算敏感)。
 */
function logAndReturn(
  summary: string | null,
  source: 'ai' | 'fallback',
  start: number,
  stage: string,
  text: string,
  level: 'high' | 'critical',
): FamilySummaryResult {
  const line = {
    ts: new Date().toISOString(),
    inputHash: auditInputHash(text),
    textLen: text.length,
    level,
    source,
    summaryLen: summary?.length ?? 0,
    latencyMs: Date.now() - start,
    stage,
  }
  console.info('[ai-help-summary]', JSON.stringify(line))
  return { summary, source }
}
