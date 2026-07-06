/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * POST `/api/help-summary` —— 风险页客户端异步请求 AI 生成家人求助单 summary。
 *
 * ## 输入
 * HTTP POST 请求,Content-Type: application/json
 * 请求体:`{ "text": "老人原话", "level": "high" | "critical" }`
 *
 * ## 输出
 * - 200:`{ "summary": string | null }`(null = 生成失败/被安全闸拦下,客户端保持模板)
 * - 400:`{ "error": "invalid json" | "text must be string" | "empty text" | "invalid level" }`
 * - 500:`{ "error": "help summary failed" }`(无 PII)
 *
 * ## 定位
 * 形态 ③ 的对外网关。**只增强展示**:风险页永远先用模板 summary 秒开,
 * 客户端拿到本端点结果后原地升级文案。本端点失败不影响任何主流程。
 *
 * ## 安全说明
 * `level` 来自客户端,只影响 AI 语气,**不参与任何风险决策** ——
 * 风险等级/路由/suggestions 已在 server 渲染时由关键词保险丝定死。
 * 伪造 level 最多让 AI 换个语气,无安全影响。
 * matchedKeywords 不信客户端:server 自己跑 classifyRiskByRules 重算。
 *
 * ## 依赖
 * `next/server` 的 `NextResponse`;`@/lib/ai/help-summary` 的 `generateFamilySummary`;
 * `@/domain/risk/classify-risk` 的 `classifyRiskByRules`。
 *
 * ## 维护规则
 * - 改响应字段要同步改 `risk-alert-client.tsx` 与 `scripts/smoke.mjs` 契约
 * - 永不把 API key / 原始 text 透到响应里
 */
import { NextResponse } from 'next/server'

import { classifyRiskByRules } from '@/domain/risk/classify-risk'
import { generateFamilySummary } from '@/lib/ai/help-summary'

interface RequestBody {
  text?: unknown
  level?: unknown
}

export async function POST(request: Request): Promise<Response> {
  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  if (typeof body.text !== 'string') {
    return NextResponse.json({ error: 'text must be string' }, { status: 400 })
  }

  const text = body.text.trim()
  if (!text) {
    return NextResponse.json({ error: 'empty text' }, { status: 400 })
  }

  if (body.level !== 'high' && body.level !== 'critical') {
    return NextResponse.json({ error: 'invalid level' }, { status: 400 })
  }

  try {
    // 关键词不信客户端 —— server 自己重算(与 /risk-alert 页 Fix #4 同口径)
    const keywords = classifyRiskByRules(text).matchedKeywords
    const result = await generateFamilySummary(text, body.level, keywords)
    return NextResponse.json({ summary: result.summary }, { status: 200 })
  } catch (err) {
    // generateFamilySummary 内部不抛;这里是最后防线(不暴露 err.message)
    console.error('[api/help-summary] unexpected error', err)
    return NextResponse.json({ error: 'help summary failed' }, { status: 500 })
  }
}
