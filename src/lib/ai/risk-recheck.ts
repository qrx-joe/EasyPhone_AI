/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * `recheckLowRisk()` —— AI 兜底复检。**形态 ①:外部复检**。
 *
 * ## 输入
 * - `text`: 用户原始输入(已 trim)
 * - `classification`: `classifyRiskByRules()` 的输出(level / matchedKeywords / reason)
 *
 * ## 输出
 * `AiRecheckResult`:
 *   - `decision: 'keep' | 'escalate'`
 *   - `reason: string`(给开发者/审计日志看;不是给老人看的文案)
 *   - `source: 'ai' | 'fallback'` —— 区分真实 AI 决策 vs fail-open
 *
 * ## 定位
 * M5 AI 兜底层的主入口。**不动 `classify-risk.ts` 的 MAX(level) 保险丝**。
 * 关键词规则判定为 LOW 时调本函数做语义复检;其余等级不调。
 *
 * ## 失败哲学:fail-open
 * AI 挂 / 超时 / 解析失败 / env 缺失 / 输入超长 → 一律返回 `keep`。
 * 理由(详见 README):关键词保险丝是主防线,AI 是补漏。
 *
 * ## 依赖
 * `./gemini-client.ts` 的 `defaultGeminiClient` + `isAiRecheckGloballyEnabled()`。
 * `./prompts/risk-recheck.ts` 的 prompt builders + JSON 解析。
 *
 * ## 维护规则
 * - 改 fail-open 策略 = 改安全哲学,需 ADR + 全员 review。
 * - 改 prompt / schema → 重跑 `risk-recheck.test.ts`,并人工 review 5+ 边界 case。
 * - 审计日志格式改了要同步改日志聚合端的解析(如果有)。
 */
import { createHash } from 'node:crypto'
import type { RiskClassification } from '../../domain/risk/types.ts'
import type { AiClient } from './ai-client.ts'
import {
  defaultGeminiClient,
  isAiRecheckGloballyEnabled,
} from './gemini-client.ts'
import { tryConsume } from './rate-limit.ts'
import {
  RISK_RECHECK_SYSTEM_PROMPT,
  buildRiskRecheckUserPrompt,
  parseAiRecheckOutput,
} from './prompts/risk-recheck.ts'

/**
 * 输入文本超过此长度直接跳过 AI。
 * 理由:cost 控制 + 减少 prompt injection 攻击面。
 * 老人正常一句话远小于 200 字;200+ 多半是粘贴/复制的非典型输入。
 */
const MAX_TEXT_LENGTH = 200

const RISK_RECHECK_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    decision: { type: 'string', enum: ['keep', 'escalate'] },
    reason: { type: 'string' },
  },
  required: ['decision', 'reason'],
  additionalProperties: false,
} as const

/**
 * AI 复检结果。`source` 区分真实 AI 决策和 fail-open,用于审计和监控。
 */
export interface AiRecheckResult {
  readonly decision: 'keep' | 'escalate'
  readonly reason: string
  readonly source: 'ai' | 'fallback'
}

/**
 * 对一串 LOW 分类的输入做 AI 语义复检。
 *
 * 调用前置(由调用方保证):
 *   - 输入已被 `classifyRiskByRules()` 标为 LOW
 *   - 调用方拿到结果后,如 escalate,需重新走路由(见 `routeWithAiRecheck`)
 *
 * 失败模式:任何异常 → `{ decision: 'keep', source: 'fallback' }`。
 * **不抛出** —— 这层是"补漏",异常不能向上传。
 *
 * @param client  可选:注入的 AI client;默认走模块级 defaultGeminiClient。
 *                单测时注入 mock client,生产代码不传(用 default)。
 */
export async function recheckLowRisk(
  text: string,
  classification: RiskClassification,
  client: AiClient = defaultGeminiClient,
): Promise<AiRecheckResult> {
  const start = Date.now()

  // 1. 全局开关(env kill-switch)
  if (!isAiRecheckGloballyEnabled()) {
    return logAndReturn(
      { decision: 'keep', reason: 'globally disabled', source: 'fallback' },
      start,
      'disabled',
      text,
      classification,
    )
  }

  // 2. 客户端是否就绪(API key 缺失 = 不可用)
  if (!client.isEnabled()) {
    return logAndReturn(
      { decision: 'keep', reason: 'no api key', source: 'fallback' },
      start,
      'no-key',
      text,
      classification,
    )
  }

  // 3. 长度 cap
  if (text.length > MAX_TEXT_LENGTH) {
    return logAndReturn(
      { decision: 'keep', reason: 'text too long', source: 'fallback' },
      start,
      'too-long',
      text,
      classification,
    )
  }

  // 3.5 Rate limit / 日预算(in-process;防 LLM 滥用/成本失控)
  if (!tryConsume()) {
    return logAndReturn(
      { decision: 'keep', reason: 'rate limited', source: 'fallback' },
      start,
      'rate-limited',
      text,
      classification,
    )
  }

  // 4. 调 AI;任何失败都 fail-open
  try {
    const raw = await client.chat({
      system: RISK_RECHECK_SYSTEM_PROMPT,
      user: buildRiskRecheckUserPrompt(text, classification),
      responseSchema: RISK_RECHECK_RESPONSE_SCHEMA,
    })

    const parsed = parseAiRecheckOutput(raw)
    if (!parsed) {
      return logAndReturn(
        { decision: 'keep', reason: 'unparseable', source: 'fallback' },
        start,
        'parse-fail',
        text,
        classification,
      )
    }

    return logAndReturn(
      { decision: parsed.decision, reason: parsed.reason, source: 'ai' },
      start,
      'ok',
      text,
      classification,
    )
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unknown error'
    return logAndReturn(
      { decision: 'keep', reason: 'error', source: 'fallback' },
      start,
      `error: ${reason.slice(0, 80)}`,
      text,
      classification,
    )
  }
}

/**
 * 审计日志:每次 recheck 写一行 JSON。生产环境应转发到日志聚合。
 *
 * 格式:
 *   {
 *     ts: ISO 时间戳,
 *     inputHash: sha256(text) 的十六进制前 8 位(node:crypto 同步),
 *     textLen: number,
 *     keywordLevel: 'low' | ...,
 *     decision: 'keep' | 'escalate',
 *     source: 'ai' | 'fallback',
 *     reason: string,
 *     latencyMs: number,
 *     stage: 'ok' | 'disabled' | 'no-key' | 'too-long' | 'parse-fail' | 'error: ...'
 *   }
 *
 * 不上 PII(text 内容不上日志,只上长度 + hash)。
 */
function logAndReturn(
  result: AiRecheckResult,
  start: number,
  stage: string,
  text: string,
  classification: RiskClassification,
): AiRecheckResult {
  const latencyMs = Date.now() - start
  const inputHash = auditInputHash(text)

  const line = {
    ts: new Date().toISOString(),
    inputHash,
    textLen: text.length,
    keywordLevel: classification.level,
    decision: result.decision,
    source: result.source,
    reason: result.reason,
    latencyMs,
    stage,
  }
  // 单行 JSON:方便日志聚合 grep / jq
  console.info('[ai-recheck]', JSON.stringify(line))
  return result
}

/**
 * 审计用 input hash —— 同步 sha256 前 8 位十六进制。
 *
 * 同步性:`node:crypto.createHash` 是同步 API(只有浏览器 `crypto.subtle.digest`
 * 才是 Promise)。审计路径要同步,这里没包袱。
 *
 * 强度:不是密码学用途,只用于日志聚合端的去重 key。8 位 hex = 32 bit,
 * 理论碰撞率高于密码学 sha256,但比 djb2(同样 32 bit 输出)分布好得多,
 * 也对真实文本模式(短句 / 含中文)的区分力明显更强。
 */
export function auditInputHash(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 8)
}
