<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Project: 爸妈别急 / EasyPhone AI

> 老人手机教练。低风险一步一步教，高风险立刻停下来 + 家人求助卡。
> 完整 PRD：[docs/00-prd-cn-authoritative.md](docs/00-prd-cn-authoritative.md)

## 状态（最近更新 2026-06-05）

- **M0** 项目初始化 ✅
- **M1** 核心领域模型 ✅（risk / question / tutorial / help / routing）
- **M2** 首页与输入流程 ✅
- **M3** 低风险分步指导 ✅
- **M4** 高风险中断 + 家人求助卡 ✅
- **M5** AI 接入（待 API key，P2）
- **M6** Demo 打磨（README ✅，部署待账号）

详情见 [docs/06-development-plan.md](docs/06-development-plan.md)。

## 给 Agent 的硬性约束

### 安全不变量（PR 必过）

改这些文件时**必须保留不变量**，对应测试会卡住：

- `src/domain/routing/user-routing.ts` —
  `buildRouteForInput()` 是**唯一**做"高风险不走 /confirm"分流的地方。
  多个入口（首页文本 / 语音输入 / Demo 直链）共用同一份逻辑。
  → 12 个测试覆盖 4 个风险等级分支
- `src/domain/risk/classify-risk.ts` —
  多关键词命中**永远**取 `MAX(level)`，不平均、不取第一个。
  注释里叫"安全保险丝"。
  → 16 个验收用例
- `src/domain/help/help-templates.ts` —
  求助卡不教"把验证码发给我"等给出去模式。
  → "教给出去" lint 测试覆盖

### 行为守则

- 写代码前先 Read 完整文件（`limit` 只用于已知结构时跳读）—— 否则会基于片面信息误判 bug
- 不用 any；unknown 收敛后 narrow
- 不用 emoji 当 UI 主标签（适老化：emoji 老人识别度低，文字优先）
- 不接 AI API（除非显式要求）—— M5 才接
- 教程扩库按 [docs/07](docs/07-risk-keywords-library.md) §11 三道闸，不凭想象写关键词

## 命令速查

```bash
pnpm dev          # 开发 (localhost:3000)
pnpm build        # 生产构建
pnpm test         # 跑所有测试
```

## 目录速查

```
src/
  app/         # 页面 (App Router)
  domain/      # 纯领域逻辑（可单测）
  lib/speech/  # Web Speech API 封装
docs/          # PRD / 规范 / 决策
```

## 不在本项目范围内

- 真实微信/短信/通讯录读取
- 远程控制
- 支付/医保/金融真实操作
- Android 无障碍自动操作

详细见 [docs/06](docs/06-development-plan.md) §6 P3。

<!-- OPENPRD:AGENTS:START -->
## OpenPrd Harness

本项目由 OpenPrd 管理。Agent 应优先遵循 repo-local skills 和 hooks；`AGENTS.md` 只保留轻量入口合同。

### Scope

- skill 路由放在 `openprd-router`，命令清单放在 command catalog，强约束放在 hooks。
- `AGENTS.md` 只说明入口、默认行为和高风险门禁，不再承载静态长清单。

### Entry Points

- 先读 `skills/openprd-router/SKILL.md`；在生成的 Codex / Claude 环境里，优先读同名 `openprd-router` skill。
- 需要具体命令时，优先读 `.openprd/harness/command-catalog.md`，不要继续把命令清单膨胀回 `AGENTS.md`。
- `$openprd-shared`：共用语言、文档影响、敏感信息、浏览器安全、小程序验证、产品文案与 i18n 规则。
- `$openprd-requirement-intake`：需求入口分流、L0/L1/L2 判断、PRD lens 选择。
- `$openprd-harness`：主工作流、`run/loop`、review/change/tasks 与执行节奏。
- `$openprd-benchmark-router`：外部技术、公开 GitHub 仓库、benchmark/对标/最佳实践路由。
- `$openprd-standards` / `$openprd-quality`：`docs/basic/`、就绪验证、EVO 门禁、知识沉淀。
- `$openprd-diagram-review` / `$openprd-discovery-loop`：可视评审与长时间只读挖掘。

### 默认行为

1. 动手前先从 `.openprd/` 重建状态，并先运行 `openprd run . --context`；它是建议上下文，不是自动执行指令。
2. 规划、分析、架构评审、“怎么改”或“会动哪些文件”类请求保持只读；只有用户明确要求实现、继续任务、深度调研、对标复刻或提交时才进入执行。
3. 先分流再执行：需求复杂度由 `openprd-requirement-intake` 按影响面、未知数、决策成本和验证成本判断；L0 小修直接处理并事后说明，L1 中等改动先在对话内给 mini-plan 再执行，L2 高影响或边界不清的需求先走 requirement intake，再 `review/change/tasks`，最后才实现。`review.html` 是稳定评审 artifact，不再默认等于唯一的人类停顿点；默认按 decision-points approval policy 执行，只有当前 lane 仍要求人类决策时才在 final answer 主体里停下请求确认。
4. 纯图片、封面图、配图、海报、插画、图标、贴纸、mockup 或“先看样子”请求默认直接使用 Codex 原生 Image 2；其中 logo、icon、avatar、badge 等开发素材在用户未明确要求场景化展示时，默认按独立素材输出（standalone asset）生成：全画布单主体，不额外添加卡片、设备框或其他展示容器；只有进入实现阶段且已有参考图时，才使用 `openprd visual-compare`。
5. 用户给出会话 ID 并要求继续时，按工具无关的历史会话续接；不要要求工具专属 ID，也不要用当前 active change 或相似历史替代指定会话。
6. 代码修改完成后、最终回复前，针对本轮实际 touched code files 运行 `openprd dev-check . <file...>`；宣称准备就绪前，运行 `openprd standards . --verify`、`openprd quality . --verify` 和 `openprd run . --verify`。

### Hook-Enforced Gates

- requirement：需求未完成 `clarify/review/change/tasks` 前阻断实现写入；tasks 就绪后，只有用户原始意图已明确要求实现，或后续明确发出执行指令时才放行。
- research：公开 GitHub 架构/对标先 DeepWiki；第三方技术用法、配置、限制、版本差异或迁移先查本地证据，不足时再按 `resolve_library_id -> query_docs` 使用 Context7。
- skill-visualization：修改 skill、`SKILL.md`、`AGENTS.md` 或相关 workflow 前，先输出彩色 Mermaid 方案并等待用户确认。
- secrets / weapp / browser / copy：分别处理 `secrets-vault`、`weapp-dev-mcp`、窗口归属与 i18n/普通用户文案提醒。
- 需要细节时，读 router 指向的 skill 和 command catalog，而不是继续扩写 `AGENTS.md`。

### High-Risk Gate

Before freeze, handoff, accepted spec apply/archive, commit, push, release, or publish, ensure `openprd standards . --verify`, `openprd quality . --verify`, `openprd run . --verify`, and `openprd doctor .` are healthy.
If the quality report says `productionReady=false`, do not claim readiness; list the missing evidence or gates.
The only baseline documentation path is `docs/basic/`.
<!-- OPENPRD:AGENTS:END -->
