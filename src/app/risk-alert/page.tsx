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
