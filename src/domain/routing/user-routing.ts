/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * 用户输入 → 页面路由,**唯一**做"高风险不走 /confirm"分流的地方。
 *
 * ## 输入
 * - `text`: 用户原始输入(空 → redirect '/')
 * - `router`: Next.js `useRouter()` 返回的 router(只要 `push` 方法,接口极简)
 *
 * ## 输出
 * - `buildRouteForInput(text)`: `{ href, level, classification }` 纯函数,不依赖 Router
 *   (`classification` 来自同一份 `classifyRiskByRules` 调用,strict superset,
 *   上游 route-with-ai 复用避免二次跑分类)
 * - `routeToInput(router, text)`: 实际执行 router.push(href)
 *
 * ## 定位
 * **安全核心**。多个入口(首页文本/语音/demo 直链)共用同一份分流。
 * 抽这个函数的目的(同 docs/05 §8 反"僵化/冗余"):
 *   - 多个入口共享同一份逻辑,改规则只动 1 处
 *   - 纯函数,12 个测试覆盖
 *   - URL 参数(level/keywords/reason)拼接只在一处
 *
 * ## 依赖
 * - `../risk/classify-risk.ts` 的 `classifyRiskByRules`
 * - `../risk/types.ts` 的 `shouldStopGuidance`
 *
 * ## 维护规则
 * - **不变量**(12 个测试锁住):
 *   1. high/critical 绝不进 /confirm
 *   2. 跳转永远带 text
 *   3. 空文本兜底 '/'
 *   4. 多关键词逗号拼接
 * - 改这个函数必过 `user-routing.test.ts` 全部 12 个 case。
 * - 不在这里加 React state / DOM 操作 —— 纯函数,导入要保持纯净。
 */
/**
 * 用户输入 → 页面路由 —— 单一安全核心入口。
 *
 * 抽这个函数的目的(同 docs/05 §8 反「僵化/冗余」):
 *   - 多个入口(text 提交 / 语音输入 / 未来 demo 路由 / 未来 deep link)共用同一份分流
 *   - 修改风险判断规则时,只动这一处
 *   - 可单测覆盖(纯函数,不依赖 Router)
 *   - URL 参数(level/keywords/reason)的拼接只在一处
 *
 * **安全不变量(必须 100% 维持)**:
 *   1. 高风险输入(critical/high)**绝不**进入 /confirm 教程化引导路径
 *   2. 跳转永远带 text 参数(risk-alert 才能展示「您刚才说的」)
 *   3. 空文本兜底回首页(不构建空 URL)
 *
 * 任何 PR 改这个函数都必须跑过 user-routing.test.ts 全部 case。
 */

import { classifyRiskByRules } from '../risk/classify-risk.ts'
import { shouldStopGuidance, type RiskClassification } from '../risk/types.ts'

/**
 * 路由结果。给调用方两个信息:
 *   - href: 实际跳转的 URL
 *   - level: 风险等级(给 UI 决策用,比如要不要先弹个"小心"提示再跳)
 */
export interface RouteDecision {
  readonly href: string
  readonly level: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * 空文本兜底用的占位 classification(无关键词命中 → low + 空数组 + 空 reason)。
 * 提取为常量,避免 `buildRouteForInput` 内部构造魔法对象(也方便测试断言"占位"语义)。
 */
const EMPTY_CLASSIFICATION: RiskClassification = {
  level: 'low',
  matchedKeywords: [],
  reason: '',
}

/**
 * 给定用户输入,决定跳哪个页面。
 *
 * 纯函数。不读 router、不读 history、不读 window —— 测试友好。
 *
 * 返回值:`RouteDecision & { classification: RiskClassification }` —— 在原有
 * `{ href, level }` 之上叠加本次分类结果(level / matchedKeywords / reason),
 * 方便上游(route-with-ai 等)直接复用同一份分类对象喂给 AI,避免二次跑
 * `classifyRiskByRules` 时的非确定性风险(形态 ① 安全保险丝)。
 *
 * 对 12 个安全不变量测试保持兼容:它们只读 `r.level` / `r.href`,新增的
 * `classification` 字段是 strict superset,无破坏。
 *
 * @param text 用户输入的原始文本(text / voice 转写 / demo 模拟输入)
 */
export function buildRouteForInput(
  text: string,
): RouteDecision & { readonly classification: RiskClassification } {
  const trimmed = text.trim()
  if (!trimmed) {
    // 空文本兜底:回首页让用户重新输入
    return { href: '/', level: 'low', classification: EMPTY_CLASSIFICATION }
  }

  const r = classifyRiskByRules(trimmed)
  const qs = new URLSearchParams({ text: trimmed })

  if (shouldStopGuidance(r.level)) {
    // 高风险:把分类结果也带上,risk-alert 页会重新跑分类做防篡改校验
    qs.set('level', r.level)
    qs.set('keywords', r.matchedKeywords.join(','))
    qs.set('reason', r.reason)
    return {
      href: `/risk-alert?${qs.toString()}`,
      level: r.level,
      classification: r,
    }
  }

  // 低/中风险:进 /confirm(确认页),后续会再路由到 /tutorial
  return {
    href: `/confirm?${qs.toString()}`,
    level: r.level,
    classification: r,
  }
}

/**
 * Router 的最小接口(避免直接依赖 next/navigation 的 Router 类型,便于测试)。
 */
export interface MinimalRouter {
  push(href: string): void
}

/**
 * 实际执行跳转 —— 给 page.tsx / voice-input-button.tsx 共用。
 * 直接调 useRouter() 然后传进来即可。
 *
 * @example
 *   const router = useRouter()
 *   routeToInput(router, '微信没声音')
 *   // → router.push('/confirm?text=微信没声音')
 */
export function routeToInput(router: MinimalRouter, text: string): void {
  const { href } = buildRouteForInput(text)
  router.push(href)
}
