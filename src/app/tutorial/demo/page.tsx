/**
 * /tutorial/demo —— Demo 直链路由。
 *
 * 目的(同 docs/06 §6 M6 验收"三个 Demo 场景可点击跑通"):
 *   让投资人/家人/队友**直接看 UI**,不用先语音/输入。
 *   演示时链接发出去,对方点开就在教程页。
 *
 * 设计:
 *   - **只接受预定义 case 列表里的 key**(白名单),不接受任意 text
 *     → 防「随手拼 ?text=敏感词」绕过输入页
 *   - 走 buildRouteForInput() —— **跟生产路径完全一致**
 *     → 安全不变量自动生效,即使将来 demo case 文本被改成高风险词,也会被分流
 *   - 只 1 次 server redirect(浏览器视角),到 /confirm(同生产路径)
 *     → 演示者能看到完整的「确认页 → 教程页」流程,而不是跳过确认页
 *
 * 已知 case(同首页 DEMO_CASES):
 *   - wechat  → 微信没有声音了
 *   - font    → 手机字太小看不清
 *   - space   → 手机空间不够
 */

import { redirect } from 'next/navigation'

import { buildRouteForInput } from '@/domain/routing/user-routing'

const TUTORIAL_DEMO_CASES: Record<string, string> = {
  wechat: '微信没有声音了',
  font: '手机字太小看不清',
  space: '手机空间不够',
}

interface PageProps {
  searchParams: Promise<{ case?: string }>
}

export default async function TutorialDemoPage({ searchParams }: PageProps) {
  const { case: caseKey } = await searchParams

  const text = TUTORIAL_DEMO_CASES[caseKey ?? '']
  if (!text) {
    // 未知 case → 兜底回首页,不留死链
    redirect('/')
  }

  // 走生产路径(安全不变量统一)
  // 这里会跳到 /confirm(若 low/medium)或 /risk-alert(若 high/critical)
  const { href } = buildRouteForInput(text)
  redirect(href)
}
