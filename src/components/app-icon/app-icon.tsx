/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * App 磁贴图标 —— 模拟手机桌面 App 图标的彩色圆角方块(微信绿/短信绿/WhatsApp 绿/设置灰)。
 * 老人认 App 靠桌面图标的颜色块,不靠文字;磁贴提升「说的是哪个 App」的识别度。
 *
 * ## 输入
 * props.app(TutorialApp:'wechat' | 'sms' | 'whatsapp' | 'system')、
 * props.size('md' 48px | 'sm' 36px,默认 'md')、props.className。
 *
 * ## 输出
 * 一个装饰性彩色磁贴 span + 内嵌白色 SVG 图形;无交互、无 state。
 *
 * ## 定位
 * 纯展示组件,永远作为文字标签的**辅助**出现(适老铁律:文字为主标签,
 * 图标不单独承载语义)。app 归属信息来自领域层 Tutorial.app 字段,
 * 不在 UI 层各自维护映射副本。
 *
 * ## 依赖
 * @/domain/tutorial/tutorial(TutorialApp 类型)。
 *
 * ## 维护规则
 * - 保持 aria-hidden:图标是装饰,语义永远由旁边的文字承载。
 * - 微信/WhatsApp 图形是仿制轮廓,Demo/比赛可用;**商用/上架前必须**换成
 *   官方 brand assets 或抽象化处理(商标风险)。集中在本组件,一键可换。
 * - 新增 App:先在 domain 的 TutorialApp 加字面量,再在这里补磁贴,
 *   两处不同步时 tutorial.test.ts 的 app 字段测试会卡住。
 */

import type { TutorialApp } from '@/domain/tutorial/tutorial'

interface AppIconProps {
  app: TutorialApp
  /** md=48px(列表项),sm=36px(内嵌在卡片标题旁)。 */
  size?: 'md' | 'sm'
  className?: string
}

/** 各 App 磁贴的底色(手机桌面图标的"颜色块"记忆) */
const TILE_BG: Record<TutorialApp, string> = {
  wechat: '#07c160',
  sms: 'linear-gradient(180deg, #5bd669, #34c759)',
  whatsapp: '#25d366',
  system: 'linear-gradient(180deg, #9aa3ad, #6d7680)',
}

/**
 * App 磁贴图标。纯装饰(aria-hidden),文字标签始终在旁边由调用方渲染。
 */
export function AppIcon({ app, size = 'md', className = '' }: AppIconProps) {
  const px = size === 'md' ? 48 : 36
  const iconPx = size === 'md' ? 28 : 22

  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: px,
        height: px,
        borderRadius: size === 'md' ? 12 : 9,
        background: TILE_BG[app],
        boxShadow: '0 2px 6px rgba(60, 45, 25, 0.18)',
      }}
    >
      <AppGlyph app={app} px={iconPx} />
    </span>
  )
}

/** 磁贴内的白色图形(仿桌面图标轮廓,见维护规则的商标提示) */
function AppGlyph({ app, px }: { app: TutorialApp; px: number }) {
  switch (app) {
    case 'wechat':
      // 微信:双气泡
      return (
        <svg width={px + 2} height={px + 2} viewBox="0 0 36 36" fill="#ffffff">
          <path d="M13.5 6C8.3 6 4 9.6 4 14c0 2.5 1.4 4.7 3.5 6.2l-.9 2.9 3.3-1.7c1.1.3 2.3.5 3.6.5h.6a7.5 7.5 0 0 1-.3-2.1c0-4.4 4.2-7.9 9.3-7.9h.5C22.7 8.5 18.5 6 13.5 6zm-3.2 5.1a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zm6.4 0a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" />
          <path d="M23.7 13.5c-4.6 0-8.3 3-8.3 6.8 0 3.7 3.7 6.8 8.3 6.8 1 0 2-.2 2.9-.4l2.9 1.5-.8-2.5c1.9-1.3 3.3-3.2 3.3-5.4 0-3.7-3.7-6.8-8.3-6.8zm-2.8 4.4a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2zm5.6 0a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z" />
        </svg>
      )
    case 'sms':
      // 短信:气泡(iOS 信息桌面图标形)
      return (
        <svg width={px} height={px} viewBox="0 0 24 24" fill="#ffffff">
          <path d="M12 3C6.5 3 2 6.6 2 11c0 2.2 1.1 4.2 2.9 5.6-.2 1.1-.8 2.4-1.8 3.4 1.9-.2 3.6-.9 4.8-1.7 1.3.4 2.7.7 4.1.7 5.5 0 10-3.6 10-8s-4.5-8-10-8z" />
        </svg>
      )
    case 'whatsapp':
      // WhatsApp:气泡 + 听筒
      return (
        <svg width={px} height={px} viewBox="0 0 24 24" fill="#ffffff">
          <path d="M12 2.5A9.4 9.4 0 0 0 2.6 11.9c0 1.7.4 3.3 1.2 4.7L2.5 21.5l5-1.3a9.4 9.4 0 0 0 4.5 1.1 9.4 9.4 0 0 0 9.4-9.4A9.4 9.4 0 0 0 12 2.5zm0 17.1c-1.4 0-2.8-.4-4-1l-.3-.2-3 .8.8-2.9-.2-.3a7.6 7.6 0 0 1-1.2-4.1A7.7 7.7 0 0 1 12 4.2a7.7 7.7 0 0 1 7.7 7.7 7.7 7.7 0 0 1-7.7 7.7zm4.2-5.8c-.2-.1-1.4-.7-1.6-.7-.2-.1-.4-.1-.5.1-.2.2-.6.7-.7.9-.1.1-.3.2-.5.1-.2-.1-1-.4-1.8-1.1-.7-.6-1.1-1.3-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.2.2-.4.1-.2 0-.3 0-.4l-.7-1.8c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3 1 2.4c.1.2 1.7 2.6 4.1 3.6.6.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1 0-.2-.2-.2-.4-.3z" />
        </svg>
      )
    case 'system':
      // 系统设置:齿轮
      return (
        <svg
          width={px}
          height={px}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3.2" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08A1.7 1.7 0 0 0 10 4.09V4a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56h.08a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51.9z" />
        </svg>
      )
  }
}
