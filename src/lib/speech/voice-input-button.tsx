'use client'

/**
 * 首页「按住说话」按钮 —— 真实集成 Web Speech Recognition。
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

import { useRouter } from 'next/navigation'

import { classifyRiskByRules } from '@/domain/risk/classify-risk'
import { shouldStopGuidance } from '@/domain/risk/types'

import { useSpeechRecognition } from './use-speech-recognition.ts'

export function VoiceInputButton() {
  const router = useRouter()
  const { state, transcript, errorMessage, isSupported, start, stop } =
    useSpeechRecognition({
      onFinal: (text) => {
        // 走跟 goConfirm 一样的分流逻辑 —— 复用安全核心
        const r = classifyRiskByRules(text)
        const qs = new URLSearchParams({ text })
        if (shouldStopGuidance(r.level)) {
          qs.set('level', r.level)
          qs.set('keywords', r.matchedKeywords.join(','))
          qs.set('reason', r.reason)
          router.push(`/risk-alert?${qs.toString()}`)
        } else {
          router.push(`/confirm?${qs.toString()}`)
        }
      },
    })

  const isListening = state === 'listening' || state === 'ending'

  return (
    <div className="w-full flex flex-col gap-3">
      <button
        type="button"
        onClick={isListening ? stop : start}
        className={
          isListening
            ? 'w-full min-h-[80px] px-6 py-4 rounded-2xl bg-[--color-danger] text-white text-2xl font-semibold flex items-center justify-center gap-3 shadow-md animate-pulse'
            : 'w-full min-h-[80px] px-6 py-4 rounded-2xl bg-[--color-primary] hover:bg-[--color-primary-hover] active:scale-[0.98] transition text-white text-2xl font-semibold flex items-center justify-center gap-3 shadow-sm'
        }
        aria-label={isListening ? '正在听,点一下停止' : '按住说话提问'}
        aria-pressed={isListening}
      >
        <span aria-hidden className="text-3xl">
          {isListening ? '🔴' : '🎙'}
        </span>
        {isListening ? '正在听...点一下停' : '按住说话'}
      </button>

      {/* 实时 transcript 反馈(让老人知道系统听到了什么) */}
      {isListening && (
        <div
          className="w-full px-5 py-4 rounded-xl bg-white border-2 border-[--color-primary] text-left"
          aria-live="polite"
        >
          <p className="text-base text-[--color-muted] mb-1">我听到的是:</p>
          <p className="text-xl text-[--color-foreground] min-h-[1.5em] break-words">
            {transcript || '...'}
          </p>
        </div>
      )}

      {/* 错误提示(3 秒自动消失) */}
      {errorMessage && (
        <div
          className="w-full px-5 py-3 rounded-xl bg-[--color-danger-soft] border border-[--color-danger] text-left"
          role="alert"
        >
          <p className="text-base text-[--color-danger]">{errorMessage}</p>
          {!isSupported && (
            <p className="text-sm text-[--color-muted] mt-1">
              点击下面的「打字告诉我」也可以
            </p>
          )}
        </div>
      )}
    </div>
  )
}
