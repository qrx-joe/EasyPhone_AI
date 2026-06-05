# 文件夹说明书

## 核心功能
M5 AI 兜底层的全部代码 —— **形态 ① 外部复检**。关键词保险丝判定为 LOW 的输入,在路由层之上叠加 AI 语义复检,嗅出"灰区"风险。

## 输入
- 用户原始输入 text(string)
- `RiskClassification`(从关键词保险丝来的 level / matchedKeywords / reason)
- `process.env.DEEPSEEK_API_KEY` / `DEEPSEEK_MODEL` / `DEEPSEEK_BASE_URL` / `AI_RECHECK_TIMEOUT_MS` / `ENABLE_AI_RISK_RECHECK`

## 输出
- `deepseek-client.ts` — DeepSeek (OpenAI 兼容) fetch 包装;`createDeepSeekClient` 工厂 + `defaultDeepSeekClient` 默认实例;server-only。
- `risk-recheck.ts` — `recheckLowRisk(text, classification, client?)` 异步函数;返回 `{ decision, reason, source }`;**fail-open 永不抛出**。
- `route-with-ai.ts` — `routeWithAiRecheck(text, client?)` 路由入口;在 `buildRouteForInput` 之上叠加 AI 复检;只在 LOW 上调 AI。
- `fetch-route.ts` — Client 端 fetch 包装;'use client';调 `POST /api/route` 拿最终路由;调用方负责失败降级。
- `prompts/risk-recheck.ts` — 系统提示词常量 + 用户提示词构造器 + JSON 解析器。
- `prompts/risk-recheck.test.ts` + `risk-recheck.test.ts` + `route-with-ai.test.ts` — 单元测试(node --test)。
- `README.md` — 设计说明:为什么形态 ①、为什么 fail-open、为什么不动 user-routing.ts。

## 定位
**M5 兜底层**,与 `src/domain/risk/`(关键词保险丝)**并列而不交叉**:
- 关键词保险丝在 `src/domain/risk/classify-risk.ts`,MAX(level) 是安全核心
- AI 兜底在本目录,**不修改** classify-risk.ts,**不修改** user-routing.ts
- AI escalate 时仍走 `buildRouteForInput` 的判断路径,只是入口等级被覆盖

## 依赖
- `src/domain/routing/user-routing.ts` 的 `buildRouteForInput`(关键词保险丝)
- `src/domain/risk/types.ts` 的 `RiskClassification` / `RiskLevel`
- DeepSeek API(`https://api.deepseek.com/chat/completions`,OpenAI 兼容)
- 浏览器 `fetch`(仅 `fetch-route.ts` 用)
- Node 20+ `fetch` + `AbortController`(仅 server 端用)

## 维护规则
- 改任何文件 → 同步跑 `pnpm test`(全 112+ 个 case,含 16 个 MAX + 12 个 routing 不变量)
- 改 prompt 文案 → 人工 review 至少 5 个边界 case(口语/方言/绕弯/拼音/纯疑问句)
- 改 fail-open 策略 = 改安全哲学,需 ADR + 全员 review
- 改 `import 'server-only'` 守门策略 → 同步 review 客户端入口的 import 路径
- **不动** `src/domain/routing/user-routing.ts` / `src/domain/risk/classify-risk.ts` / `src/domain/risk/types.ts` —— 这是项目安全保险丝
- 加新方法(maxTokens 上限、流式、温度等)→ 更新本 README + `.env.example`
