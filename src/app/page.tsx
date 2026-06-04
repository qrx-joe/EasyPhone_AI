'use client'

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
 *   - 语音功能:M2 阶段先做 UI + alert 占位,实际 WebSpeech 接入推到后续
 *
 * 路由约定:
 *   - 用户输入提交 → /confirm?text=...
 *   - 风险分流在 /confirm 页内完成,首页不直接判断
 */

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { classifyRiskByRules } from '@/domain/risk/classify-risk'
import { shouldStopGuidance } from '@/domain/risk/types'
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

  function goConfirm(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    // 安全核心:在路由之前先跑规则分类。
    // 高风险输入(critical/high)永不进入「你是不是想解决 XXX」的教程化引导,
    // 直接跳到风险提醒页,避免给老人一种「这事我们能教你做」的暗示。
    const r = classifyRiskByRules(trimmed)
    const qs = new URLSearchParams({ text: trimmed })
    if (shouldStopGuidance(r.level)) {
      qs.set('level', r.level)
      qs.set('keywords', r.matchedKeywords.join(','))
      qs.set('reason', r.reason)
      router.push(`/risk-alert?${qs.toString()}`)
    } else {
      router.push(`/confirm?${qs.toString()}`)
    }
  }

  function handleVoiceClick() {
    // 占位保留,真实语音逻辑迁到 <VoiceInputButton> 组件里。
    // 这个函数现在不会被调用(按钮 onClick 改成 <VoiceInputButton> 的 start),
    // 但保留签名稳定未来切换回 in-page 实现时不用改测试。
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
