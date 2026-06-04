# Business Guardrails Evidence

> OpenPrd quality gate `business-guardrails` 的 evidence
> 最近更新:2026-06-05

## 项目阶段

**EasyPhone_AI / 爸妈别急 是 MVP 阶段**(M0-M4 完成,M5 待启动)。当前**未接入任何 LLM API**,因此"业务成本监控"和"滥用护栏"目前主要在**设计层 + 代码层** 落实,无运行时 LLM 调用产生的成本/滥用数据。

## 业务成本护栏(预估,等 M5 实施后实测)

来自 `.openprd/specs/m5-ai-integration.md` §8 成本预估:

| 假设 | 单次 | 月 1K 次 | 月 10K 次 |
|---|---|---|---|
| GPT-4o-mini,500 input + 200 output | ~¥0.0002 | ~¥0.2 | ~¥2 |
| Claude Haiku 4.5,500 input + 200 output | ~¥0.0003 | ~¥0.3 | ~¥3 |

**M5 实施后**:
- [ ] 接入 Vercel / Cloudflare 成本监控(API 限流 + 日告警)
- [ ] 加 LLM API 调用计费中间件(每次调用记录 input/output token)
- [ ] 月度成本基线 + 异常告警(>基线 2x)

## 滥用护栏(代码已落实)

| 风险 | 护栏 | 文件 / 测试 |
|---|---|---|
| 老人被 LLM 误导输出危险操作 | AI 改写 summary/suggestions **不**改教程步骤(白名单规则) | `docs/05 §3.3` + `M5 spec §2.2` |
| 老人被诱导念出验证码/密码 | "教给出去" 安全 lint:求助卡**不**教「念给我听」/「报一下」/「发给我」 | `src/domain/help/help.test.ts` |
| API 失败时降级安全 | 5 类失败场景全部 fallback 到规则版本(不丢失安全保险丝) | `M5 spec §6` |
| 数据最小化 | AI 只收 `text` + `ruleRisk`,**不**传设备/IP/老人标识;响应不持久化 | `M5 spec §7` + `docs/05 §3.4` |
| Prompt injection | system prompt 显式禁止"自由编造教程";输出 parse 校验 | `M5 spec §5` |
| 输出含危险操作 | 输出关键词 lint(发给我/念给我听 等)→ 用规则版 + 报警 | `M5 spec §6` |
| 老人误触关键操作 | UI:大按钮(64px+)、状态视觉反馈、单屏一动作 | `docs/05 §5.1` |
| URL 篡改绕过风险分流 | `/risk-alert` server 端**重新跑** classifyRiskByRules,不信任 URL 参数 | `src/app/risk-alert/page.tsx` + `src/domain/routing/user-routing.test.ts` |
| 高风险输入进教程 | `shouldStopGuidance` 单一不变量,任一高就高 | `src/domain/risk/types.ts` + 12 测试 |

## 当前可验证的 evidence

- 80+ 单元测试覆盖核心不变量
- smoke 测试覆盖 5 个关键路由
- 路由层(单一入口)12 个安全不变量测试
- 风险层(MAX 取 level)16 个验收用例
- 求助卡层(教给出去 lint)12 个 case

## 等待 M5+ 才有

- LLM API 真实成本数据
- API 调用频次分布
- 真实老人使用的漏报/误报日志
- 端到端冒烟测试(当前 smoke 只验路由 200 + 关键文本)
- 异常路径 e2e(API 失败 / 输出 parse 失败 / 危险词触发 fallback)
