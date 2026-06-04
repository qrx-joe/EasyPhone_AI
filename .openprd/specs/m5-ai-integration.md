---
title: M5 AI 集成
type: spec
status: draft
owner: easyphone-ai-team
lastUpdated: 2026-06-05
relatedDocs:
  - docs/06-development-plan.md#m5
  - docs/05-project-standards.md#33
---

# M5 Spec: AI 接入

> OpenPrd spec · 状态:已拍板,等执行
> 关联:docs/06-development-plan.md §4 M5,docs/05-project-standards.md §3.3
> 最近更新:2026-06-05

## 1. 目标

在规则兜底基础上接入 LLM,**让分类和求助卡更准**,但**不取代**规则。

## 2. 接入范围

### 2.1 AI 做什么(允许)

- **改写 summary**:把 `question.risk.reason` 改写得更人话(同 docs/05 §3.3「AI 只做改写」)
- **改写 suggestions**:根据用户实际输入的措辞调整求助卡建议
- **辅助分类(可选)**:当规则判定 medium 时,让 AI 二次判断是否高风险(但最终决策必须保守 —— 任何一边判定高就高)

### 2.2 AI **不**做什么(禁止)

- ❌ 不自由编教程步骤(白名单规则,docs/05 §3.3)
- ❌ 不改 `RiskLevel` 类型枚举(那是规范层)
- ❌ 不替规则做 critical/high 的判定(规则兜底原则,docs/05 §3.2)
- ❌ 不输出"该怎么操作"的教程步骤(AI 不可信)

## 3. 模型选择(待用户决定)

候选:
- **OpenAI GPT-4o-mini**:成本低(~¥0.3/1M token),中文支持好,延迟低
- **Claude Haiku 4.5**:成本类似,中文理解略好,Safety 设计严谨
- **国内模型**(Qwen / DeepSeek / GLM):中文更地道,需用户选择供应商

**决策点**:用户要确认用哪个,以及是否需要"模型可切换"抽象。

## 4. API 接入面

新增 `POST /api/classify`:

```
请求: { text: string, ruleRisk: RiskClassification }
响应: { aiSummary: string, aiSuggestions: string[], aiLevel: 'low'|'medium'|'high'|'critical' | null }
```

**实现位置**:`src/app/api/classify/route.ts`(Next.js Route Handler)
**调用方**:`/risk-alert` 页面 server 组件在 buildHelpRequest **之后**,可选用 AI 改写 summary/suggestions

## 5. Prompt 设计约束

- **system prompt 必须明确说**:
  - 你是改写者,**不是**决策者
  - 不输出教程步骤
  - 不输出"怎么转账""怎么付钱"等危险操作
  - 输出要"如果不确定,保持原样"
- **temperature**: 0.3(低随机,稳定)
- **max_tokens**: 300(控制成本)
- **JSON 校验**:AI 输出必须能 parse 成结构,parse 失败 → 用规则版本

## 6. 失败兜底(关键)

| 失败场景 | 兜底行为 |
|---|---|
| API timeout (>3s) | 用规则版本 summary/suggestions |
| API 5xx | 用规则版本 |
| API 4xx(quota/permission) | 用规则版本 + 上报 |
| 输出 parse 失败 | 用规则版本 + 记录 bad case |
| 输出含危险操作词 | 用规则版本 + 记录 bad case |
| 输出含敏感信息(验证码/身份证/银行卡) | 用规则版本 + 立即警报 |

**不变量**:`shouldStopGuidance` 仍然由规则层 + AI 共同决定,任一高就高。AI 失败**不会**降级安全。

## 7. 数据最小化

- 只传 `text`(原始输入)和 `ruleRisk`(已分类结果)给 AI
- **不**传设备信息 / IP / 时间戳 / 老人标识
- AI 响应**不持久化**(除非用户显式要求保存求助卡)
- 必须在 UI 上加"我们用 AI 帮您更好地总结,内容不会保存"的提示

## 8. 成本预估(待模型确认后)

假设 GPT-4o-mini,平均每次 500 input + 200 output token:
- 单次 ~¥0.0002
- 1000 次/月 = ¥0.2
- 10000 次/月 = ¥2

MVP 阶段可以接受,无硬成本约束。

## 9. 验收

- [ ] 3 个 demo 场景(微信没声音、字太小、医保异常)的 AI 改写版 vs 规则版,**老人路演看不出来区别**
- [ ] API 失败时,fallback 到规则版,**UI 看起来一样**
- [ ] 故意构造 bad input(包含"教我怎么转账"),AI 返回 → 立刻用规则版 + 报警
- [ ] CI 加 1 个 mock LLM 测试,验证 parse 失败 / 危险词的兜底路径

## 10. 风险与可逆性

| 风险 | 可逆成本 |
|---|---|
| AI 输出 quality 不达标 | 关闭 AI 端点,回退到规则版。1 行 config。 |
| AI API 涨价 | 切换模型。0.5 天 |
| AI 误判(把高风险判定成 low) | **不能发生** —— 任一高就高是 hard rule,AI 没权覆盖 |
| 数据泄露 | 不传敏感信息 + UI 提示。0 代码改动 |
| Prompt injection(用户输入伪造 AI 指令) | system prompt 显式禁止;输出 parse 校验。~1 天 |

## 11. 实施步骤(等用户决策后开始)

1. 选模型 + 拿 API key(用户)
2. 写 `src/app/api/classify/route.ts`
3. 写 `src/lib/llm/` 目录(LLM 客户端封装,同 speech 风格)
4. 改 `help-templates.ts` 让它支持 AI 改写
5. /risk-alert 页面接 AI(可选,默认走规则)
6. 加 CI mock LLM 测试
7. 文档更新

## 12. 不在本 spec 范围(明确)

- ❌ 端侧 LLM(WebLLM / Ollama 等) —— 太重,先 server
- ❌ 流式响应 —— MVP 不需要
- ❌ 多轮对话 —— 老人场景不需要
- ❌ 老人/家人账号系统 —— M7+ 考虑
- ❌ 真实"发给家人"功能(M4 已 mock 提示)—— 需要家人账号配合
