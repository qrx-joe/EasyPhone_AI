/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * 高风险分流后的「家人求助卡」页(server),重新分类 + 防 URL 篡改 + 打包求助卡。
 *
 * ## 输入
 * URL searchParams.text(忽略其他 query)。
 *
 * ## 输出
 * 渲染 <RiskAlertClient help={help}>;非高风险兜底 redirect 到 /tutorial 或 /;
 * text 为空 redirect('/')。
 *
 * ## 定位
 * 高风险路径的入口 server,负责可信分类 + 卡片构建;UI 在 client 组件里。
 * 不信 URL 里的 level(仅作 aiLevel 提示)/ keywords(自己跑 classifyRiskByRules 重算)
 * / reason(完全忽略 + unknown-key redirect 在 URL 入口消毒,参 Fix #3),
 * 防手拼 URL 绕过 + 防响应体被 RSC payload 投毒。
 *
 * ## 依赖
 * @/domain/risk/classify-risk(classifyRiskByRules)、
 * @/domain/risk/types(shouldStopGuidance)、
 * @/domain/question/question(createQuestion)、
 * @/domain/help/help-templates(buildHelpRequest)、
 * @/domain/help/help-request(HelpRequest 类型)、./risk-alert-client。
 *
 * ## 维护规则
 * 改分类或卡片模板要同步跑 domain 单元测试;新增兜底 redirect 要在首页 user-routing 测试里加 case。
 */

/**
 * 风险提醒页 —— 家人求助卡的真实集成。
 *
 * 数据流(同 docs/06 M4 验收):
 *   1. server: 读 ?text=&source=&level=(reason / 其他多余 query 一律忽略)
 *   2. server: 如果 source=ai → 信任 AI 升级(不再用 classifyRiskByRules 二次降级);
 *      否则 → 重新跑 classifyRiskByRules(text) 作为防 URL 篡改的兜底
 *   3. server: 兜底路径(非 source=ai)如果分类结果不是 high/critical → redirect
 *      (防御性:即使有人手动拼 /risk-alert?text=微信没声音,也会被路由到正确页面)
 *   4. server: buildHelpRequest(question) 一次性打包好卡片数据
 *   5. client: 渲染 + 复制 + 模拟发送
 *
 * ## 威胁模型(可手拼 ?source=ai 怎么办)
 * 用户理论上可以手拼 `/risk-alert?text=hello&source=ai` 强制进风险页。
 * 这是 "烦人但安全" 的取舍:
 *   - 风险页 = 家人求助卡,文案保守、不会教错(不会教"把验证码发给我"等)
 *   - 关键词保险丝仍然主导:正常 high/critical 文本不带 source=ai 也会被关键词分流
 *   - 唯一被绕过的边界:原本是 low/medium 的输入也能进风险页 → 用户"多看一次求助卡"
 *   - 失败模式偏保守 → 不破坏 "宁可错升" 的安全哲学
 *
 * URL 上不再依赖首页传的 level/keywords(query 简化)—— 首页实现保留向后兼容,
 * 多余参数被忽略即可,不影响 server 决策。
 * **reason 参数被完全忽略**:不渲染、不写日志,并在 page 顶部触发 canonical URL
 * 重定向(见 Fix #3 加固注释),确保 RSC payload 不会序列化攻击者文案。
 * 安全不变量 > 诊断价值。
 */

import { redirect } from 'next/navigation'

import { classifyRiskByRules } from '@/domain/risk/classify-risk'
import { shouldStopGuidance } from '@/domain/risk/types'
import { createQuestion } from '@/domain/question/question'
import { buildHelpRequest } from '@/domain/help/help-templates'
import type { HelpRequest } from '@/domain/help/help-request'

import { RiskAlertClient } from './risk-alert-client'

/**
 * /risk-alert 的 searchParams 形态。
 *
 * Next.js 真实行为(实测,不是猜):
 *   - 重复 key:`?text=foo&text=bar` → `text: ['foo', 'bar']`
 *   - 数组形态:`?text[]=foo`        → 解析为**字面 key** `'text[]'`,**不是** `text:['foo']`
 *     (RSC payload 印证: `\"text[]\":\"foo\"`)
 *   - 缺失:任一字段都是 undefined
 *
 * 所以 text 必须**两个 key 都接**。其他字段(string | string[])只是为了类型真实,
 * 本文件一律用 firstParam 收敛后只用第一个值。
 *
 * **故意不接 reason** —— Fix #3 决定:URL reason 是攻击者输入,既不渲染也不写日志,
 * 避免 RSC payload 把它序列化进响应体(参 smoke Fix #3)。即使页面不读,
 * Next.js 仍会把整个 searchParams 序列化进 RSC `__PAGE__?{...}` 流,所以
 * 顶部有 unknown-key redirect 把 reason 从 URL 入口消毒。
 *
 * **`_rsc` 不进这个类型** —— Next.js 客户端 RSC 协议内部 query(参
 *  node_modules/next/dist/client/components/app-router-headers.js:
 *  NEXT_RSC_UNION_QUERY = '_rsc')。被 NEXT_INTERNAL_QUERY_KEYS 白名单接住,
 *  既不读也不当 unknown redirect(否则 <Link> 导航坏)。
 */
type RiskAlertSearchParams = {
  text?: string | string[]
  /** Next.js 把 ?text[]=foo 解析为字面 key 'text[]'(见类型注释)。 */
  'text[]'?: string | string[]
  /** 信任信号:route-with-ai 的 AI 升级路径会带 source=ai。 */
  source?: string | string[]
  /** 可选:AI 升级时带的 level(critical / high),用于显示。 */
  level?: string | string[]
}

/**
 * 收敛 string | string[] | undefined → string | undefined。
 * 数组取首元素(同 Next.js 多值 query 的常规语义);
 * 不做 trim / 不做 fallback —— 留给调用方按需处理。
 */
function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

interface PageProps {
  searchParams: Promise<RiskAlertSearchParams>
}

export default async function RiskAlertPage({ searchParams }: PageProps) {
  const params = await searchParams

  // Fix #8 严格 key 匹配:只接 text 和 text[] 两个精确 key,
  // 不模糊匹配其他含 'text' 的 query(避免把 context / textarea / next 这种
  // query 误当成用户输入)。优先级:text 优先,text[] 兜底。
  const text = firstParam(params.text) ?? firstParam(params['text[]'])
  const source = firstParam(params.source)
  const level = firstParam(params.level)

  // Fix #3 加固:实测发现 Next.js 仍会把 URL 上**所有** query(包括我们不读
  // 的 reason)序列化进 RSC `__PAGE__?{...}` 流 —— 不读 ≠ 不泄露。
  // 因此"删 destructure + 不写 audit log"是半截 fix:visible summary 安全,
  // 但 grep 响应体仍能抓出攻击者文案。
  //
  // 完整 fix:URL 里有**任何**我们不识别的 key(最常见的就是 reason),
  // 就 server-side 重定向到只剩 known key 的 canonical URL。
  // 下一次请求的 URL 是干净的,RSC payload 也干净。
  //
  // 副作用:浏览器地址栏从 ?reason=... 更新成 canonical URL,
  // 这是期望行为(把攻击者 URL 投毒从客户端视角也消灭)。
  //
  // 自审发现:Next.js 客户端 RSC prefetch / 导航会发 ?_rsc=xxx
  // (参 node_modules/next/dist/client/components/app-router-headers.js:
  //  NEXT_RSC_UNION_QUERY = '_rsc')。如果 _rsc 被这个 redirect 吞掉,
  // 客户端 router 拿 HTML 而非 RSC stream → <Link> 导航坏掉。
  // 解法:把 Next.js 协议内部的 query 单列一组白名单 —— 既不进 known
  // (我们不读),也不当 unknown (不 redirect 吃它)。
  // **未来 Next.js 改协议时,需要同步扩这个集合。**
  //
  // 注意:此检查必须先于 cleanText 校验,否则空 text 也会先 redirect('/')。
  const KNOWN_KEYS = new Set(['text', 'text[]', 'source', 'level'])
  const NEXT_INTERNAL_QUERY_KEYS = new Set(['_rsc'])
  const unknownKeys = Object.keys(params).filter(
    (k) => !KNOWN_KEYS.has(k) && !NEXT_INTERNAL_QUERY_KEYS.has(k),
  )
  if (unknownKeys.length > 0) {
    const cleanQuery = new URLSearchParams()
    // text 优先(text[] 已被 firstParam 收敛掉),不重复写
    if (text !== undefined) cleanQuery.set('text', text)
    if (source !== undefined) cleanQuery.set('source', source)
    if (level !== undefined) cleanQuery.set('level', level)
    const qs = cleanQuery.toString()
    redirect(qs ? `/risk-alert?${qs}` : '/risk-alert')
  }

  const cleanText = (text ?? '').trim()
  if (!cleanText) {
    // text 缺失或纯空白 → 兜底回首页
    redirect('/')
  }

  // AI 升级路径:信任 route-with-ai 的判断,不再用 classifyRiskByRules 二次降级。
  // 理由:AI 嗅到的是语义风险(冒充亲属、扫二维码入群等),关键词规则看不到;
  // 如果这里再跑一遍 classifyRiskByRules,会基于 "我闺女" 等子串判为 low,
  // 然后把 AI 升级的决策"擦掉" → 老人被骗没人拦。
  if (source === 'ai') {
    const aiLevel: 'high' | 'critical' = level === 'critical' ? 'critical' : 'high'

    // Fix #3:URL reason 完全忽略 —— 不进 risk.reason、不写 audit log。
    // 攻击者可手拼 ?reason=请立即把验证码报给客服帮我解冻账户。
    // 两层防御:
    //   1. 本页根本不读 reason → 不进业务逻辑
    //   2. 顶部 unknown-key 检测会 redirect 到 canonical URL → 新 URL 无
    //      reason,新 RSC payload 也无 reason(参 smoke Fix #3)
    // 求助卡 summary 永远来自硬编码安全默认值。
    //
    // Fix #4:matchedKeywords 不再硬编码 [],而是真跑一遍
    // classifyRiskByRules(cleanText) 拿关键词结果 —— 这一路是 AI 升级,
    // 关键词可能没命中(语义风险),但有命中时要把"危险词"也展示给老人看
    // (同 medical-sms / public-security 路径的体验)。
    //
    // 注意:这里**只复用** matchedKeywords,不影响 level(level 走 aiLevel)。
    const keywordClassification = classifyRiskByRules(cleanText)
    const risk = {
      level: aiLevel,
      matchedKeywords: keywordClassification.matchedKeywords,
      reason: 'AI 嗅到风险信号,建议联系家人确认',
    }

    const question = createQuestion(cleanText, 'text', risk)
    const help: HelpRequest = buildHelpRequest(question)
    return <RiskAlertClient help={help} />
  }

  // 非 source=ai 路径:重新跑分类(忽略 URL 里可能存在的 level/keywords/reason,防篡改)
  const risk = classifyRiskByRules(cleanText)

  // 防御:非高风险输入不应该到这里 —— 兜底路由到正确路径
  if (!shouldStopGuidance(risk.level)) {
    if (risk.level === 'low' || risk.level === 'medium') {
      redirect(`/tutorial?text=${encodeURIComponent(cleanText)}`)
    }
    // 兜底(理论上 shouldStopGuidance 覆盖了所有情况,这里只是 type 完备)
    redirect('/')
  }

  // 包装成 QuestionRecord + HelpRequest
  const question = createQuestion(cleanText, 'text', risk)
  const help: HelpRequest = buildHelpRequest(question)

  return <RiskAlertClient help={help} />
}
