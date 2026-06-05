# Business Guardrails Evidence

> OpenPrd quality gate `business-guardrails` 的 evidence
> 最近更新:2026-06-05(M5 AI 兜底接入后)

## 项目阶段

**EasyPhone_AI / 爸妈别急 是 MVP 阶段**(M0-M5 first example)。M5 已接入 DeepSeek 做"AI 兜底复检"(形态 ① 外部复检),在关键词保险丝之上补漏。

## 业务成本护栏(M5 已落实)

### 实时护栏(in-process,M5 first example 范围)

| 护栏 | 默认 | env 覆盖 | 文件 / 测试 |
|---|---|---|---|
| 10 分钟滑动窗口限流 | 100 次 / 10min | `AI_RATE_LIMIT_PER_10MIN` | `src/lib/ai/rate-limit.ts` + `rate-limit.test.ts`(7 case) |
| 单实例单日预算 | 5000 次 / 天(UTC 重置) | `AI_DAILY_BUDGET` | 同上 |
| 输入长度 cap | 200 字(超长直接 fail-open 跳过 AI) | hardcoded | `src/lib/ai/risk-recheck.ts` + 单测 |
| API 单次超时 | 2000ms(超时即 fail-open) | `AI_RECHECK_TIMEOUT_MS` | `src/lib/ai/deepseek-client.ts` |
| 全局 kill-switch | 启用 | `ENABLE_AI_RISK_RECHECK=false` 一键关 | `src/lib/ai/deepseek-client.ts` |

**被拒/被超时的请求都降级到关键词结果**(fail-open),不留 PII,不写完整 text 到日志(只上 djb2 hash + 长度)。

### 已知限制(将来 M5.1+ 升级)

- **In-process 状态**:多 worker / 多 region 部署各算各的,严格防滥用要换 Redis(接口可保持不变)
- **真实成本数据**:等真实流量后回填;目前用 env 控制额度,无 token 计费
- **月度基线告警**:等 Vercel / Cloudflare 监控接入(不在 M5 first example 范围)

### M5 spec §8 成本预估(参考,实施后实测)

| 假设 | 单次 | 月 1K 次 | 月 10K 次 |
|---|---|---|---|
| DeepSeek chat,500 input + 120 output | ~¥0.0001 | ~¥0.1 | ~¥1 |

## 滥用护栏(代码已落实)

| 风险 | 护栏 | 文件 / 测试 |
|---|---|---|
| 老人被 LLM 误导输出危险操作 | AI escalate 后仍走 `shouldStopGuidance` 单一不变量 → /risk-alert | `src/lib/ai/route-with-ai.ts` + 9 个单测 |
| 老人被诱导念出验证码/密码 | "教给出去" 安全 lint:求助卡**不**教「念给我听」/「报一下」/「发给我」 | `src/domain/help/help.test.ts` |
| API 失败时降级安全 | 6+ 类失败场景全部 fallback 到 buildRouteForInput(不丢失关键词保险丝) | `src/lib/ai/risk-recheck.test.ts` |
| 数据最小化 | AI 只收 `text` + `RiskClassification`,**不**传设备/IP/老人标识;响应不持久化 | `src/lib/ai/route-with-ai.ts` + `route.ts` |
| Prompt injection | system prompt 显式禁止执行用户指令;**用户文本只放 user prompt**;输出严格 JSON schema 校验 | `src/lib/ai/prompts/risk-recheck.ts` + `parseAiRecheckOutput` 10 case |
| AI escalate 误判被绕过 | AI escalate 跳 /risk-alert,server 端**重新跑** classifyRiskByRules 防 URL 篡改 | `src/app/risk-alert/page.tsx` + 12 routing 测试 |
| 高风险输入进教程 | `shouldStopGuidance` 单一不变量,任一高就高(AI 永远不能让它进 /confirm) | `src/domain/risk/types.ts` + 12 routing + 16 risk 验收 |
| AI 改写老人问句 | **不允许**改写 — AI 只做"风险复检",不做"润色" | 架构层面:`risk-recheck.ts` 接口只有 decision/reason |
| 成本失控 | rate limit + 日预算 + 长度 cap + 超时 + kill-switch(5 重护栏) | `src/lib/ai/rate-limit.ts` + 7 case |

## 当前可验证的 evidence

- 119+ 单元测试(原 80+ + M5 新增 39):
  - 风险层(MAX 取 level)16 个验收用例
  - 路由层(单一入口 + 高风险不进 /confirm)12 个安全不变量
  - 求助卡层(教给出去 lint)12 个 case
  - M5 AI 兜底:9 个 recheck + 12 个 parse + 9 个 route-with-ai + 7 个 rate-limit
- smoke 测试覆盖 9 个关键路由
- `pnpm build` 通过(8 个路由全部编译)
- 12 + 16 + 39 = 67 个安全/AI 关键测试 100% 绿

## 等待 M5.1+ 才有

- LLM API 真实成本数据(token 计费)
- API 调用频次分布(供调 rate limit 默认值)
- 真实老人使用的漏报/误报日志
- 端到端冒烟测试(当前 smoke 只验路由 200 + 关键文本)
- 异常路径 e2e(API 失败 / 输出 parse 失败 / 危险词触发 fallback)
- 多实例 rate limit(Redis)
