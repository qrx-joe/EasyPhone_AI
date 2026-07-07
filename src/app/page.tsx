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
 *   2. 两个并列大按钮:点一下说问题 / 打字告诉我
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
import { useRef, useState } from 'react'

import { AppIcon } from '@/components/app-icon/app-icon'
import { Companion } from '@/components/companion/companion'
import type { TutorialApp } from '@/domain/tutorial/tutorial'
import { routeWithFallback } from '@/lib/ai/client-route'
import { VoiceInputButton } from '@/lib/speech/voice-input-button'

// app: 快捷入口的 App 磁贴归属(类型来自领域层 TutorialApp,不另造映射)
// risky: 高风险演示项,磁贴角上加红色「!」角标(模拟未读提醒的视觉语言)
const DEMO_CASES = [
  { label: '微信没有声音了', text: '微信没有声音了', app: 'wechat', risky: false },
  { label: '手机字太小看不清', text: '手机字太小看不清', app: 'system', risky: false },
  { label: '银行短信说账户被冻结', text: 'I got a message saying my bank account frozen and I need to click the link', app: 'sms', risky: true },
  { label: 'WhatsApp 让开屏幕共享', text: 'Someone on WhatsApp told me to share your screen', app: 'whatsapp', risky: true },
] as const satisfies readonly {
  label: string
  text: string
  app: TutorialApp
  risky: boolean
}[]

export default function HomePage() {
  const router = useRouter()
  const [mode, setMode] = useState<'idle' | 'text'>('idle')
  const [textInput, setTextInput] = useState('')
  const [showFamilyHelp, setShowFamilyHelp] = useState(false)
  // AI 判断 pending 态:GMI 推理 4~6s,老人必须看到「它在想」而不是死屏。
  // 精灵切 thinking + 按钮文案变化 = AI 工作的可见反馈(比赛「体现使用」+ 适老 UX)。
  const [isRouting, setIsRouting] = useState(false)

  // 走统一路由函数(安全核心:高风险绝不走 /confirm)
  //
  // 流程见 @/lib/ai/fetch-route 的 routeWithFallback —— 单一 source of truth:
  //   1. POST /api/route(text) — server 跑关键词保险丝 + AI 兜底
  //   2. 拿最终 { href, level } 走 router.push
  //   3. 失败时降级到 client-side routeToInput()(同步,纯关键词保险丝)
  //
  // in-flight 守卫:连点/连按会把旧 controller abort 掉,旧 promise resolve 时
  // helper 内部短路、不再 push,避免「新提交路径被旧结果覆盖」的闪烁/错跳。
  const inFlightRef = useRef<AbortController | null>(null)
  async function goConfirm(text: string): Promise<void> {
    inFlightRef.current?.abort()
    const ctrl = new AbortController()
    inFlightRef.current = ctrl
    setIsRouting(true)
    try {
      await routeWithFallback(router, text, 'home', { signal: ctrl.signal })
    } finally {
      // 成功时页面即将跳走,复位无感知;失败/降级路径必须复位,否则永久卡「在想」
      if (!ctrl.signal.aborted) setIsRouting(false)
    }
  }

  return (
    <main className="flex flex-col items-center min-h-full w-full max-w-2xl mx-auto px-6 py-8 sm:py-14">
      <header className="text-center mb-8 sm:mb-10">
        <Companion
          mood={isRouting ? 'thinking' : 'listening'}
          caption={isRouting ? '听到了,我帮您看看' : '我在听,您慢慢说'}
          className="mb-4"
        />
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-(--color-foreground)">
          爸妈别急
        </h1>
        <p className="mt-5 text-3xl sm:text-4xl font-bold leading-snug text-(--color-foreground)">
          不会弄手机?
        </p>
        <p className="mt-2 text-xl sm:text-2xl text-(--color-muted)">
          海外华人家庭的安全手机教练
        </p>
      </header>

      <section className="w-full flex flex-col gap-4 mb-8">
        <VoiceInputButton onRoutingChange={setIsRouting} />

        <button
          type="button"
          onClick={() => setShowFamilyHelp((v) => !v)}
          className="w-full min-h-[72px] px-6 py-4 rounded-2xl bg-(--color-danger-soft) hover:bg-red-100 active:scale-[0.98] transition text-(--color-danger) text-2xl font-semibold flex items-center justify-center border-2 border-(--color-danger) disabled:opacity-60 disabled:cursor-not-allowed"
          aria-expanded={showFamilyHelp}
        >
          让家人看看
        </button>

        {showFamilyHelp && (
          <section
            className="w-full px-6 py-5 rounded-2xl bg-white border-2 border-(--color-danger)"
            aria-live="polite"
          >
            <p className="text-xl font-semibold text-(--color-danger) mb-3">
              可以把这句话给家人看
            </p>
            <p className="text-2xl leading-relaxed font-bold text-(--color-foreground)">
              我手机遇到问题了。你有空帮我看一下。
            </p>
            <p className="mt-4 text-lg leading-relaxed text-(--color-foreground)">
              如果对方要验证码、OTP、转账、点链接或开屏幕共享,先不要操作,马上问家人。
            </p>
          </section>
        )}

        <button
          type="button"
          onClick={() => setMode(mode === 'text' ? 'idle' : 'text')}
          className="w-full min-h-[56px] px-5 py-3 rounded-xl bg-white hover:bg-(--color-soft) active:scale-[0.98] transition text-(--color-foreground) text-lg font-medium flex items-center justify-center border border-(--color-border)"
          aria-label="打字告诉我您的问题"
          aria-expanded={mode === 'text'}
        >
          不方便说话,打字
        </button>

        {/* 文字输入态(展开式,单屏一动作) */}
        {mode === 'text' && (
          <div className="mt-2 flex flex-col gap-3">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="比如:银行短信说账户被冻结"
              rows={3}
              autoFocus
              className="w-full px-5 py-4 text-xl rounded-xl border-2 border-(--color-border) focus:border-(--color-primary) bg-white outline-none resize-none"
              aria-label="问题描述"
            />
            <button
              type="button"
              onClick={() => goConfirm(textInput)}
              disabled={!textInput.trim() || isRouting}
              className="w-full min-h-[64px] px-6 py-3 rounded-xl bg-(--color-primary) hover:bg-(--color-primary-hover) disabled:bg-(--color-muted) disabled:cursor-not-allowed transition text-white text-xl font-semibold"
              aria-busy={isRouting}
            >
              {isRouting ? '听到了,我帮您看看' : '告诉我'}
            </button>
          </div>
        )}
      </section>

      <section className="w-full mt-2">
        <h2 className="text-base text-(--color-muted) mb-3 px-1">也可以点一个常见问题</h2>
        <div className="flex flex-col gap-3">
          {DEMO_CASES.map((c) => (
            <button
              key={c.text}
              type="button"
              onClick={() => goConfirm(c.text)}
              disabled={isRouting}
              className="w-full min-h-[60px] px-5 py-3 rounded-xl bg-white hover:bg-(--color-soft) active:scale-[0.99] transition text-left text-lg text-(--color-foreground) border border-(--color-border) flex items-center gap-4 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label={`常见问题:${c.label}`}
            >
              {/* App 磁贴纯装饰;risky 项加红「!」角标提示「这条有问题」。
                  wrapper 必须显式 inline-flex:行内盒做绝对定位锚点时锚的是
                  文字行框(比 48px 磁贴矮),角标会飘到磁贴下方。 */}
              <span className="relative inline-flex shrink-0">
                <AppIcon app={c.app} />
                {c.risky && (
                  <span
                    aria-hidden
                    className="absolute -top-1.5 -right-1.5 w-[22px] h-[22px] rounded-full bg-(--color-danger) text-white text-sm font-bold leading-none flex items-center justify-center border-2 border-white"
                  >
                    !
                  </span>
                )}
              </span>
              <span className="flex-1">{c.label}</span>
              <span aria-hidden className="text-(--color-muted)">›</span>
            </button>
          ))}
        </div>
      </section>

      {/* 页脚提示 */}
      <footer className="mt-auto pt-8 text-center text-base text-(--color-muted)">
        不会读取您的短信、通讯录或位置。遇到 OTP、银行链接、屏幕共享会先停下。
      </footer>
    </main>
  )
}
