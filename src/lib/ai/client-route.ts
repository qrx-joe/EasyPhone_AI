'use client'

/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * 客户端提交入口的统一 wrapper:`routeWithFallback`。
 *
 *   - try `fetchRoute` → 成功:router.push(AI 兜底后的 href)
 *   - 失败 → 降级到 `routeToInput(router, text)`(纯关键词保险丝,client-side)
 *   - abort(用户连点/连说) → 静默退出,**不**push 也**不**降级
 *
 * **为什么需要 abort 路径**:老人可能快速连点「告诉我」,或对着麦克风连说两次。
 * 不加 guard 会出现两次 push,导致页面闪烁或被旧请求的「低风险」路径覆盖掉新提交
 * 的「高风险」路径(更糟)。In-flight guard 把"在飞"的旧 promise 短接掉,只允许
 * 最新一次提交真正生效。
 *
 * ## 输入
 * - `router`: 来自 `useRouter()`,只要 `push` 方法(`MinimalRouter` 接口)
 * - `text`: 用户原始输入
 * - `source`: 日志标签(`'home'` / `'voice'` 等)
 * - `options.signal`: 可选 AbortSignal,组件用 `useRef<AbortController>` 管理
 * - `options.fetchRouteImpl`: 可选 fetch 实现覆盖(默认 = `./fetch-route.ts` 的 `fetchRoute`)
 *
 * ## 输出
 * `Promise<void>` —— 不返回结果,只负责跳走或降级。
 *
 * ## 定位
 * 把「try fetchRoute → catch 降级 + abort 静默」集中在一处。
 * `page.tsx` 和 `voice-input-button.tsx` 各自只剩一个 `inFlightRef` + 一行调用。
 *
 * ## 依赖
 * `./fetch-route.ts` 的 `fetchRoute`(默认 fetch 实现;可通过 options 注入);
 * `../../domain/routing/user-routing.ts` 的 `routeToInput` + `MinimalRouter` + `RouteDecision`。
 *
 * ## 维护规则
 * - 改 abort / 降级行为 = 改安全 UX 边界,需 review。漏一个 case = 可能闪烁/错跳。
 * - 改响应字段 → 同步改 `fetch-route.ts` 的 `fetchRoute`。
 */

import {
  routeToInput,
  type MinimalRouter,
  type RouteDecision,
} from '../../domain/routing/user-routing.ts'
import { fetchRoute } from './fetch-route.ts'

/**
 * `routeWithFallback` 的可选参数。
 *
 * - `signal`:用于取消 in-flight 请求(配合组件里的 `useRef<AbortController>`)
 * - `fetchRouteImpl`:依赖注入,默认走 `./fetch-route.ts` 的 `fetchRoute`(测试时换成可控 mock)
 */
export interface RouteWithFallbackOptions {
  signal?: AbortSignal
  fetchRouteImpl?: (text: string) => Promise<RouteDecision>
}

/**
 * 统一提交 wrapper —— 把「try fetchRoute → catch 降级 + abort 静默」集中在一处。
 *
 * 行为:
 *   1. 调 `fetchRouteImpl(text)`
 *   2. 成功 → `router.push(href)`,但若 signal 已 abort 则跳过(避免覆盖新提交)
 *   3. 失败 → 若 signal 已 abort 静默退出,否则 `console.warn('[<source>] ...')`
 *           然后降级到 `routeToInput(router, text)`(关键词保险丝)
 *
 * **为什么 abort 路径静默**:用户连续两次点提交,第一次的旧请求 resolve 时可能
 * 已经跳过一次页面。abort 后**不再** push、也**不再**降级 —— 否则会出现两次
 * 跳转(先降级到 /confirm,再被新提交的 /risk-alert 覆盖),观感闪烁。
 *
 * 调用方:
 *   - `src/app/page.tsx`(`source='home'`)
 *   - `src/lib/speech/voice-input-button.tsx`(`source='voice'`)
 */
export async function routeWithFallback(
  router: MinimalRouter,
  text: string,
  source: string,
  options: RouteWithFallbackOptions = {},
): Promise<void> {
  const { signal, fetchRouteImpl = fetchRoute } = options

  try {
    const { href } = await fetchRouteImpl(text)
    if (signal?.aborted) return
    router.push(href)
  } catch (err) {
    // 用户连点 / 重新说话 → 旧请求被 abort,不要做任何导航(已在新 controller 处理)
    if (signal?.aborted) return
    // fetch 抛的 AbortError 也按 abort 处理(双重保险)
    if (err instanceof Error && err.name === 'AbortError') return
    console.warn(
      `[${source}] /api/route failed, falling back to keyword routing`,
      err,
    )
    routeToInput(router, text)
  }
}
