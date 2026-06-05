'use client'

/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * Client 端 fetch 包装:调 POST `/api/route` 拿最终路由(经 AI 兜底)。
 *
 * ## 输入
 * `text`: 用户输入(已由调用方读出)
 *
 * ## 输出
 * `Promise<{ href, level }>` —— 形态与 `buildRouteForInput()` 一致。
 *
 * ## 定位
 * M5 客户端唯一调路由的入口。失败时**调用方**应降级到
 * `routeToInput(router, text)`(同步、纯关键词保险丝)。
 *
 * ## 依赖
 * 浏览器 `fetch` API(全局);`@/domain/routing/user-routing` 的 `RouteDecision` 类型。
 *
 * ## 维护规则
 * - 改响应字段 → 同步改两个调用方(page.tsx / voice-input-button.tsx)
 * - 不在本模块加 retry:失败快速降级,老人产品不需要复杂重试
 */

import type { RouteDecision } from '../../domain/routing/user-routing.ts'

/**
 * 调 `/api/route` 拿 AI 兜底后的最终路由。
 *
 * 抛出:任何网络/HTTP/JSON 错误向上抛(由调用方决定降级策略)。
 */
export async function fetchRoute(text: string): Promise<RouteDecision> {
  const res = await fetch('/api/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) {
    throw new Error(`/api/route HTTP ${res.status}`)
  }
  const data = (await res.json()) as RouteDecision
  if (typeof data.href !== 'string') {
    throw new Error('/api/route response missing href')
  }
  return data
}
