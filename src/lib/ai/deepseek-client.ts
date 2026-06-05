/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * DeepSeek (OpenAI 兼容) fetch 包装。**server-only** —— 误导入 client 即编译错。
 *
 * ## 输入
 * 工厂函数 `createDeepSeekClient({ apiKey, model, baseUrl, timeoutMs })`,
 *   默认实例 `defaultDeepSeekClient` 在模块加载时读 env。
 *
 * ## 输出
 * `client.chat({ system, user, maxTokens })` → string (AI 原始回复,未解析 JSON)。
 * `client.isEnabled()` → boolean(供上层决定是否走 AI)。
 *
 * ## 定位
 * M5 AI 兜底层的"网关"。把 fetch / 超时 / 鉴权 / 错误规范化收口在这里。
 * 上层(recheck / route handler)只关心"调 AI 拿字符串",不关心 HTTP 细节。
 *
 * ## 依赖
 * Node 20+ 内置 fetch + AbortController;**不引外部 SDK**(保持依赖最小)。
 *
 * ## 维护规则
 * - 改 baseUrl / 鉴权 header 要在 .env.example 同步文档。
 * - 加新方法(maxTokens 上限、温度、stream 等)要更新 README。
 * - 不允许在 client 端调用本模块 —— 安全保证来源:
 *     (1) 文件位于 src/lib/ai/ 且无 'use client'
 *     (2) 只被 src/lib/ai/risk-recheck.ts / route-with-ai.ts / 单元测试 import
 *     (3) 客户端入口 src/lib/ai/fetch-route.ts 不 import 本文件,只调 /api/route
 *   改这层时同步跑 `pnpm test`(含 16 个 MAX + 12 个 routing 不变量)。
 */

/**
 * DeepSeek 客户端配置(显式注入,便于测试)。
 */
export interface DeepSeekConfig {
  /** Bearer token;缺失/空 = 客户端不可用。 */
  readonly apiKey: string
  /** 模型名;默认 deepseek-chat。 */
  readonly model: string
  /** API endpoint;默认 https://api.deepseek.com/chat/completions。 */
  readonly baseUrl: string
  /** 单次请求超时毫秒;默认 2000。 */
  readonly timeoutMs: number
}

/**
 * chat() 入参。
 */
export interface ChatRequest {
  /** system 消息(system prompt);不能包含任何用户输入。 */
  readonly system: string
  /** user 消息;可以包含用户输入,但需在调用方做长度 cap。 */
  readonly user: string
  /** 输出 token 上限;默认 120(recheck 场景够用)。 */
  readonly maxTokens?: number
  /** 外部 AbortSignal(可选);用于跨层取消。 */
  readonly signal?: AbortSignal
}

/**
 * DeepSeek 客户端抽象(便于单测 mock)。
 */
export interface DeepSeekClient {
  isEnabled(): boolean
  chat(req: ChatRequest): Promise<string>
}

const DEFAULT_BASE_URL = 'https://api.deepseek.com/chat/completions'
const DEFAULT_MODEL = 'deepseek-chat'
const DEFAULT_TIMEOUT_MS = 2000
const DEFAULT_MAX_TOKENS = 120

/**
 * 工厂:从显式配置构造客户端。
 * 测试用 `createDeepSeekClient({ apiKey: 'test', ... })`。
 */
export function createDeepSeekClient(config: DeepSeekConfig): DeepSeekClient {
  const enabled = config.apiKey.trim().length > 0

  return {
    isEnabled: () => enabled,
    async chat(req: ChatRequest): Promise<string> {
      if (!enabled) {
        throw new Error('DeepSeek client disabled: missing apiKey')
      }

      // 内部 signal + 外部 signal 组合,任一触发即取消
      const internalController = new AbortController()
      const timer = setTimeout(() => internalController.abort(), config.timeoutMs)
      const onExternalAbort = () => internalController.abort()
      if (req.signal) {
        if (req.signal.aborted) {
          internalController.abort()
        } else {
          req.signal.addEventListener('abort', onExternalAbort, { once: true })
        }
      }

      try {
        const res = await fetch(config.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              { role: 'system', content: req.system },
              { role: 'user', content: req.user },
            ],
            max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
            // recheck 场景需要稳定 JSON;锁低温
            temperature: 0.1,
            response_format: { type: 'json_object' },
          }),
          signal: internalController.signal,
        })

        if (!res.ok) {
          const body = await res.text().catch(() => '')
          throw new Error(
            `DeepSeek HTTP ${res.status}: ${body.slice(0, 200)}`,
          )
        }

        const json = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>
        }
        const content = json.choices?.[0]?.message?.content
        if (typeof content !== 'string') {
          throw new Error('DeepSeek response missing choices[0].message.content')
        }
        return content
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error(`DeepSeek timeout after ${config.timeoutMs}ms`)
        }
        throw err
      } finally {
        clearTimeout(timer)
        if (req.signal) {
          req.signal.removeEventListener('abort', onExternalAbort)
        }
      }
    },
  }
}

/**
 * 从 process.env 读配置;env 缺失时仍构造客户端(只是 disabled)。
 * 这是"软启用"模式:开发期无 key 不报错,生产期通过部署平台注入。
 */
function loadConfigFromEnv(): DeepSeekConfig {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY ?? '',
    model: process.env.DEEPSEEK_MODEL || DEFAULT_MODEL,
    baseUrl: process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL,
    timeoutMs: parseTimeoutMs(process.env.AI_RECHECK_TIMEOUT_MS) ?? DEFAULT_TIMEOUT_MS,
  }
}

function parseTimeoutMs(raw: string | undefined): number | null {
  if (!raw) return null
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

/**
 * 模块加载时构造的默认实例。`isEnabled()` 返回 false 时上层应跳过 AI。
 */
export const defaultDeepSeekClient: DeepSeekClient = createDeepSeekClient(
  loadConfigFromEnv(),
)

/**
 * 全局 kill-switch:`ENABLE_AI_RISK_RECHECK=false` 时,即使有 key 也禁用。
 * 用于线上 AI 服务异常时一键回退到纯关键词模式。
 */
export function isAiRecheckGloballyEnabled(): boolean {
  const flag = process.env.ENABLE_AI_RISK_RECHECK
  return flag !== 'false'
}
