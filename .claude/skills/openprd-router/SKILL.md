---
name: openprd-router
description: OpenPrd 入口路由 skill：先判断当前任务该读哪个 skill、哪个命令面和哪个门禁。
---

<!-- OPENPRD:GENERATED
adapter=claude
source=openprd-router
version=0.1.1
checksum=43b6ddbd984790b3
-->

# OpenPrd Router

把这份 skill 当成 OpenPrd 的入口路由，而不是长文规则仓库。

## 先做什么

1. 先读 `.openprd/` 当前状态，并把 `openprd run . --context` 当作建议上下文，而不是自动执行指令。
2. 需要具体命令时，优先读取 `.openprd/harness/command-catalog.md`，不要把命令清单继续塞回 `AGENTS.md`。
3. 需要共用约束时，读 `$openprd-shared`；需要主工作流时，读 `$openprd-harness`。

## 路由表

- 需求入口分流、L0/L1/L2 判断、PRD lens 选择：`$openprd-requirement-intake`
- 主工作流、review/change/tasks、`run/loop`：`$openprd-harness`
- 最佳实践、benchmark、公开 GitHub 仓库、第三方技术事实、prompt/context engineering：`$openprd-benchmark-router`
- `docs/basic/`、文件说明书、文件夹 README、文档标准：`$openprd-standards`
- 就绪验证、EVO 门禁、HTML 质量评估报告、项目经验沉淀：`$openprd-quality`
- 架构图、产品流程图、可视化评审：`$openprd-diagram-review`
- 长时间只读挖掘、参考项目持续调研、requirements/specs/tasks 补全：`$openprd-discovery-loop`
- 学习包、归档阅读器、知识整理：`$openprd-learning-review`

## 路由原则

- `AGENTS.md` 只保留轻量入口合同；详细规则放进 repo-local skills、`.openprd/harness/command-catalog.md` 和 hooks。
- 公开 GitHub 仓库架构/对标先 DeepWiki；第三方库、API、SDK、MCP、CLI 用法先查本地证据，本地不足时再按 `resolve_library_id -> query_docs` 使用 Context7。
- hooks 已经强制处理 requirement / research / secrets / skill-visualization / weapp / browser / copy 这些门禁；不要再把它们膨胀回 `AGENTS.md` 静态长文。
- 不要用固定关键词决定是否写 PRD；先让 `$openprd-requirement-intake` 按影响面、未知数、决策成本和验证成本做语义分流。
