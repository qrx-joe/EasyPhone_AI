'use client'

/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * 教程分步交互 client 组件:维护步进索引 + 展示当前步骤 + 「念给我听」/前进/没看到/点错了。
 *
 * ## 输入
 * props.text(原始问题)、props.tutorial(从 server 传入的 Tutorial)。
 *
 * ## 输出
 * 步进 UI + SpeakButton 触发语音播报;本地 state:currentStepIndex、
 * showAlternative、showResetWarning、speechRate(从 useSpeechRate 来)。
 *
 * ## 定位
 * 教程页的 UI 与状态机;不做风险判断(已在 server / 首页分流过),
 * 不存操作历史(留给 P1+)。
 *
 * ## 依赖
 * react(useState)、next/link、@/domain/tutorial/tutorial(Tutorial 类型)、
 * @/lib/speech/speak-button、@/lib/speech/speech-rate(useSpeechRate)。
 *
 * ## 维护规则
 * 改 step.alternative / step.instruction 显示规则要 e2e 跑通 M3 验收;
 * CompletedView 改动要保持「不直接跳走、给回首页出口」。
 */

/**
 * 教程分步交互 —— 客户端组件。
 *
 * 状态机(M3 验收):
 *   - currentStepIndex: 0..steps.length-1
 *   - showAlternative:  bool —— 用户点了「没看到」后,展示 step.alternative
 *   - showResetWarning: bool —— 用户点了「点错了」后,展示「安全返回」提示
 *
 * 三个按钮的语义:
 *   - 「好了,下一步」: 推进 currentStepIndex;到末尾后切换到「完成」视图
 *   - 「没看到这一步」: 切换 showAlternative (有 alternative 时)
 *   - 「点错了」: 切换 showResetWarning —— 提示「先停下来,点错了别继续」,
 *                 不直接退出,给老人一个"取消"动作避免误操作
 *
 * 不在 client 做风险判断(那是 server 的职责,首页已经分流过)。
 *
 * 不存:语音播报状态、用户操作历史、操作计时 —— 这些是 P1+ 增强,M3 不上。
 */

import Link from 'next/link'
import { useState } from 'react'

import type { Tutorial } from '@/domain/tutorial/tutorial'
import { SpeakButton } from '@/lib/speech/speak-button'
import { useSpeechRate } from '@/lib/speech/speech-rate'

interface Props {
  text: string
  tutorial: Tutorial
}

export function TutorialClient({ text, tutorial }: Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [showAlternative, setShowAlternative] = useState(false)
  const [showResetWarning, setShowResetWarning] = useState(false)
  const [showFamilyHelp, setShowFamilyHelp] = useState(false)
  // 语速档位(持久化到 localStorage,跨页面/跨刷新保留)
  const { rate: speechRate } = useSpeechRate()

  const isCompleted = currentStepIndex >= tutorial.steps.length
  const totalSteps = tutorial.steps.length

  if (isCompleted) {
    return <CompletedView text={text} tutorial={tutorial} />
  }

  const step = tutorial.steps[currentStepIndex]
  const progressLabel = `第 ${currentStepIndex + 1} 步,共 ${totalSteps} 步`
  const progressPercent = (currentStepIndex / totalSteps) * 100

  return (
    <main className="flex flex-col items-center min-h-full w-full max-w-2xl mx-auto px-6 py-8 sm:py-12">
      <header className="w-full text-center mb-5">
        <p className="text-base text-(--color-muted) mb-2">{tutorial.title}</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-(--color-foreground)">
          第 {currentStepIndex + 1} 步
        </h1>
      </header>

      <section className="w-full mb-5">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-base text-(--color-muted)">{progressLabel}</span>
        </div>
        <div
          className="w-full h-3 bg-(--color-soft) rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={progressLabel}
        >
          <div
            className="h-full bg-(--color-primary) transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      <section className="w-full mb-7 px-6 py-8 rounded-2xl bg-(--color-primary-soft) border-2 border-(--color-primary)">
        <p className="text-lg font-semibold text-(--color-primary) mb-4">
          {showAlternative ? '换个说法' : step.title}
        </p>
        <p className="text-3xl sm:text-4xl font-bold leading-relaxed text-(--color-foreground)">
          {showAlternative && step.alternative
            ? step.alternative
            : step.instruction}
        </p>
        {showAlternative && step.alternative && (
          <p className="mt-4 text-lg text-(--color-muted)">
            看看这样说是不是更清楚
          </p>
        )}

        <div className="mt-5">
          <SpeakButton
            text={showAlternative && step.alternative ? step.alternative : step.instruction}
            options={{ rate: speechRate }}
          />
        </div>
      </section>

      {/* 「点错了」警告(临时显示,点「我知道了」关闭) */}
      {showResetWarning && (
        <section
          className="w-full mb-6 px-6 py-5 rounded-xl bg-(--color-danger-soft) border-2 border-(--color-danger)"
          role="alert"
        >
          <p className="text-xl font-semibold text-(--color-danger) mb-2">
            先停下来
          </p>
          <p className="text-lg leading-relaxed text-(--color-foreground)">
            不要再点别的。
            <br />
            可以让家人看看,或者回到开始。
          </p>
        </section>
      )}

      <section className="w-full flex flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            setShowResetWarning(false)
            setShowAlternative(false)
            setShowFamilyHelp(false)
            setCurrentStepIndex(currentStepIndex + 1)
          }}
          className="w-full min-h-[72px] px-6 py-4 rounded-2xl bg-(--color-primary) hover:bg-(--color-primary-hover) active:scale-[0.98] transition text-white text-2xl font-semibold shadow-sm"
          aria-label="完成当前步骤,进入下一步"
        >
          好了,下一步
        </button>

        {step.alternative && (
          <button
            type="button"
            onClick={() => setShowAlternative((v) => !v)}
            className="w-full min-h-[64px] px-6 py-3 rounded-xl bg-(--color-soft) hover:bg-(--color-soft-hover) active:scale-[0.99] transition text-(--color-foreground) text-xl font-medium border border-(--color-border)"
            aria-pressed={showAlternative}
            aria-label="没找到,换一种说法"
          >
            {showAlternative ? '看原来的说法' : '没找到'}
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowResetWarning((v) => !v)}
          className="w-full min-h-[64px] px-6 py-3 rounded-xl bg-(--color-soft) hover:bg-(--color-soft-hover) active:scale-[0.99] transition text-(--color-foreground) text-xl font-medium border border-(--color-border)"
          aria-pressed={showResetWarning}
          aria-label="如果点错了按钮,先停下来"
        >
          {showResetWarning ? '我知道了' : '我点错了'}
        </button>
        <button
          type="button"
          onClick={() => setShowFamilyHelp((v) => !v)}
          className="w-full min-h-[64px] px-6 py-3 rounded-xl bg-(--color-soft) hover:bg-(--color-soft-hover) active:scale-[0.99] transition text-(--color-foreground) text-xl font-medium border border-(--color-border)"
          aria-expanded={showFamilyHelp}
        >
          让家人看看
        </button>
      </section>

      {showFamilyHelp && (
        <section className="w-full mt-5 px-6 py-5 rounded-xl bg-white border-2 border-(--color-border)">
          <p className="text-lg font-semibold text-(--color-foreground) mb-3">
            可以把这句话给家人看
          </p>
          <p className="text-xl leading-relaxed text-(--color-foreground)">
            我正在学这个操作:「{tutorial.title}」。现在卡在第{' '}
            {currentStepIndex + 1} 步:「{step.title}」。你有空帮我看一下。
          </p>
        </section>
      )}

      <footer className="mt-auto pt-8 text-center text-base text-(--color-muted)">
        <Link href="/" className="underline hover:text-(--color-foreground)">
          返回首页
        </Link>
      </footer>
    </main>
  )
}

/**
 * 教程完成视图。
 * 适老化:大勾 + 一句话总结 + 2 个出口(回首页 / 结束)。
 */
function CompletedView({ text, tutorial }: Props) {
  return (
    <main className="flex flex-col items-center min-h-full w-full max-w-2xl mx-auto px-6 py-10 sm:py-16">
      <div
        className="w-32 h-32 rounded-full bg-(--color-primary) text-white flex items-center justify-center text-6xl font-bold mb-6 shadow-md"
        aria-hidden
      >
        好
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4">
        完成了
      </h1>

      <p className="text-xl text-(--color-foreground) text-center mb-8 leading-relaxed">
        您已经走完「{tutorial.title}」的所有步骤
      </p>

      <section className="w-full mb-8 px-6 py-5 rounded-xl bg-(--color-soft) text-center">
        {/* 标签用 foreground 而非 muted:muted(#6b7280)× soft(#f3f4f6)= 4.39:1 跌破 AA 正文 4.5。
            层级区分靠字号(text-base < text-lg),不靠颜色。见 src/lib/a11y/contrast.test.ts。 */}
        <p className="text-base text-(--color-foreground) mb-1">您之前说的是</p>
        <p className="text-lg text-(--color-foreground) font-medium break-words">「{text}」</p>
      </section>

      <section className="w-full flex flex-col gap-3">
        <Link
          href="/"
          className="w-full text-center min-h-[64px] px-6 py-3 rounded-xl bg-(--color-primary) hover:bg-(--color-primary-hover) text-white text-xl font-semibold flex items-center justify-center"
        >
          返回首页
        </Link>
        <p className="text-center text-base text-(--color-muted) mt-2">
          如果还有别的问题,重新说一次就行
        </p>
      </section>
    </main>
  )
}
