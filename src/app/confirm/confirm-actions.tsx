'use client'

/**
 * 确认页交互按钮 — 拆出 client component,server 只读 query。
 */

import { useRouter } from 'next/navigation'

export function ConfirmActions({ text }: { text: string }) {
  const router = useRouter()

  function handleYes() {
    router.push(`/tutorial?text=${encodeURIComponent(text)}`)
  }

  function handleNo() {
    router.push('/')
  }

  return (
    <section className="w-full flex flex-col gap-4">
      <button
        type="button"
        onClick={handleYes}
        className="w-full min-h-[72px] px-6 py-4 rounded-2xl bg-[--color-primary] hover:bg-[--color-primary-hover] active:scale-[0.98] transition text-white text-2xl font-semibold shadow-sm"
      >
        ✓ 是的,继续
      </button>
      <button
        type="button"
        onClick={handleNo}
        className="w-full min-h-[64px] px-6 py-3 rounded-xl bg-[--color-soft] hover:bg-[--color-soft-hover] active:scale-[0.99] transition text-[--color-foreground] text-xl font-medium border border-[--color-border]"
      >
        ✗ 不是,重新说
      </button>
    </section>
  )
}
