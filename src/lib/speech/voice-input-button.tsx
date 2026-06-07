'use client'

/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * 首页「点一下说问题」按钮 UI:点一下开始听,识别到 final 后自动跳走,出错时给中文兜底。
 *
 * ## 输入
 * 无 props;内部调 useSpeechRecognition,onFinal 走 routeToInput 路由。
 *
 * ## 输出
 * 点击切换 start/stop 事件;路由跳转(/confirm 或 /risk-alert);
 * 实时 transcript 反馈 + 错误提示(均本地 state)。
 *
 * ## 定位
 * 首页的主语音入口;**不**做风险判断,跟文本输入共用 routeToInput。
 * 不支持时父级要保证文本输入仍可用。
 *
 * ## 依赖
 * next/navigation(useRouter)、@/domain/routing/user-routing(routeToInput)、
 * ./use-speech-recognition.ts。
 *
 * ## 维护规则
 * 改按钮文案/颜色同步 review 适老化词表;
 * 改 onFinal 行为(比如改成不自动跳)要在首页 UX 走查。
 */

/**
 * 首页「点一下说问题」按钮 —— 真实集成 Web Speech Recognition。
 *
 * 行为:
 *   - 点一下:开始听,按钮变红色 + 显示实时识别文本
 *   - 识别到 final:自动跳走(走 onFinal 回调,父组件负责跳转)
 *   - 再点:停止识别
 *   - 浏览器不支持 / 出错:显示中文错误提示,父组件用文本兜底继续可用
 *
 * 适老化:
 *   - 按钮足够大(min-h-80px),状态切换有视觉/文字双反馈
 *   - 实时 transcript 字号大,老人能看清「系统听到的是什么」
 *   - 出错时给「下一步怎么做」(用打字告诉我)
 */

import { useRef } from 'react'
import { useRouter } from 'next/navigation'

import { routeWithFallback } from '@/lib/ai/client-route'

import { useSpeechRecognition } from './use-speech-recognition.ts'

export function VoiceInputButton() {
  const router = useRouter()
  // in-flight 守卫:和 <HomePage> 同款,连说两次只走最后一次的路由
  const inFlightRef = useRef<AbortController | null>(null)
  const { state, transcript, errorMessage, isSupported, start, stop } =
    useSpeechRecognition({
      onFinal: (text) => {
        // 跟 <HomePage> 的 goConfirm 走同一路径:AI 兜底 → 失败时关键词保险丝
        // useSpeechRecognition 不 await onFinal,所以这里 fire-and-forget,
        // 但内部用 try/catch 保证不会冒泡到语音状态机
        void (async () => {
          inFlightRef.current?.abort()
          const ctrl = new AbortController()
          inFlightRef.current = ctrl
          await routeWithFallback(router, text, 'voice', { signal: ctrl.signal })
        })()
      },
    })

  const isListening = state === 'listening' || state === 'ending'
  const isUnavailable = Boolean(errorMessage && !isSupported)
  const idleLabel = errorMessage
    ? isUnavailable
      ? '语音暂时用不了'
      : '再点一次说问题'
    : '点一下说问题'
  const buttonLabel = isListening ? '正在听,点一下停' : idleLabel

  return (
    <div className="w-full flex flex-col gap-3">
      <button
        type="button"
        onClick={isListening ? stop : start}
        className={
          isListening
            ? 'w-full min-h-[80px] px-6 py-4 rounded-2xl bg-(--color-danger) text-white text-2xl font-semibold flex flex-col items-center justify-center gap-1 shadow-md animate-pulse'
            : isUnavailable
              ? 'w-full min-h-[80px] px-6 py-4 rounded-2xl bg-(--color-soft) hover:bg-(--color-soft-hover) active:scale-[0.98] transition text-(--color-foreground) text-2xl font-semibold flex flex-col items-center justify-center gap-1 border-2 border-(--color-border)'
              : 'w-full min-h-[80px] px-6 py-4 rounded-2xl bg-(--color-primary) hover:bg-(--color-primary-hover) active:scale-[0.98] transition text-white text-2xl font-semibold flex flex-col items-center justify-center gap-1 shadow-sm'
        }
        aria-label={isListening ? '正在听,点一下停止' : buttonLabel}
        aria-pressed={isListening}
      >
        <span>{buttonLabel}</span>
        {errorMessage && !isListening && (
          <span
            className={
              isUnavailable
                ? 'text-base font-medium text-(--color-muted)'
                : 'text-base font-medium text-white'
            }
            role="status"
          >
            {errorMessage}
          </span>
        )}
      </button>

      {/* 实时 transcript 反馈(让老人知道系统听到了什么) */}
      {isListening && (
        <div
          className="w-full px-5 py-4 rounded-xl bg-white border-2 border-(--color-primary) text-left"
          aria-live="polite"
        >
          <p className="text-base text-(--color-muted) mb-1">我听到的是:</p>
          <p className="text-xl text-(--color-foreground) min-h-[1.5em] break-words">
            {transcript || '...'}
          </p>
        </div>
      )}

    </div>
  )
}
