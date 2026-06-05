/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * In-process rate limit + 日预算 —— 防 LLM API 滥用 / 成本失控。
 *
 * ## 输入
 * 当前时间(默认 `Date.now()`,单测可注入 `now()`)。
 * 配置通过 `process.env`:`AI_RATE_LIMIT_PER_10MIN`、`AI_DAILY_BUDGET`。
 *
 * ## 输出
 * `tryConsume(): boolean` —— true = 允许一次 AI 调用;false = 拒绝(降级到 fail-open)。
 *
 * ## 定位
 * M5 兜底的成本/滥用护栏。**不引入 Redis/外部存储**(M5 first example 保持依赖最小);
 * 内存版足够个人/小流量;生产高流量要换 Redis,但接口不变。
 *
 * ## 失败哲学
 * 拒绝时返回 false(不放行),由调用方(recheckLowRisk)把它转成 fail-open(keep 决策)。
 *
 * ## 依赖
 * 无运行时依赖;Node 内置 `Date.now()`。
 *
 * ## 维护规则
 * 改默认值 = 改产品成本预算,需 review。改算法(滑窗 / 漏桶)要重写单测。
 */
import 'node:process'

/**
 * Rate limit 状态(in-process,单实例)。
 * 多实例部署(Next.js 多 worker / Vercel 多 region)各算各的;
 * 严格防滥用要换 Redis —— 但 M5 first example 保持简单。
 */
interface RateLimitState {
  /** 10 分钟窗口内的调用时间戳(ms),最旧在前 */
  window: number[]
  /** UTC 日期(yyyy-mm-dd)→ 当日已用次数 */
  dailyCount: number
  dailyDate: string
}

const state: RateLimitState = {
  window: [],
  dailyCount: 0,
  dailyDate: '',
}

const WINDOW_MS = 10 * 60 * 1000

/**
 * 默认额度。生产环境通过 env 覆盖。
 */
const DEFAULT_RATE_LIMIT_PER_10MIN = 100
const DEFAULT_DAILY_BUDGET = 5000

/**
 * 单测可注入时间。
 */
let nowOverride: (() => number) | null = null

/**
 * 单测钩子:重置 state + 注入/清除时间源。
 */
export function __resetRateLimitStateForTests(now?: () => number): void {
  state.window.length = 0
  state.dailyCount = 0
  state.dailyDate = ''
  nowOverride = now ?? null
}

function now(): number {
  return nowOverride ? nowOverride() : Date.now()
}

function getRateLimitPer10Min(): number {
  const raw = process.env.AI_RATE_LIMIT_PER_10MIN
  if (!raw) return DEFAULT_RATE_LIMIT_PER_10MIN
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_RATE_LIMIT_PER_10MIN
  return n
}

function getDailyBudget(): number {
  const raw = process.env.AI_DAILY_BUDGET
  if (!raw) return DEFAULT_DAILY_BUDGET
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_DAILY_BUDGET
  return n
}

function todayUtc(): string {
  return new Date(now()).toISOString().slice(0, 10)
}

/**
 * 检查并消耗一次调用额度。
 * 返回 true = 允许,返回 false = 拒绝(调用方应 fail-open)。
 */
export function tryConsume(): boolean {
  const t = now()
  const date = todayUtc()

  // 跨日重置
  if (state.dailyDate !== date) {
    state.dailyDate = date
    state.dailyCount = 0
  }

  // 滑动窗口:把 10 分钟外的剔掉
  const cutoff = t - WINDOW_MS
  while (state.window.length > 0 && state.window[0] < cutoff) {
    state.window.shift()
  }

  const perWindow = getRateLimitPer10Min()
  const perDay = getDailyBudget()

  if (state.window.length >= perWindow) {
    return false
  }
  if (state.dailyCount >= perDay) {
    return false
  }

  state.window.push(t)
  state.dailyCount += 1
  return true
}

/**
 * 当前使用快照(给监控/调试用;不暴露 PII)。
 */
export function snapshot(): {
  usedInWindow: number
  usedToday: number
  limitPer10Min: number
  limitPerDay: number
} {
  return {
    usedInWindow: state.window.length,
    usedToday: state.dailyCount,
    limitPer10Min: getRateLimitPer10Min(),
    limitPerDay: getDailyBudget(),
  }
}
