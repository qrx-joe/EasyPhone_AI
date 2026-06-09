/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * Deep link 守卫:对 `/tutorial?text=...` 或 `/confirm?text=...` 这类
 * 手拼 URL 绕过首页 `buildRouteForInput()` 的情况,统一复用
 * `buildRouteForInput()` 决定是否必须先 redirect 到风险页。
 *
 * ## 输入
 * - text:来自 searchParams.text 的原始输入(调用方已 trim)
 *
 * ## 输出
 * - string:必须先 redirect 到该 href(由 buildRouteForInput 给出)
 * - null:文本安全,可继续走当前页面正常逻辑
 *
 * ## 定位
 * **安全核心补充**。`buildRouteForInput()` 是"用户输入→跳转"的入口,
 * 本函数是"页面被 deep link 进入→是否需要再分流"的反向守卫。
 * 两者方向相反,共用同一份 `shouldStopGuidance()` 决策。
 * 调用方:`/tutorial/page.tsx`、`/confirm/page.tsx` server page 入口。
 * **不**调用方:`/risk-alert/page.tsx`(它已自防御,source=ai 是"烦人但安全"例外)。
 *
 * ## 不变量
 * - 接线存在不等于接线在安全边界之前 → 调用方必须在主逻辑之前调本函数
 *
 * ## 依赖
 * - `./user-routing.ts` 的 `buildRouteForInput`
 * - `../risk/types.ts` 的 `shouldStopGuidance`
 *
 * ## 维护规则
 * - 改判断规则:只动 `buildRouteForInput()` 或 `shouldStopGuidance()`,本函数零修改
 * - 新增 deep link 页面:在 server page 入口调本函数,redirect 守卫给的 href
 * - 不在本函数构造魔法字符串(不应出现 '/risk-alert' 字面量)
 */

import { buildRouteForInput } from './user-routing.ts'
import { shouldStopGuidance } from '../risk/types.ts'

/**
 * Deep link 守卫。
 *
 * - 返回 string:必须先 `redirect(guard)` 到该 href(由 buildRouteForInput 给出)
 * - 返回 null:文本安全,当前页面可继续正常逻辑
 *
 * 复用 `buildRouteForInput()` 的决策,避免在页面层重写分类规则;
 * 判 `level` 而非判 `href` 字符串,未来高风险路径改名自动跟随。
 *
 * @param text 来自 searchParams.text 的原始输入(调用方已 trim)
 */
export function guardGuidanceRoute(text: string): string | null {
  const decision = buildRouteForInput(text)
  if (shouldStopGuidance(decision.level)) {
    return decision.href
  }
  return null
}
