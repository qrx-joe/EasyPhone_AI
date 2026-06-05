'use client'

/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * 适老化入口页,提供语音/打字两种提问入口和 3 个常见问题快捷入口。
 *
 * ## 输入
 * 用户点击语音/打字/常见问题按钮;文本来自 useState(textInput) 与 DEMO_CASES。
 *
 * ## 输出
 * 跳转事件 —— 通过 routeToInput(router, text) 跳到 /confirm 或 /risk-alert;
 * 当前模式态 mode 与 textInput(本地)。
 *
 * ## 定位
 * 整个问答主流程的入口,负责把用户原始输入交给统一路由函数;
 * 不做风险判断(由 @/domain/routing/user-routing 决定走哪条路)。
 *
 * ## 依赖
 * next/navigation(useRouter)、@/domain/routing/user-routing(routeToInput)、
 * @/lib/speech/voice-input-button(VoiceInputButton)、React useState。
 *
 * ## 维护规则
 * 改路由分流时同步检查 @/domain/routing/user-routing 的单元测试;
 * 新增 DEMO_CASES 同步在 src/app/tutorial/demo/page.tsx 加白名单。
 */

/**
 * 首页 — 入口页。
 *
 * 结构(C 决策 2026-06-04):
 *   1. 大标题「爸妈别急」+ 副标「您遇到什么问题?」
 *   2. 两个并列大按钮:🎙 按住说话 / ⌨ 打字告诉我
 *   3. 三个常见问题快捷入口(微信没声音 / 字太小 / 验证码短信)
 *
 * 适老化:
 *   - 所有按钮 min-h ≥ 56px(html font-size 22px 下,Tailwind min-h-14 = 56px)
 *   - 主按钮 56~64px,字号 text-xl(27.5px)
 *   - 单屏一动作:点击「打字告诉我」后才出现 textarea,避免一开始就一堆控件
 *
 * 路由约定:
 *   - 用户输入 → routeToInput() (在 src/domain/routing/user-routing.ts)
 *     这是**唯一**做"高风险不走 confirm 教程"分流的地方
 *     之前这里写过一版,跟 <VoiceInputButton> 里重复 —— 已抽出去
 */

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { routeToInput } from '@/domain/routing/user-routing'
import { fetchRoute } from '@/lib/ai/fetch-route'
import { VoiceInputButton } from '@/lib/speech/voice-input-button'

const DEMO_CASES = [
  { emoji: '📱', label: '微信没有声音了',     text: '微信没有声音了' },
  { emoji: '🔍', label: '手机字太小看不清',   text: '手机字太小看不清' },
  { emoji: '⚠️', label: '收到要验证码的短信', text: '收到一条短信让我输验证码' },
] as const

export default function HomePage() {
  const router = useRouter()
  const [mode, setMode] = useState<'idle' | 'text'>('idle')
  const [textInput, setTextInput] = useState('')

  // 走统一路由函数(安全核心:高风险绝不走 /confirm)
  //
  // 流程:
  //   1. POST /api/route(text) — server 跑关键词保险丝 + AI 兜底
  //   2. 拿最终 { href, level } 走 router.push
  //   3. 失败时降级到 client-side routeToInput()(同步,纯关键词保险丝)
  //
  // 降级路径是关键词保险丝的"双保险":即使 /api/route 整层挂掉,
  // 老人产品仍然安全(只是失去 AI 兜底,关键词 16 个验收用例照常生效)。
  async function goConfirm(text: string): Promise<void> {
    try {
      const { href } = await fetchRoute(text)
      router.push(href)
    } catch (err) {
      console.warn('[home] /api/route failed, falling back to keyword routing', err)
      routeToInput(router, text)
    }
  }

  return (
    <main className="flex flex-col items-center min-h-full w-full max-w-2xl mx-auto px-6 py-10 sm:py-16">
      {/* 标题区 */}
      <header className="text-center mb-10 sm:mb-14">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[--color-foreground]">
          爸妈别急
        </h1>
        <p className="mt-3 text-xl sm:text-2xl text-[--color-muted]">
          您遇到什么问题?
        </p>
      </header>

      {/* 主操作区:两个并列大按钮 */}
      <section className="w-full flex flex-col gap-4 mb-10">
        <VoiceInputButton />

        <button
          type="button"
          onClick={() => setMode(mode === 'text' ? 'idle' : 'text')}
          className="w-full min-h-[80px] px-6 py-4 rounded-2xl bg-[--color-soft] hover:bg-[--color-soft-hover] active:scale-[0.98] transition text-[--color-foreground] text-2xl font-semibold flex items-center justify-center gap-3 border border-[--color-border]"
          aria-label="打字告诉我您的问题"
          aria-expanded={mode === 'text'}
        >
          <span aria-hidden className="text-3xl">⌨️</span>
          打字告诉我
        </button>

        {/* 文字输入态(展开式,单屏一动作) */}
        {mode === 'text' && (
          <div className="mt-2 flex flex-col gap-3">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="比如:微信没有声音了"
              rows={3}
              autoFocus
              className="w-full px-5 py-4 text-xl rounded-xl border-2 border-[--color-border] focus:border-[--color-primary] bg-white outline-none resize-none"
              aria-label="问题描述"
            />
            <button
              type="button"
              onClick={() => goConfirm(textInput)}
              disabled={!textInput.trim()}
              className="w-full min-h-[64px] px-6 py-3 rounded-xl bg-[--color-primary] hover:bg-[--color-primary-hover] disabled:bg-[--color-muted] disabled:cursor-not-allowed transition text-white text-xl font-semibold"
            >
              告诉我
            </button>
          </div>
        )}
      </section>

      {/* 常见问题 */}
      <section className="w-full">
        <h2 className="text-lg text-[--color-muted] mb-4 px-1">常见问题</h2>
        <div className="flex flex-col gap-3">
          {DEMO_CASES.map((c) => (
            <button
              key={c.text}
              type="button"
              onClick={() => goConfirm(c.text)}
              className="w-full min-h-[64px] px-5 py-3 rounded-xl bg-white hover:bg-[--color-soft] active:scale-[0.99] transition text-left text-xl text-[--color-foreground] border border-[--color-border] flex items-center gap-4"
              aria-label={`常见问题:${c.label}`}
            >
              <span aria-hidden className="text-2xl flex-shrink-0">{c.emoji}</span>
              <span className="flex-1">{c.label}</span>
              <span aria-hidden className="text-[--color-muted]">›</span>
            </button>
          ))}
        </div>
      </section>

      {/* 页脚提示 */}
      <footer className="mt-auto pt-12 text-center text-base text-[--color-muted]">
        不会读取您的短信、通讯录或位置
      </footer>
    </main>
  )
}
