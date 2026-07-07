'use client'

/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * 风险提醒页的 client 组件,渲染停止提醒、求助文字、复制到剪贴板与返回首页。
 *
 * ## 输入
 * props.help(HelpRequest,来自父 server 组件的预打包数据)。
 *
 * ## 输出
 * 按钮 click 事件(复制/演示发送/展开说明/返回)、剪贴板写入、alert 弹窗;
 * 本地状态 copyState(idle/success/error)。
 *
 * ## 定位
 * 风险页的 UI 层,只做展示与交互;**不**做风险判断、**不**拼卡片文本。
 * 复制失败时降级为「长按文本框选中」提示,避免主流程崩溃。
 *
 * ## 依赖
 * react(useState)、next/link、@/domain/help/help-request(HelpRequest)、
 * @/domain/help/card-serialization(serializeHelpCard)、浏览器 Clipboard API。
 *
 * ## 维护规则
 * 改按钮文案同步 review 适老化词表;改复制逻辑要做 e2e 验 Safari/微信浏览器
 * (clipboard 在 insecure context 会失败)。
 */

/**
 * 风险提醒页 —— 客户端组件。
 *
 * 展示内容:
 *   1. 大红色「停」标识 + 标题("先别操作,这可能是诈骗")
 *   2. summary 人话解释
 *   3. 第一屏只展示禁止动作 + 求助入口,先打断风险操作。
 *   4. 展开说明后再展示 question.text、summary 与行动建议。
 *   5. 操作按钮:
 *      - 「让家人看看」: 调 Clipboard API 把 serializeHelpCard 写进剪贴板
 *      - 「演示发送给家人」: 弹个 alert 模拟"已发送"反馈(不真发短信/微信)
 *      - 「返回首页」: 放弃
 *   6. 底部:风险等级 + 产品承诺
 *
 * 不在 client 做风险判断(那是 server 的职责)。
 * 不在 client 写剪贴板失败时崩溃:try/catch + 友好的错误提示。
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'

import type { HelpRequest } from '@/domain/help/help-request'
import { serializeHelpCard } from '@/domain/help/card-serialization'

interface Props {
  help: HelpRequest
}

export function RiskAlertClient({ help }: Props) {
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>(
    'idle',
  )
  const [showDetails, setShowDetails] = useState(false)
  // AI 升级版 summary(形态 ③)。null = 还没有/失败,一律显示模板 summary。
  // 页面**永远**先用模板秒开 —— 「停」不等 AI。
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiPending, setAiPending] = useState(true)

  useEffect(() => {
    const ctrl = new AbortController()
    void (async () => {
      try {
        const res = await fetch('/api/help-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: help.question.text,
            level: help.riskLevel === 'critical' ? 'critical' : 'high',
          }),
          signal: ctrl.signal,
        })
        if (!res.ok) return
        const data = (await res.json()) as { summary?: unknown }
        // 客户端也做一次类型收敛 —— 不信任何网络边界
        if (typeof data.summary === 'string' && data.summary.trim()) {
          setAiSummary(data.summary.trim())
        }
      } catch {
        // fail-open:模板 summary 已在屏上,静默即可
      } finally {
        if (!ctrl.signal.aborted) setAiPending(false)
      }
    })()
    return () => ctrl.abort()
  }, [help.question.text, help.riskLevel])

  // 展示/复制/预览统一用同一份数据 —— 老人看到的就是发出去的
  const displayHelp: HelpRequest = aiSummary
    ? { ...help, summary: aiSummary }
    : help

  async function handleCopy() {
    const text = serializeHelpCard(displayHelp)
    try {
      // Clipboard API 需要 secure context (https / localhost),且需要 user gesture
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        setCopyState('success')
        // 3 秒后回到 idle,避免按钮永远显示"已复制"
        setTimeout(() => setCopyState('idle'), 3000)
      } else {
        throw new Error('当前浏览器不支持剪贴板 API')
      }
    } catch (err) {
      console.error('[risk-alert] 复制失败:', err)
      setCopyState('error')
      setTimeout(() => setCopyState('idle'), 3000)
    }
  }

  function handleSimulatedSend() {
    // M4 占位:实际不调用任何短信/微信 API
    // 仅给老人一个"操作有反馈"的体验,避免点了没反应以为坏了
    alert(
      '【模拟发送】\n\n实际版本会调用家人手机/微信。\n本次为演示,没有真实发送。',
    )
  }

  return (
    <main className="flex flex-col items-center min-h-full w-full max-w-2xl mx-auto px-6 py-8 sm:py-12">
      <div
        className="w-36 h-36 rounded-full bg-(--color-danger) text-white flex items-center justify-center text-7xl font-bold mb-6 shadow-md"
        aria-hidden
      >
        停
      </div>

      <h1 className="text-4xl sm:text-5xl font-bold text-(--color-danger) text-center mb-5 leading-tight">
        先别点
      </h1>

      <section className="w-full mb-7 px-6 py-6 rounded-2xl bg-(--color-danger-soft) border-2 border-(--color-danger)">
        <ul className="text-2xl sm:text-3xl font-bold leading-relaxed text-(--color-foreground) space-y-3">
          <li>不要转账。</li>
          <li>不要说验证码。</li>
          <li>不要点陌生链接。</li>
        </ul>
      </section>

      <section className="w-full flex flex-col gap-3 mb-6">
        <button
          type="button"
          onClick={handleCopy}
          className="w-full min-h-[72px] px-6 py-4 rounded-2xl bg-(--color-primary) hover:bg-(--color-primary-hover) active:scale-[0.98] transition text-white text-2xl font-semibold shadow-sm"
          aria-label="把家人求助卡内容复制到剪贴板"
        >
          {copyState === 'success'
            ? '已经复制好了'
            : copyState === 'error'
              ? '复制失败,看下面文字'
              : '让家人看看'}
        </button>

        <button
          type="button"
          onClick={handleSimulatedSend}
          className="w-full min-h-[64px] px-6 py-3 rounded-xl bg-(--color-soft) hover:bg-(--color-soft-hover) active:scale-[0.99] transition text-(--color-foreground) text-xl font-medium border border-(--color-border)"
          aria-label="模拟把卡片发给家人"
        >
          演示发送给家人
        </button>

        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="w-full min-h-[64px] px-6 py-3 rounded-xl bg-(--color-soft) hover:bg-(--color-soft-hover) active:scale-[0.99] transition text-(--color-foreground) text-xl font-medium border border-(--color-border)"
          aria-expanded={showDetails}
        >
          {showDetails ? '收起说明' : '看看原因'}
        </button>

        <Link
          href="/"
          className="w-full text-center min-h-[64px] px-6 py-3 rounded-xl bg-(--color-soft) hover:bg-(--color-soft-hover) text-(--color-foreground) text-xl font-medium border border-(--color-border) flex items-center justify-center"
        >
          返回首页
        </Link>
      </section>

      {showDetails && (
        <section className="w-full mb-6">
          <section className="w-full mb-6 px-6 py-5 rounded-xl bg-white border border-(--color-border)">
            <p className="text-base text-(--color-muted) mb-2">您刚才说到</p>
            <p className="text-xl font-medium text-(--color-foreground) break-words mb-3">
              「{help.question.text}」
            </p>
            <p className="text-lg text-(--color-foreground) leading-relaxed">
              {displayHelp.summary}
            </p>
            <p className="text-sm text-(--color-muted) mt-3" role="status">
              {aiPending
                ? '正在整理给家人看的说明'
                : aiSummary
                  ? '已经整理成给家人看的说明'
                  : ''}
            </p>
          </section>

          <section className="w-full mb-6 px-6 py-5 rounded-xl bg-(--color-soft)">
            <h2 className="text-xl font-semibold mb-3">现在请这样做</h2>
            <ol className="text-lg leading-loose list-decimal pl-6 space-y-1">
              {help.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </section>
        </section>
      )}

      {/* 复制成功/失败的视觉反馈(独立提示,即使按钮文字回 idle 也保留一秒) */}
      {copyState === 'success' && (
        <p
          className="text-center text-base text-(--color-primary) mb-4"
          role="status"
        >
          已复制。现在可以打开微信,长按输入框,粘贴给家人。
        </p>
      )}
      {copyState === 'error' && (
        <p
          className="text-center text-base text-(--color-danger) mb-4"
          role="alert"
        >
          自动复制失败,试试长按下面的卡片内容选中
        </p>
      )}

      <details className="w-full mb-6 px-4 py-3 rounded-xl bg-white border border-(--color-border)">
        <summary className="text-base text-(--color-muted) cursor-pointer">
          给家人的文字
        </summary>
        <pre className="mt-3 text-sm leading-relaxed whitespace-pre-wrap break-words text-(--color-foreground)">
          {serializeHelpCard(displayHelp)}
        </pre>
      </details>

      <footer className="mt-auto pt-6 text-center text-sm text-(--color-muted)">
        <p>
          风险等级:
          <span className="font-semibold text-(--color-danger)">
            {help.riskLevel === 'critical' ? ' 极高' : ' 高'}
          </span>
        </p>
        <p className="mt-1">不会读取您的短信、通讯录或位置</p>
      </footer>
    </main>
  )
}
