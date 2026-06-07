/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * Next.js 根布局,声明站点元数据与视口策略。
 *
 * ## 输入
 * 子组件 children(任意 ReactNode)。
 *
 * ## 输出
 * <html lang="zh-CN"> + <body> 骨架;导出 metadata(标题/描述/formatDetection)
 * 与 viewport(缩放策略)。
 *
 * ## 定位
 * 全站最外层布局,被所有页面共享;管全局元信息和根容器 className。
 *
 * ## 依赖
 * next(Metadata 类型)、./globals.css(设计令牌)。
 *
 * ## 维护规则
 * 改 metadata 后在浏览器 DevTools 校验 Open Graph;viewport 改动要 e2e 验
 * iOS Safari 不被双击放大跳屏。
 */

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '爸妈别急 · 手机问题一步一步教',
  description:
    '为老年人设计的手机操作问答工具:语音/打字提问,一步一步教,识别诈骗风险时停下来生成家人求助卡。',
  // 阻止 iOS 把数字识别成电话(老人输入诈骗短信号码场景常见)
  formatDetection: { telephone: false, date: false, address: false, email: false },
}

// 移动端老人手势:禁止用户缩放容易让交互不可控;但完全禁缩放又违反 a11y。
// 折中:允许缩放,但默认 1.0,避免 iOS Safari 双击放大跳屏。
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-(--color-background) text-(--color-foreground)">
        {children}
      </body>
    </html>
  )
}
