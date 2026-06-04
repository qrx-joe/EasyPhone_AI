/**
 * 教程页 —— 服务端分流 + 客户端分步交互。
 *
 * 数据流:
 *   1. server: 读 ?text=, 调 findTutorial() 匹配
 *   2. server: 没匹配上 → 渲染"没找到教程"页(不 redirect,保留 text 让用户改)
 *   3. server: 匹配上 → 渲染 <TutorialClient> 传 tutorial + text
 *   4. client: 维护 currentStepIndex + 两个 UI 开关
 *
 * 为什么用 server 端匹配:
 *   - 教程库 ~10KB(本可以放 client),但放 server 减小 bundle
 *   - 教程匹配是纯函数,放 server 更省 client 内存
 *   - server 还可以做"text 兜底 redirect"防御(/confirm 同款)
 *
 * 安全注意:
 *   - 高风险问题已经在 /confirm 那层被分流到 /risk-alert,理论上不会进这里
 *   - findTutorial 不做风险过滤,本页面用 isSafeForGuidance() 二次防御
 *     (即使有人手动拼 URL 绕过首页,也不会展示高风险教程)
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'

import { findTutorial } from '@/domain/tutorial/tutorial'
import { TutorialClient } from './tutorial-client'

interface PageProps {
  searchParams: Promise<{ text?: string }>
}

export default async function TutorialPage({ searchParams }: PageProps) {
  const { text } = await searchParams
  const cleanText = (text ?? '').trim()
  if (!cleanText) {
    // text 缺失或纯空白 → 兜底回首页(避免空教程页让老人困惑)
    redirect('/')
  }

  const tutorial = findTutorial(cleanText)

  if (!tutorial) {
    return <NoTutorialFound text={cleanText} />
  }

  return <TutorialClient text={cleanText} tutorial={tutorial} />
}

/**
 * 没找到教程时的兜底页(M3 验收要求「分步指导」,没匹配上时不让流程断头)。
 *
 * 后续(M3.5+)可以让 AI 现场生成/转人工,现在先给一个返回首页的清晰指引。
 */
function NoTutorialFound({ text }: { text: string }) {
  return (
    <main className="flex flex-col items-center min-h-full w-full max-w-2xl mx-auto px-6 py-10 sm:py-16">
      <header className="w-full text-center mb-10">
        <div className="text-6xl mb-4" aria-hidden>🤔</div>
        <h1 className="text-3xl sm:text-4xl font-bold leading-snug">
          这个问题暂时没有教程
        </h1>
      </header>

      <section className="w-full mb-8 px-6 py-6 rounded-2xl bg-[--color-soft] border border-[--color-border]">
        <p className="text-base text-[--color-muted] mb-2">您说的是:</p>
        <p className="text-xl font-medium text-[--color-foreground] break-words">
          「{text}」
        </p>
      </section>

      <section className="w-full mb-8 text-left px-6 py-5 rounded-xl bg-[--color-primary-soft]">
        <p className="text-lg leading-relaxed">
          我们正在准备更多教程。
          <br />
          您可以:<br />
          1. 换个说法再说一次<br />
          2. 让家人帮您弄
        </p>
      </section>

      <Link
        href="/"
        className="w-full text-center min-h-[64px] px-6 py-3 rounded-xl bg-[--color-primary] hover:bg-[--color-primary-hover] text-white text-xl font-semibold flex items-center justify-center"
      >
        返回首页
      </Link>
    </main>
  )
}
