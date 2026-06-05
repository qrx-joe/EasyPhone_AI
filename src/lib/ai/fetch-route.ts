'use client'

/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * Client 端调 `/api/route` 拿最终路由(经 AI 兜底),带运行时 schema 校验。
 *
 *   - `fetchRoute(text, signal?)` → POST `/api/route` → 校验 `{ href, level }` → `RouteDecision`
 *   - 校验失败抛错(由调用方决定降级)
 *   - 接受 `AbortSignal`,被 abort 时 fetch reject 一个 `AbortError`
 *
 * ## 输入
 * - `text`: 用户输入字符串
 * - `signal`: 可选 `AbortSignal`,用于取消 in-flight 请求
 *
 * ## 输出
 * `Promise<RouteDecision>` —— `{ href, level }` 形态与 `buildRouteForInput()` 一致
 *
 * ## 定位
 * M5 客户端**纯网络层**。不做 in-flight guard / 降级 —— 那些是
 * `client-route.ts` 的 `routeWithFallback` 的事。`fetchRoute` 只管"打 HTTP 拿数据"。
 *
 * ## 依赖
 * - 浏览器 `fetch` API(全局)
 * - `@/domain/risk/types.ts` 的 `RiskLevel` 类型
 * - `@/domain/routing/user-routing.ts` 的 `RouteDecision` 类型
 *
 * ## 维护规则
 * - 改响应字段 → 同步改 `fetch-route.test.ts` 的 cast 形态
 * - 改 ALLOWED_LEVELS → 同步 review `RiskLevel` 联合类型
 * - 不在本模块加 retry / in-flight guard —— 单一职责
 * - 不再含 `routeWithFallback`(那个住在 `./client-route.ts`);改 wrapper 行为去那里
 */

import type { RiskLevel } from '../../domain/risk/types.ts'
import type { RouteDecision } from '../../domain/routing/user-routing.ts'

const ALLOWED_LEVELS: readonly RiskLevel[] = ['low', 'medium', 'high', 'critical']

/**
 * 调 `/api/route` 拿 AI 兜底后的最终路由。
 *
 * 抛出:任何网络/HTTP/JSON 错误向上抛(由调用方决定降级策略)。
 * Abort:若传入 `signal` 且被 abort,fetch 会 reject 一个 `AbortError`。
 */
export async function fetchRoute(
  text: string,
  signal?: AbortSignal,
): Promise<RouteDecision> {
  const res = await fetch('/api/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    ...(signal ? { signal } : {}),
  })
  if (!res.ok) {
    throw new Error(`/api/route HTTP ${res.status}`)
  }
  // 把响应当成 unknown 校验:服务端 JSON 不可信,TypeScript 的 as 在 runtime 不存在。
  // 必须对 href / level 都做窄化,否则脏数据会带着"安全"的类型穿过调用链。
  const data = (await res.json()) as { href?: unknown; level?: unknown }
  if (typeof data.href !== 'string') {
    throw new Error('/api/route response missing href')
  }
  if (
    typeof data.level !== 'string' ||
    !(ALLOWED_LEVELS as readonly string[]).includes(data.level)
  ) {
    throw new Error(`/api/route response has invalid level: ${String(data.level)}`)
  }
  return { href: data.href, level: data.level as RiskLevel }
}
