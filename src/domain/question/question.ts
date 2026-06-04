/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * QuestionRecord 类型 + `createQuestion()` 工厂。用户输入的"已分类"快照。
 *
 * ## 输入
 * - `text`: 老人输入(必填,空抛错)
 * - `source`: 'voice' | 'text' | 'demo'
 * - `risk`: 已通过 `classifyRiskByRules()` 的 RiskClassification(必填)
 *
 * ## 输出
 * - `QuestionRecord`: 冻结的对象(id + text + source + risk + createdAt)
 * - `QuestionSource` 联合类型
 *
 * ## 定位
 * 一旦被记为 QuestionRecord,就**已经过**分类。还没分类的"原始输入"应保持 string。
 * **不允许**在风险页/routing 之外使用未分类的 string 走核心流程(防止绕过分流)。
 *
 * ## 依赖
 * `../risk/types.ts` 的 `RiskClassification`。
 *
 * ## 维护规则
 * - 改 createQuestion 的不变量必过 `question.test.ts`。
 * - 工厂对非法输入**抛错**(不返回 null)—— 安全核心不留残缺态。
 * - 不在这里写风险判断(那是 `risk/classify-risk.ts` 的事)。
 */
/**
 * 用户提出的一次问题。
 *
 * 设计原则(来自 docs/05 §3.1, §3.4, §4.1):
 * 1. **风险是 QuestionRecord 的内在属性**,不是后加的修饰。
 *    一旦问题被记为 QuestionRecord,意味着它**已经过**了 classifyRiskByRules。
 *    还没分类的「原始输入」应该用 string,别用这个类型,避免「拿着原始输入跳过分流」的漏洞。
 * 2. text 不允许空字符串 —— 由工厂函数 createQuestion 在边界强制。
 * 3. 字段全 readonly + 使用 readonly 引用,避免外部代码偷偷改 ID 或时间戳(数据泥团防御)。
 * 4. createdAt 用 ISO 8601 字符串(序列化安全、可直接进 localStorage/URL/JSON)。
 */

import type { RiskClassification } from '../risk/types.ts'

/** 问题来源。M2 阶段先枚举,后续要扩字段(语音时长、demo id 等)再开新接口。 */
export type QuestionSource = 'voice' | 'text' | 'demo'

export interface QuestionRecord {
  readonly id: string
  readonly text: string
  readonly source: QuestionSource
  readonly risk: RiskClassification
  readonly createdAt: string
}

// ─────────────────────────────────────────────────────────────────────
// 工厂
// ─────────────────────────────────────────────────────────────────────

let counter = 0

/**
 * 生成单调递增的 ID。时间戳保唯一性,counter 避免同一毫秒内多次调用冲突。
 * 不用 crypto.randomUUID():我们不要求 ID 全局唯一,只要在单次会话内可定位即可。
 */
function genId(): string {
  counter += 1
  return `q-${Date.now().toString(36)}-${counter.toString(36)}`
}

/**
 * 工厂函数:把「原始输入 + 来源 + 已分类的风险」打包成 QuestionRecord。
 *
 * 抛错而不是返回 null —— 这是安全相关的数据结构,「我建了一个残缺的 QuestionRecord」
 * 是个比抛错更糟糕的失败模式。调用方在 try/catch 里决定怎么处理(redirect / 兜底 / 上报)。
 *
 * @param text   用户原始输入(text / voice 转写后 / demo 预设)。空白会被 trim。
 * @param source 输入来源,后续统计用。
 * @param risk   必填 —— 调用方必须先跑 classifyRiskByRules。
 *               不接受 undefined,强迫调用方在传入前完成分类。
 */
export function createQuestion(
  text: string,
  source: QuestionSource,
  risk: RiskClassification,
): QuestionRecord {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error('createQuestion: text 不能为空')
  }
  return Object.freeze({
    id: genId(),
    text: trimmed,
    source,
    risk,
    createdAt: new Date().toISOString(),
  })
}
