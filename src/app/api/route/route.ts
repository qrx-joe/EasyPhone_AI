/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * POST `/api/route` —— 客户端提交用户输入,服务器返回最终路由(经 AI 兜底)。
 *
 * ## 输入
 * HTTP POST 请求,Content-Type: application/json
 * 请求体:`{ "text": "用户输入" }`
 *
 * ## 输出
 * - 200:`{ "href": "/confirm?text=...", "level": "low" | "medium" | "high" | "critical" }`
 * - 400:`{ "error": "empty text" | "text must be string" | "invalid json" }`
 * - 500:`{ "error": "route failed" }`(无 PII)
 *
 * ## 定位
 * M5 范例的"对外网关"。所有 client 入口(首页/语音/未来 deep link)
 * 调这个端点拿最终路由,而不是直接调 `buildRouteForInput()`。
 *
 * ## 依赖
 * `next/server` 的 `NextResponse`;`@/lib/ai/route-with-ai` 的 `routeWithAiRecheck`。
 *
 * ## 维护规则
 * - 改响应字段要同步改 client 调用方(`page.tsx` / `voice-input-button.tsx`)
 * - 改错误码要更新 README
 * - 永不把 API key / 原始 text 透到响应里
 */
import { NextResponse } from 'next/server'

import { routeWithAiRecheck } from '@/lib/ai/route-with-ai'

interface RequestBody {
  text?: unknown
}

export async function POST(request: Request): Promise<Response> {
  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  if (typeof body.text !== 'string') {
    return NextResponse.json({ error: 'text must be string' }, { status: 400 })
  }

  try {
    const decision = await routeWithAiRecheck(body.text)
    return NextResponse.json(decision, { status: 200 })
  } catch (err) {
    // 不暴露 err.message(可能含内部路径 / API key 痕迹)
    console.error('[api/route] unexpected error', err)
    return NextResponse.json({ error: 'route failed' }, { status: 500 })
  }
}
