---
name: openprd-harness
description: 驱动 OpenPrd 工作区完成 clarify、synthesize、diagram、freeze、handoff、change、tasks 和验证。
---

<!-- OPENPRD:GENERATED
adapter=claude
source=openprd-harness
version=0.1.1
checksum=ac3ad1376e7de25f
-->

# OpenPrd Harness

当用户要求产品规划、需求细化、实现准备或执行就绪时，使用这份 skill。

## 默认流程

1. 先运行 `openprd run . --context`，获取 hook-stable 执行视图。
2. 先判断当前用户意图，再决定是否跟随建议。
- 会话 ID 续接：用户给出会话 ID 并要求继续时，把它当成工具无关的历史会话续接请求；先精确恢复该会话历史，不要把当前 active change、相似历史或当前 requirement gate 当成替代目标，也不要把它称为工具专属 ID。
3. 面对规划、分析、架构评审、“怎么改”或“会动哪些文件”类请求，保持只读并基于代码、文档和状态回答。
4. 需要完整工作流细节时，运行 `openprd status .` 和 `openprd next .`。
5. 涉及最佳实践、benchmark、对标、参考产品、prompt engineering、Agent harness、context engineering、图标资源、CLI 或 skill 体系设计时，先使用 `$openprd-benchmark-router`。
6. 先用 `$openprd-requirement-intake` 做 L0/L1/L2 语义分流：L0 小修直接处理并事后说明；L1 给对话内 mini-plan 后执行；L2 高影响或边界不清的需求在改代码前必须先走需求入口：`openprd clarify .` 会生成需求入口自省，并只在对话内输出澄清摘要或简短清单；正式 HTML 评审留给后续 review。
7. 事实缺失时，用 `openprd clarify .` 和 `openprd capture .` 补全，再 synthesize/review、生成或检查 change、拆任务。`clarifyPresentation.mode` 为 `inline` 或 `inline-with-checklist`，直接在对话中用目标、范围、非目标和验收方式压缩确认，不打开澄清 HTML。review 重点摘要胶囊应控制在 15 个字以内，作为扫读标签，不写成长句；对用户给稳定 artifact 路径，确认命令使用页面复制出的 `--version`、`--digest` 和 `--work-unit`，不要把可被其他对话覆盖的 active review 当成唯一确认入口，也不要把“可以开做”“继续实现”之类实现授权当成 `review --mark confirmed` 的依据。如果 synthesize 被简体中文 spec 预检阻断，先把纯内部措辞整理用 `openprd capture . --source agent-normalized` 写回，再重新 synthesize；这类非语义规范化不应重开用户 review。默认 approval policy 是 decision-points：需要时保留稳定 `review.html`，但只有当前 lane 仍要求人类决策时才停下来请求确认；如果用户一开始就明确要求直接做且不需要再评审/确认，则允许按当前稳定 artifact 的精确 `version + digest + work-unit` 记录 review，再继续 change/tasks。若用户原始意图已明确要求实现，则在当前 approval policy 满足且 tasks 就绪后直接进入执行；否则等待一句明确的执行指令。
8. 评审页里的需求关系图、需求流程图和重点摘要不要靠 HTML 截断；`openprd synthesize` 生成版本快照后，不要直接让用户确认 review。必须先用 `openprd review-presentation . --template` 查看展示文案契约，让 Agent 按 reviewPresentation 写短文案，再用 `openprd review-presentation . --presentation <json> --write --fail-on-violation` 校验并写回；脚本会在通过后写入校验元信息并重渲染可确认 review.html。超限时按脚本返回的 jsonPath 和字数限制重新提炼，不手工改快照、不裁剪原文。
9. 对外说明默认用业务和产品语言，先给结论和下一步；涉及第三方 API、模型、云服务或付费工具时，用表格比较多家方案的效果、价格、接入成本、限制、风险和推荐理由，默认选择性价比最优；当用户的问题包含多个对象、方案、文件、场景、风险、验证项、素材或任务，并且需要同时呈现状态、证据、影响、动作或推荐时，主动使用 Markdown 表格，单一结论、代码示例、命令示例和叙事型说明不要强行表格化。
10. 当 PRD 需要进入实现准备时，再运行 `openprd change . --generate --change <id>`。
11. 长程实现使用 `openprd loop . --plan --change <id>`，并且只有用户明确要求开发、继续任务、深度调研、对标复刻或 commit 时才执行单任务 fresh session。
12. 代码修改完成后、最终回复前，针对本轮实际 touched code files 运行 `openprd dev-check . <file...>` 或 `node scripts/openprd-dev-check.mjs . <file...>` 回顾行数状态：700 行以内正常，701-1500 行需说明局部职责，超过 1500 行要判断本轮是否扩大职责，扩大则先重构/拆分/解耦并复查，窄 bugfix 或小修暂不拆时说明原因和后续拆分建议。
13. 如果执行中发现新代码后缀、豁免路径、命令别名、项目约定或用户偏好，不要中途打断任务。工具识别能力补全和减少重复打扰的高置信低风险项可自动应用并记录；用户偏好、项目协作规矩和 OpenPrd 默认行为形成 growth candidate，收工时用 `openprd grow . --review` 集中确认。
14. 维护 OpenPrd 本身时，只要新增或修改配置类能力（阈值、规则、识别、豁免、命令别名、环境差异、用户偏好或策略开关），默认先做 grow-aware 自检：高置信应可成长时直接纳入 `openprd grow` 体系；不确定时主动询问用户是否做成可成长配置。
15. 实现过程中，每次新增或修改文件都做文档影响检查，补齐缺失的 `docs/basic/`、文件说明书和文件夹 README，并更新受影响文档；涉及后端、脚本、Agent、工具链、服务或数据处理变更时，把 CLI 与 API 视为同级接入面：同步检查命令入口、参数、输出契约、`help`、`doctor`、`dry-run`、`status` 与接口协议、返回结构、身份边界是否受影响，并更新 `docs/basic/backend-structure.md` 或明确写不适用原因。
16. 用户要求生成图片、封面图、配图、海报、插画、图标、贴纸、头像、banner、主视觉/KV、运营图、效果图、视觉稿、mockup、先看样子或先确认设计方向时，默认直接调用 Codex 原生 Image 2 生图能力产出图片；对 logo、icon、avatar、badge 等开发素材，如果用户未明确要求 mockup、场景图、设备框、卡片承载、名片/包装展示或参考界面复刻，默认按独立素材输出（standalone asset）处理：使用全画布单主体，不额外添加 UI frame、卡片、设备壳、名片、桌面陈列、手持实拍或其他展示容器。只有当用户明确要求 mockup、场景化效果图、容器化呈现，或参考图本身包含这些结构时，才生成对应容器或场景；除非用户明确指定 HTML、SVG、CSS、Canvas、代码稿或可编辑矢量/source artifact，不要改用临时 HTML/SVG/CSS 再截图。OpenPrd 的 `review.html` 只用于需求评审，不能替代图片或效果图生成。
17. 界面、页面、视觉、样式或前端体验任务中，如果已经有效果图、设计稿、图片资产或用户给图且进入实现阶段，阶段性完成后先截实现图，再运行 `openprd visual-compare . --reference <效果图> --actual <实现截图>`。默认输出 JPG 到 `.openprd/harness/visual-reviews/`，左侧标注“效果图”、右侧标注“实现截图”；查看合成图后继续复刻，直到没有明显视觉差异。
18. 声称就绪前，运行 `openprd standards . --verify` 和 `openprd run . --verify`。
19. 阶段性代码完成后，运行 `openprd quality . --verify`，把 HTML 质量评估报告当作当前场景必需 EVO 门禁、日志、业务成本与滥用护栏、冒烟覆盖、性能、极端场景和项目知识的评审产物。
20. `AGENTS.md` 只保留轻量合同；入口路由看 `$openprd-router`，具体命令速查看 `.openprd/harness/command-catalog.md`，更细的工作流步骤、路由边界和 hook 门禁以这份 skill、`$openprd-shared` 和 `$openprd-benchmark-router` 为准。
21. hook 会强制阻断几类场景：需求入口未完成就写实现、外部证据不足就直接改第三方集成、skill/AGENTS 变更未先可视化确认、以及敏感信息场景下直接读原始 vault 文件。

## 门禁协议

- 不要跳过 `openprd run . --context`；它是最适合 hooks 的控制面。
- 不要把 `run --context` 里的建议当成直接用户命令。
- 面对“看看、规划、梳理、分析、评估、怎么改、预计动哪些文件、review、explain”等只读意图，不运行 OpenPrd 写入命令。
- 现有项目需求仍模糊时，优先 discovery，再考虑 synthesize。
- 进入定稿或交接前，运行 `openprd run . --verify` 并确认 review blocker 已关闭。
- 声称实现就绪前，审阅最新 `.openprd/quality/reports/*.html` HTML 质量评估报告；`productionReady=false` 时不得宣称就绪。
- accepted spec 推进前，先运行 `openprd change . --validate --change <id>`。

## hook 驱动循环

- 把 `.openprd/harness/run-state.json` 和 `iterations.jsonl` 当成持久循环状态。
- 默认 lite hooks 不记录每一轮工具细节，但会在明确 OpenPrd / 深度工作提示词和产品、模块、流程需求下注入上下文；复杂或模糊需求提示先做三轮 Requirement Intake Reflection，轻量写入门禁会阻断过早改代码；本轮准备结束时再通过 `Stop` 做一次轻量项目经验回顾。
- 只有项目确实需要完整遥测时才使用 `--hook-profile full`。
- 上下文注入后，hooks 会从 OpenPrd 状态里推荐下一项 task、discovery 或 workflow 动作。
- 门禁失败时，任务或覆盖项保持未完成状态，让下一轮继续重试。
- 可以把跨任务可复用经验记录到 `.openprd/harness/learnings.md`、本地 `AGENTS.md` 或 `docs/basic/`。

## 长程实现循环

- 运行 `openprd loop . --init`，再运行 `openprd loop . --plan --change <id>` 生成 `.openprd/harness/feature-list.json`。
- 用 `openprd loop . --next` 找到下一个依赖已满足的任务。
- 用 `openprd loop . --run --agent codex --dry-run` 或 `openprd loop . --run --agent claude --dry-run` 生成单任务 prompt 和启动命令。
- 只有当前用户消息明确要求执行开发、继续任务或深度调研时，才运行 `openprd loop . --run`。单纯的规划问题不构成执行授权。
- 每个 loop 任务对应一个全新 agent 会话边界，不要在同一会话里继续下一项任务。
- 只有在任务 verify 命令和 `openprd run . --verify` 通过后，且用户明确要求 commit 时，才用 `openprd loop . --finish --item <task-id> --commit` 收尾。
- 前端界面任务里，Codex desktop 优先用 Computer Use；Codex CLI 和 Claude Code 优先用 Playwright、MCP 浏览器自动化或项目现有 e2e 工具。
- 用户只是要求生成图片、封面图、配图、海报、插画、图标、贴纸、头像、banner、主视觉/KV、运营图、效果图、视觉稿、mockup 或先看样子时，默认调用 Codex 原生 Image 2 生成图片；对 logo、icon、avatar、badge 等开发素材，如果用户未明确要求 mockup、场景图、设备框、卡片承载、名片/包装展示或参考界面复刻，默认按独立素材输出（standalone asset）处理：使用全画布单主体，不额外添加 UI frame、卡片、设备壳、名片、桌面陈列、手持实拍或其他展示容器。只有当用户明确要求 mockup、场景化效果图、容器化呈现，或参考图本身包含这些结构时，才生成对应容器或场景；除非用户明确指定 HTML/SVG/CSS/Canvas/代码稿，不要生成临时 HTML 再截图。
- 如果已有参考效果图、图片资产或用户给图并进入实现阶段，阶段性完成后必须生成实现截图，并用 `openprd visual-compare . --reference <效果图> --actual <实现截图>` 输出 JPG 视觉对比图。未查看对比图、或对比图仍有明显差异时，不要声称界面复刻完成。
- `openprd loop . --finish` 会写入 `.openprd/harness/test-reports/<task-id>.md`；把这份结构化测试报告和任务改动一起提交。
- 让 `.openprd/harness/feature-list.json`、`progress.md`、`agent-sessions.jsonl`、`loop-state.json`、`loop-prompts/` 和 `test-reports/` 成为持久状态。

## 失败处理

- 命令失败后不要凭直觉继续。
- 重新运行 `openprd run . --context`、`openprd doctor .`，并按输出里的修复命令处理。
- 如果失败假设影响产品范围，把它保留在 `.openprd/engagements/active/open-questions.md`。

## 历史项目

- 批量处理旧项目之前，先用 `openprd fleet <root> --dry-run` 审计。
- 已有历史项目要先回填全局名册时，用 `openprd fleet <root> --sync-registry` 把已初始化的 `.openprd/` 工作区写回 `~/.openprd/registry/workspaces.jsonl`。
- 用 `openprd fleet <root> --backfill-work-units` 为已有 PRD 版本补 work unit、digest 和稳定评审页。
- 用 `openprd fleet <root> --update-openprd` 只刷新已经包含 `.openprd/` 的项目，并顺带补齐历史 work unit 绑定。
- 除非用户明确要求 OpenPrd 接管 agent-only 或 plain 项目，否则不要使用 `--setup-missing`。
