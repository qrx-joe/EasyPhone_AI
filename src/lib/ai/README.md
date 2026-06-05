# `src/lib/ai/` — M5 AI 兜底层

老人产品里 AI 出现的位置、为什么这么放、为什么不破坏现有安全不变量,在这层讲清楚。

## 形态

**形态 ①:外部复检**。AI 充当"第二道滤网",只复检 `classifyRiskByRules` 标记为 **LOW** 的输入。Medium / High / Critical 跳过 AI —— 关键词保险丝已经给了更强信号,让 AI 投票反而会稀释 MAX(level) 规则。

详见 `docs/05-project-standards.md`(规划中)+ ADR 选型记录(见 `docs/`);本 README 只记录维护规则。

## 失败哲学:fail-open(回退到关键词)

AI 服务挂掉 / 超时 / 返回无法解析的 JSON / 抛出异常 → **回退到关键词结果**,不放行也不升级。

理由:

- 老人产品的安全**主防线**是关键词保险丝(`MAX(level)`),不是 AI。
- AI 挂了让老人看到"网络错误请重试"是糟糕体验。
- 关键词保险丝挂了 AI 才有意义 —— AI 挂了,关键词仍在工作。
- 每次 fail-open 写审计日志,作为 AI 可用性指标 + 异常告警源。

## 安全不变量(本目录绝对不允许改的)

- `src/domain/routing/user-routing.ts` — 12 个测试锁住的"高风险不走 /confirm"
- `src/domain/risk/classify-risk.ts` — 16 个验收用例锁住的 MAX(level)
- `src/domain/risk/types.ts` — `RiskLevel` / `shouldStopGuidance` 协议层

任何 PR 修改本目录文件,**必须** 同步跑:

```bash
pnpm test:risk            # 16 个验收
pnpm test                 # 全部,包括 user-routing 12 个
```

## 文件清单

| 文件 | 角色 |
|---|---|
| `deepseek-client.ts` | DeepSeek fetch 包装;server-only;env 缺失时 fail-fast |
| `prompts/risk-recheck.ts` | 系统/用户提示词 + JSON schema;**不引用**用户文本到 system |
| `risk-recheck.ts` | `recheckLowRisk()` 纯异步函数;返回 `keep` / `escalate` + reason |
| `risk-recheck.test.ts` | 覆盖 keep / escalate / timeout / malformed / env-disabled / high-bypass |

## 防御机制一览

1. **Server-only**:所有 AI 代码用 `import 'server-only'` 守门,误导入 client 即编译错。
2. **Prompt injection**:用户文本**只放 user message**;system prompt 不引用任何用户输入。
3. **JSON schema 校验**:AI 输出必须严格匹配 `{decision, reason}`,任何字段缺失/类型错都 fail-open。
4. **超时**:默认 2s,`AbortController` 硬中断。
5. **长度 cap**:输入 > 200 字跳过 AI(cost + 注入面)。
6. **env kill-switch**:`ENABLE_AI_RISK_RECHECK=false` 一键关 AI。
7. **审计日志**:每个 recheck 决策写一行 JSON(input sha256 前 8 位 + keyword level + AI decision + latency + reason 前 20 字);**不上 PII**。

## 调 AI 的流程(调用链)

```
[Client: page.tsx / voice-input-button.tsx]
  POST /api/route { text }
        ↓
[Server: src/app/api/route/route.ts]
  1. buildRouteForInput(text) ←── 关键词保险丝(不动)
  2. if level === 'low' → recheckLowRisk(text, classification)
                          ↓
                          [src/lib/ai/risk-recheck.ts]
                          ↓ fetch
                          [src/lib/ai/deepseek-client.ts] → DeepSeek API
                          ↓
                          validate JSON {decision, reason}
  3. AI escalate ? 覆盖为 /risk-alert : 保持原路
  4. 返回 { href, level }
        ↓
[Client] router.push(href)
```

## 维护备忘

- **不要**把 AI 调用放到 client component 里 —— key 永远不能离开服务器。
- **不要**让 AI 改 `classifyRiskByRules` 的输出 —— AI 是补漏,不是替换。
- **不要**让 AI 自由发挥 reason 文案 —— 老人看到的 reason 必须经过 `help-templates` / 既有话术过滤。
- 改提示词要重跑 `risk-recheck.test.ts`,并人工 review 至少 5 个"边界 case"(口语/方言/绕弯/拼音/纯疑问句)。
