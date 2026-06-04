'use client'

/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * 确认页两个大按钮(client 组件):「是的,继续」推进教程、「不是,重新说」回首页。
 *
 * ## 输入
 * props.text —— 用户原始问题(从父 server 组件透传)。
 *
 * ## 输出
 * 路由事件 router.push(`/tutorial?text=...`) 与 router.push('/')。
 *
 * ## 定位
 * 配合 confirm/page.tsx 的纯交互子组件;不持有业务状态,不读 URL。
 *
 * ## 依赖
 * next/navigation(useRouter)。
 *
 * ## 维护规则
 * 改跳转目标(去 tutorial 路径)要同步 review tutorial/page.tsx 的 query 约定。
 */

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
