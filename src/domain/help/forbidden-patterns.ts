/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * 「教给出去」话术模式清单 + `containsGiveAwayPattern(text)` 检查器。
 * 求助卡(无论模板生成还是 AI 生成)**绝对不能**包含教老人/家人把敏感信息
 * 交出去的话术。
 *
 * ## 输入
 * - `text`: 任意待检查文本(求助卡 summary / suggestions / AI 输出)
 *
 * ## 输出
 * - `FORBIDDEN_GIVE_AWAY_PATTERNS`: 只读模式清单
 * - `containsGiveAwayPattern(text)`: 命中任一模式 → true
 *
 * ## 定位
 * 领域层安全 lint 的单一来源。之前清单只活在 `help.test.ts`(编译期守护),
 * M5 接入 AI 生成 summary 后,**运行时也必须过这道闸** —— AI 输出不可信,
 * 测试守不住运行时生成的文本。test 与 runtime 共用本清单,防止两份清单漂移。
 *
 * ## 依赖
 * 无 —— 纯字符串匹配,零依赖,可在任何环境跑(server / client / test)。
 *
 * ## 维护规则
 * - **只能加模式,不能删**(删除 = 放松安全 lint,需 ADR + review)。
 * - 注意方向性:「不要告诉对方验证码」是反诈提示(合法),
 *   「把验证码发给我」是教给出去(禁止)。加新模式前想清楚方向。
 * - 改动后必跑 `pnpm test`(help.test.ts 的 lint 用例 + AI 输出校验用例)。
 */

/**
 * "教给出去"模式清单 —— 求助卡**绝对不能**包含这类话术。
 *
 * 注意:这跟"不要告诉对方验证码"是相反的:
 *   - "不要告诉对方验证码" ✅ 反诈骗安全提示(应该出现)
 *   - "把验证码发给我"      ❌ 教给出去(绝不能出现)
 * 关键词库(classify-risk.ts §2)已经定义了这些是"骗子索取"话术。
 */
export const FORBIDDEN_GIVE_AWAY_PATTERNS: readonly string[] = Object.freeze([
  '念给我听',
  '报一下',
  '发给我',
  '念给我',
  '读出来',
  '念出来',
  '把验证码发',
  '把密码发',
  '把身份证发',
  '把银行卡发',
  '告诉我验证码',
  '提供验证码',
  '输入验证码即可',
])

/**
 * 文本是否命中任一"教给出去"模式。
 *
 * 用途:
 *   1. `help.test.ts` —— 模板产物的编译期 lint
 *   2. `src/lib/ai/prompts/help-summary.ts` —— AI 生成 summary 的运行时闸
 */
export function containsGiveAwayPattern(text: string): boolean {
  return FORBIDDEN_GIVE_AWAY_PATTERNS.some((p) => text.includes(p))
}
