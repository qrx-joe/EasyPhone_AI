# 文件夹说明书

## 核心功能
AI 提示词与 LLM 输出解析的"文案层"。**与结构层(`risk-recheck.ts`)解耦** —— 改提示词不动 schema,反之亦然。

## 输入
- 用户原始 text(string,在 recheck 层已 cap ≤ 200 字)
- `RiskClassification`{ level, matchedKeywords, reason }(给 LLM 看关键词规则的视角)
- LLM 原始回复字符串(给 `parseAiRecheckOutput` 校验)

## 输出
- `risk-recheck.ts` — 三件套:
  - `RISK_RECHECK_SYSTEM_PROMPT`: 老人产品"安全滤网"系统提示词常量
  - `buildRiskRecheckUserPrompt(text, classification)`: user prompt 字符串构造器
  - `parseAiRecheckOutput(raw)`: LLM 输出 JSON 解析与 schema 校验(失败返回 null)
- `risk-recheck.test.ts` — 12+ 个 `parseAiRecheckOutput` 单测,覆盖所有 fail-open 路径

## 定位
M5 AI 兜底层的"文案/解析子目录"。改 prompt 时只动这一个文件;改 schema 校验也只动这一个文件。**不调 AI,不做网络 I/O**——纯文案 + 纯函数。

## 依赖
- `src/domain/risk/types.ts` 的 `RiskClassification` 类型
- 运行时:无(Node 标准 JSON 解析)
- 测试:`node:test` + `node:assert/strict`

## 维护规则
- 改 system prompt 后必须人工 review 至少 5 个边界 case(口语/方言/绕弯/拼音/纯疑问句)
- **System prompt 绝不引用用户输入**(防 prompt injection)—— 这是 hard rule,任何 PR 引入用户文本到 system 都需 review
- **User prompt 才放用户文本**——且需在调用方 cap 长度(recheck 层 cap 在 200 字)
- **JSON schema 在 system 末尾显式声明**——减少 LLM 自由发挥
- 改 reason 字段长度 cap(目前 100 字)→ 同步 review 日志聚合端的解析
- 跑 `pnpm test src/lib/ai/prompts/risk-recheck.test.ts` 验证 schema 校验
