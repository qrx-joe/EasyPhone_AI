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
 * 不信 URL 里的 level/keywords/reason,防手拼 URL 绕过。
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
 *   1. server: 读 ?text=&source=&level=&reason=
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
 * URL 上不再依赖首页传的 level/keywords/reason(query 简化)—— 首页实现保留向后兼容,
 * 多余参数被忽略即可,不影响 server 决策。
 */

import { redirect } from 'next/navigation'

import { classifyRiskByRules } from '@/domain/risk/classify-risk'
import { shouldStopGuidance } from '@/domain/risk/types'
import { createQuestion } from '@/domain/question/question'
import { buildHelpRequest } from '@/domain/help/help-templates'
import type { HelpRequest } from '@/domain/help/help-request'

import { RiskAlertClient } from './risk-alert-client'

interface PageProps {
  searchParams: Promise<{
    text?: string
    /** 信任信号:route-with-ai 的 AI 升级路径会带 source=ai */
    source?: string
    /** 可选:AI 升级时带的 level(high) + reason(AI 兜底:...),用于显示 */
    level?: string
    reason?: string
  }>
}

export default async function RiskAlertPage({ searchParams }: PageProps) {
  const { text, source, level, reason } = await searchParams
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
    const aiReason = (reason ?? '').trim() || 'AI 嗅到风险信号,建议联系家人确认'
    const risk = {
      level: aiLevel,
      matchedKeywords: [] as string[],
      reason: aiReason,
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
