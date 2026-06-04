/**
 * 风险提醒页 — 占位(M2 阶段)。
 *
 * 完整实现在 M4:
 *   - 大红色「停下来」提示
 *   - 列出命中的关键词与人话理由
 *   - 生成「家人求助卡」并支持复制
 *   - 不展示任何教程步骤
 *
 * 本占位至少要满足 M2 安全闭环:高风险输入到达本页就**绝不**显示教程引导。
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function RiskAlertPage({
  searchParams,
}: {
  searchParams: Promise<{
    text?: string
    level?: string
    keywords?: string
    reason?: string
  }>
}) {
  const params = await searchParams
  const text = (params.text ?? '').trim()
  if (!text) {
    redirect('/')
  }

  const level = params.level === 'critical' ? 'critical' : 'high'
  const matchedKeywords = (params.keywords ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const reason = params.reason ?? ''

  return (
    <main className="flex flex-col items-center min-h-full w-full max-w-2xl mx-auto px-6 py-10 sm:py-16">
      {/* 醒目的「停」标识 */}
      <div
        className="w-32 h-32 rounded-full bg-[--color-danger] text-white flex items-center justify-center text-6xl font-bold mb-6 shadow-md"
        aria-hidden
      >
        停
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-[--color-danger] text-center mb-4">
        先别操作,这可能是诈骗
      </h1>

      <p className="text-xl text-[--color-foreground] text-center mb-8 leading-relaxed">
        {reason || '系统识别到风险关键词,为了您的安全,请先暂停。'}
      </p>

      {/* 命中关键词(占位:M4 改成家人求助卡) */}
      {matchedKeywords.length > 0 && (
        <section className="w-full mb-8 px-6 py-5 rounded-xl bg-[--color-danger-soft] border-2 border-[--color-danger]">
          <p className="text-base text-[--color-muted] mb-2">您刚才说到:</p>
          <p className="text-xl font-medium text-[--color-foreground] break-words">
            「{text}」
          </p>
          <p className="text-base text-[--color-muted] mt-3 mb-1">
            其中包含 {matchedKeywords.length} 个风险词:
          </p>
          <ul className="flex flex-wrap gap-2">
            {matchedKeywords.slice(0, 8).map((kw) => (
              <li
                key={kw}
                className="px-3 py-1 bg-white text-[--color-danger] rounded-full text-base font-medium border border-[--color-danger]"
              >
                {kw}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 行动指引 */}
      <section className="w-full mb-8 px-6 py-5 rounded-xl bg-[--color-soft]">
        <h2 className="text-xl font-semibold mb-3">现在请这样做:</h2>
        <ol className="text-lg leading-loose list-decimal pl-6 space-y-1">
          <li>不要转账、不要扫码、不要点链接</li>
          <li>不要告诉对方验证码、密码、身份证号</li>
          <li>把这个页面给家人看一眼</li>
          <li>真有事就打 110 或 96110(反诈专线)</li>
        </ol>
      </section>

      {/* M2 占位:M4 改成「生成家人求助卡」按钮 */}
      <div className="w-full text-center text-base text-[--color-muted] mb-6">
        ( 家人求助卡功能开发中,下次更新上线 )
      </div>

      <Link
        href="/"
        className="w-full text-center min-h-[64px] px-6 py-3 rounded-xl bg-[--color-soft] hover:bg-[--color-soft-hover] text-[--color-foreground] text-xl font-medium border border-[--color-border] flex items-center justify-center"
      >
        返回首页
      </Link>

      <p className="mt-6 text-sm text-[--color-muted]">
        风险等级:{level === 'critical' ? '极高' : '高'}
      </p>
    </main>
  )
}
