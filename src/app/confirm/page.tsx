/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * 低风险路径的「问对了吗」确认页(server component),渲染用户问题供二次确认。
 *
 * ## 输入
 * URL searchParams.text —— 由首页 routeToInput 跳转时附带。
 *
 * ## 输出
 * 静态页面 + 内嵌 <ConfirmActions>;text 为空时 redirect('/')。
 *
 * ## 定位
 * 中间路由 —— 只服务低/中风险分流,不接高风险(高风险已在首页走 /risk-alert)。
 * 服务端做空 text 兜底,客户端只装交互按钮。
 *
 * ## 依赖
 * next/navigation(redirect)、./confirm-actions(交互按钮 client 组件)。
 *
 * ## 维护规则
 * 改跳转路径要同步更新 docs/06 流程图;新增参数同步 update tutorial/page.tsx。
 */

/**
 * 确认页 — 低风险路径的「问对了吗」步骤。
 *
 * 输入路径:首页 classifyRiskByRules 判定 low/medium 后跳到这里。
 * 高风险输入永远不会到这里(首页直接跳 /risk-alert)。
 *
 * Server component:读 query 后渲染,交互按钮拆到 ConfirmActions(client)。
 * 这样:
 *   - 服务端可以做空 text 兜底 redirect
 *   - 客户端 bundle 只装按钮交互逻辑,不带 classify 规则库
 */

import { redirect } from 'next/navigation'

import { ConfirmActions } from './confirm-actions'

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ text?: string }>
}) {
  const { text } = await searchParams
  const cleanText = (text ?? '').trim()
  if (!cleanText) {
    redirect('/')
  }

  return (
    <main className="flex flex-col items-center min-h-full w-full max-w-2xl mx-auto px-6 py-10 sm:py-16">
      <header className="w-full text-center mb-10">
        <p className="text-lg text-[--color-muted] mb-2">请确认一下</p>
        <h1 className="text-3xl sm:text-4xl font-bold leading-snug">
          您是不是想解决:
        </h1>
      </header>

      <section className="w-full mb-10">
        <div className="w-full px-6 py-6 rounded-2xl bg-[--color-primary-soft] border-2 border-[--color-primary] text-center">
          <p className="text-2xl sm:text-3xl text-[--color-foreground] leading-relaxed break-words">
            「{cleanText}」
          </p>
        </div>
      </section>

      <ConfirmActions text={cleanText} />

      <footer className="mt-auto pt-10 text-center text-base text-[--color-muted]">
        如果不对,可以重新说一次
      </footer>
    </main>
  )
}
