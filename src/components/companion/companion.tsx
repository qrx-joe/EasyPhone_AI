'use client'

/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * 陪伴小精灵 —— 纯 SVG 内联的语音人格视觉锚点。表达「我在听 / 我在教」两种
 * 陪伴状态,降低老人独自操作时的焦虑感。它是 TTS「那个慢慢跟你说话的人」的脸。
 *
 * ## 输入
 * props.mood('listening' | 'teaching')、props.speaking(是否正在说话)、
 * props.caption(精灵下方一句陪伴语)、props.size(像素)、props.className。
 *
 * ## 输出
 * 一个装饰性 SVG 圆脸 + 可选 caption 文本;无交互、无副作用、无 state。
 *
 * ## 定位
 * 纯展示组件。刻意做「三不」:不可点、不挡按钮、不进风险提醒页。
 * 在低风险场景是陪伴资产,在高风险场景会稀释恐惧感,所以调用方**不得**在
 * /risk-alert 引入本组件(见 docs/00-prd §5.3 / §9.4 的中断哲学)。
 *
 * ## 依赖
 * react(useId,给同页多实例的 SVG 渐变去重);globals.css 的 companion-* keyframes。
 *
 * ## 维护规则
 * - 保持 pointer-events-none 与 svg aria-hidden:一旦可点/可读屏,就违反适老铁律。
 * - 任何动画都必须在 prefers-reduced-motion 下停止(globals.css 已兜底)。
 * - 不要把它加进 risk-alert 页;若产品要在风险页放角色,必须换严肃/警示形态另做组件。
 */

import { useId } from 'react'

export type CompanionMood = 'listening' | 'teaching' | 'thinking'

interface CompanionProps {
  /**
   * 陪伴状态:
   *   listening=首页「我在听」,teaching=引导页「我在教」,
   *   thinking=AI 正在判断(路由 pending 期间的可见反馈)
   */
  mood?: CompanionMood
  /** 是否正在语音播报(嘴部开合)。默认 false=平静微笑。 */
  speaking?: boolean
  /** 精灵下方的一句陪伴语。省略则只显示脸。 */
  caption?: string
  /** 脸直径(px)。默认 88。 */
  size?: number
  className?: string
}

/**
 * 陪伴小精灵。
 *
 * 设计克制原则(为什么长这样):
 *   - 圆脸 + 两眼 + 一嘴 + 顶部小光点(「精灵」感,非纯脸),不做四肢/花哨动作。
 *   - listening/teaching 的差异靠「顶部光点亮度」+ caption 文字,不靠夸张表情,
 *     避免抢走老人对「当前该点哪」的注意力。
 *   - speaking=true 时嘴开合,让老人明白「声音是它发出来的」。
 */
export function Companion({
  mood = 'listening',
  speaking = false,
  caption,
  size = 88,
  className = '',
}: CompanionProps) {
  // 同页可能有多个精灵(未来),用 useId 隔离渐变 id 防冲突
  const gradId = useId().replace(/:/g, '')
  const isTeaching = mood === 'teaching'
  const isThinking = mood === 'thinking'
  // thinking 时顶部光点也点亮(「脑子在转」的最低成本表达)
  const glowActive = isTeaching || isThinking

  return (
    <div
      className={`pointer-events-none select-none flex flex-col items-center ${className}`}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="companion-breathe"
      >
        <defs>
          <radialGradient id={`face-${gradId}`} cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="var(--color-primary-soft)" />
            <stop offset="100%" stopColor="#c7dbfb" />
          </radialGradient>
        </defs>

        {/* 顶部小光点 + 天线 —— 「精灵」感来源;teaching 时更亮 */}
        <line
          x1="50"
          y1="10"
          x2="50"
          y2="20"
          stroke="var(--color-primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle
          cx="50"
          cy="7"
          r="4.5"
          fill="var(--color-primary)"
          className={glowActive ? 'companion-glow' : undefined}
          opacity={glowActive ? 1 : 0.55}
        />

        {/* 脸 */}
        <circle
          cx="50"
          cy="54"
          r="42"
          fill={`url(#face-${gradId})`}
          stroke="var(--color-primary)"
          strokeWidth="2.5"
        />

        {/* 两眼(眨眼动画,transform-origin 在自身几何中心) */}
        <g fill="var(--color-foreground)" className="companion-eyes">
          <circle cx="38" cy="50" r="5" />
          <circle cx="62" cy="50" r="5" />
        </g>

        {/* 嘴:speaking 开合椭圆 > thinking 小圆(「想」的表情) > 平静微笑弧 */}
        {speaking ? (
          <ellipse
            cx="50"
            cy="68"
            rx="9"
            ry="6"
            fill="var(--color-foreground)"
            className="companion-mouth-speak"
          />
        ) : isThinking ? (
          <circle
            cx="50"
            cy="69"
            r="4.5"
            fill="none"
            stroke="var(--color-foreground)"
            strokeWidth="3"
          />
        ) : (
          <path
            d="M38 66 Q50 76 62 66"
            fill="none"
            stroke="var(--color-foreground)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        )}
      </svg>

      {caption && (
        <p
          aria-live="polite"
          className="mt-2 text-base text-(--color-muted) text-center"
        >
          {caption}
        </p>
      )}
    </div>
  )
}
