/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * 高风险场景的 Demo 直链路由,给投资人/家人/队友 1 秒演示「系统怎么拦下来」。
 *
 * ## 输入
 * URL searchParams.case —— 白名单 key(medical-sms / public-security /
 * screen-share / apple-id / fake-benefit / overseas-bank / overseas-whatsapp)。
 *
 * ## 输出
 * 1 次 server redirect(到 /risk-alert 或兜底到 /);不在该页渲染任何 UI。
 *
 * ## 定位
 * 演示专用路由,白名单 case + 走 buildRouteForInput 统一入口;
 * 不接任意 text(防随手拼敏感词)。
 *
 * ## 依赖
 * next/navigation(redirect)、@/domain/routing/user-routing(buildRouteForInput)。
 *
 * ## 维护规则
 * 增删 demo case 同步更新本文件 RISK_DEMO_CASES 与文档 docs/06 §6 M6 验收清单。
 */

/**
 * /risk-alert/demo —— 高风险场景的 Demo 直链路由。
 *
 * 目的:
 *   - 投资人/家人/队友演示时**直接看风险页**,不用先输入
 *   - 路演(2-3 分钟,docs/06 §6 M6 验收)的"风险中断"是记忆点,
 *     这个路由就是用来 1 秒钟展示"系统怎么拦下来"的
 *
 * 设计(同 /tutorial/demo):
 *   - 白名单 case 列表,白名单外兜底回首页
 *   - 走 buildRouteForInput() 统一入口
 *   - 但这里所有 case 都是高风险词,实际必定跳 /risk-alert
 *     (留 buildRouteForInput 防御性:万一日后 case 改成低风险词)
 *
 * 已知 case:
 *   - medical-sms     → 收到一条短信让我输验证码
 *   - public-security → 我是公安局的,你的账户涉嫌洗钱
 *   - screen-share    → 下载向日葵让我帮你
 *   - apple-id        → 把你的苹果账号和密码告诉我
 *   - fake-benefit    → 恭喜您中奖了,先交个人所得税
 *   - overseas-bank   → 英文银行账户冻结短信 + 陌生链接
 *   - overseas-whatsapp → WhatsApp 诱导屏幕共享
 */

import { redirect } from 'next/navigation'

import { buildRouteForInput } from '@/domain/routing/user-routing'

const RISK_DEMO_CASES: Record<string, string> = {
  'medical-sms': '收到一条短信让我输验证码',
  'public-security': '我是公安局的,你的账户涉嫌洗钱',
  'screen-share': '下载向日葵让我帮你',
  'apple-id': '把你的苹果账号和密码告诉我',
  'fake-benefit': '恭喜您中奖了,先交个人所得税',
  'overseas-bank': 'I got a message saying my bank account frozen and I need to click the link',
  'overseas-whatsapp': 'Someone on WhatsApp told me to share your screen',
}

interface PageProps {
  searchParams: Promise<{ case?: string }>
}

export default async function RiskAlertDemoPage({ searchParams }: PageProps) {
  const { case: caseKey } = await searchParams

  const text = RISK_DEMO_CASES[caseKey ?? '']
  if (!text) {
    redirect('/')
  }

  const { href } = buildRouteForInput(text)
  redirect(href)
}
