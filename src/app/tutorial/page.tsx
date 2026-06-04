/**
 * 教程页 — 占位(M2 阶段)。
 *
 * 完整实现在 M3:
 *   - 匹配教程库,展示当前步骤
 *   - 每屏只一个动作
 *   - 「好了」「没看到」「点错了」三个按钮
 *   - 语音播报当前步骤
 *
 * M2 占位让低风险流程能闭环到「这里」,不留断头路。
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function TutorialPage({
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
      <header className="w-full text-center mb-8">
        <p className="text-lg text-[--color-muted] mb-2">您的问题</p>
        <h1 className="text-2xl sm:text-3xl font-bold leading-snug">
          「{cleanText}」
        </h1>
      </header>

      <section className="w-full px-6 py-10 rounded-2xl bg-[--color-soft] text-center mb-8">
        <div className="text-6xl mb-4" aria-hidden>
          📖
        </div>
        <h2 className="text-2xl font-semibold mb-3">教程功能开发中</h2>
        <p className="text-lg text-[--color-muted] leading-relaxed">
          这里之后会一步一步教您解决问题,每屏只一步,跟着做就行。
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
