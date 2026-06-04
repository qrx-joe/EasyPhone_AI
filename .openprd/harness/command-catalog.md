<!-- OPENPRD:GENERATED
adapter=project
source=command-catalog
version=0.1.1
checksum=28bed5d3a3b951d0
-->

# OpenPrd Command Catalog

这份清单只负责回答两件事：当前 CLI 有哪些稳定入口，以及什么情况下该用哪条命令。

## 状态与修复

- `openprd run . --context`：读取 hook-stable 建议上下文；它是建议，不是自动执行指令。续做历史任务或按用户描述找对应需求/任务时，可带 `--message <用户原话>` 先解析显式目标。
- `openprd run . --verify`：校验当前 run 门禁，并把 `taskReady` 与 `workspaceReady` 分开报告。
- `openprd doctor .`：检查生成引导、hooks、skills、standards 与验证健康度。
- `openprd update .`：修复生成引导、skills、hooks 与 drift。
- `openprd next .`：查看下一步 harness 动作。

## 需求与评审

- `openprd clarify .`：生成需求入口自省，并把澄清压缩回对话内确认。
- `openprd capture . --field <path> --value <text|json>`：把用户确认写回状态。
- `openprd synthesize .`：生成可评审 PRD 与 `review.html`。
- `openprd review . --open`：打开当前 PRD review artifact。
- `openprd review . --mark confirmed --version <id> --digest <sha256> --work-unit <id>`：记录当前稳定评审稿；默认用于人类确认后的记录，若当前 lane 已进入 silent-record policy，也只能对精确匹配的稳定 artifact 记录。

## 设计与实现准备

- `openprd change . --generate --change <id>`：把 PRD 转成 change。
- `openprd change . --validate --change <id>`：校验 change 结构。
- `openprd tasks . --change <id>`：查看当前 dependency-ready 任务。
- `openprd tasks . --change <id> --advance --verify --item <task-id>`：运行 verify 并推进单个任务。
- `openprd loop . --plan --change <id>`：为长程实现构建单任务列表。
- `openprd loop . --run --agent codex|claude --dry-run`：准备一个 fresh single-task session。

## Benchmark 与学习包

- `openprd benchmark add <url|repo|file> --notes <text>`：把外部最佳实践先写入 candidate，用于后续 approve/verify。
- `openprd benchmark list .`：查看当前项目的 approved 与 candidate benchmark source。
- `openprd benchmark approve <benchmark-id>`：把 candidate 纳入项目级长期 registry。
- `openprd benchmark verify .`：检查重复来源、失效链接、缺场景和过宽触发词。
- `openprd learn . --topic <text> --open`：生成当前项目的学习包骨架和 HTML 阅读器。
- `openprd learn . --content-json <file> --open`：让 Agent 写完 `learning-content.json` 后重新渲染最终图文阅读器。

## 视觉与质量

- `openprd visual-compare . --reference <效果图> --actual <实现截图>`：输出左右对比 JPG。
- `openprd dev-check . <file...>`：收工回顾 touched code files 的行数状态与下一步动作。
- `openprd standards . --verify`：校验 `docs/basic/`、文件说明书、文件夹 README 等标准。
- `openprd quality . --verify`：生成 HTML 质量评估报告并检查 EVO 门禁。
- `openprd grow . --review`：审查执行中发现的规则/配置候选，再决定是否 apply。

## 深度扫描与历史项目

- `openprd discovery . --resume|--verify`：恢复或校验 discovery 状态。
- `openprd fleet <root> --dry-run`：批量审计历史项目。
- `openprd fleet <root> --sync-registry`：把当前 root 下已初始化的 `.openprd/` 工作区回填到全局 registry。
- `openprd fleet <root> --backfill-work-units`：补历史 PRD work unit 绑定。
- `openprd fleet <root> --update-openprd`：只刷新已有 `.openprd/` 的项目。

## 使用原则

- 规划、分析、评审、解释影响范围时，保持只读；不要因为命令存在就直接执行写入。
- 只有用户明确要求实现、继续任务、深度调研、对标复刻或提交时，才进入 `tasks --advance`、`loop --run`、commit、push 等执行动作。
- 高风险动作前先过 `openprd standards . --verify`、`openprd quality . --verify` 和 `openprd run . --verify`；`openprd doctor .` 主要用于集成漂移、生成引导 drift，或 commit/push/freeze/handoff 前的最终健康检查。
