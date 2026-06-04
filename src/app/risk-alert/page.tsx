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
 *   1. server: 读 ?text=
 *   2. server: 重新跑 classifyRiskByRules(text) —— **不信任 URL 里的 level/keywords/reason**
 *      任何 URL 篡改(降级 level、删除 reason 试图绕过文案)都无效
 *   3. server: 如果分类结果不是 high/critical → 兜底 redirect 到 /confirm
 *      (防御性:即使有人手动拼 /risk-alert?text=微信没声音,也会被路由到正确页面)
 *   4. server: buildHelpRequest(question) 一次性打包好卡片数据
 *   5. client: 渲染 + 复制 + 模拟发送
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
  searchParams: Promise<{ text?: string }>
}

export default async function RiskAlertPage({ searchParams }: PageProps) {
  const { text } = await searchParams
  const cleanText = (text ?? '').trim()
  if (!cleanText) {
    // text 缺失或纯空白 → 兜底回首页
    redirect('/')
  }

  // 重新跑分类(忽略 URL 里可能存在的 level/keywords/reason,防篡改)
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
