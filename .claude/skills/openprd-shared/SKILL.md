---
name: openprd-shared
description: OpenPrd 工作区、语言规则、门禁和 workspace-first 推理的共用守则。
---

<!-- OPENPRD:GENERATED
adapter=claude
source=openprd-shared
version=0.1.1
checksum=b46b8bd7b04c0886
-->

# OpenPrd Shared

这份规则集适用于所有 OpenPrd 工作。

## 优先读取

- `.openprd/state/current.json`
- `.openprd/state/task-graph.json`
- `.openprd/harness/install-manifest.json`
- `.openprd/harness/hook-state.json`
- `docs/basic/`

## 运行规则

- 动手前先从 `.openprd/` 重建上下文。
- 选择写入命令前，优先运行 `openprd status .` 和 `openprd next .`。
- 用户可见文档、进度日志、proposal、prompt 和报告默认使用简体中文；只保留必要专有名词、命令名、路径、字段名和 API 术语。
- 当 `locale` 为 `zh-CN` 时，diagram contract 中所有可见字段都必须使用简体中文；面向用户的 review.html 或 diagram HTML 文案不要使用 `freeze` 这类内部流程词，改写为“需求定稿前”“进入实现前确认”等业务可理解表达。
- OpenPrd 用户默认懂业务和产品，但不想读技术黑话；对外输出先给结论和下一步，能一句讲清楚就不要拆成两步。
- 主动替用户补全范围边界、失败路径、恢复路径、实现成本、维护成本、滥用风险和第三方依赖；默认按性价比选方案。
- 涉及第三方 API、模型、云服务或付费工具时，用表格比较效果、价格、接入成本、限制、风险和推荐理由；用户明确质量优先时，提高质量和稳定性权重。
- 当用户的问题包含多个对象、方案、文件、场景、风险、验证项、素材或任务，并且需要同时呈现状态、证据、影响、动作或推荐时，Agent 应主动使用 Markdown 表格，不等用户要求。先用一句话给结论，再给表格。
- 表格优先用于方案对比、状态盘点、问题排查、风险审查、多对象 QA、文件/命令清单、需求场景覆盖和内容/素材规划；单一结论、单一动作、代码示例、命令示例和叙事型说明不要强行表格化。
- 面向用户的时间统一使用上海时区 `YYYY-MM-DD HH:mm:ss` 格式，不带 `T`、`Z` 或毫秒。
- 保持未解决假设可见，不要悄悄补脑。
- 项目基线文档路径只能是 `docs/basic/`。
- 声称就绪前，至少通过 `openprd validate .` 和 `openprd standards . --verify`。
- 实现就绪还要运行 `openprd quality . --verify`，并审阅 HTML 质量评估报告中的场景标签、必需 EVO 门禁、可观测性、业务护栏、评估执行环境、性能和知识缺口。
- 用户要求生成图片、封面图、配图、海报、插画、图标、贴纸、头像、banner、主视觉/KV、运营图、效果图、视觉稿、mockup、先看样子或先确认设计方向时，默认直接调用 Codex 原生 Image 2 生图能力产出图片；对 logo、icon、avatar、badge 等开发素材，如果用户未明确要求 mockup、场景图、设备框、卡片承载、名片/包装展示或参考界面复刻，默认按独立素材输出（standalone asset）处理：使用全画布单主体，不额外添加 UI frame、卡片、设备壳、名片、桌面陈列、手持实拍或其他展示容器。只有当用户明确要求 mockup、场景化效果图、容器化呈现，或参考图本身包含这些结构时，才生成对应容器或场景；除非用户明确指定 HTML、SVG、CSS、Canvas、代码稿或可编辑矢量/source artifact，不要改用临时 HTML/SVG/CSS 再截图。
- OpenPrd 的 `review.html` 用于需求评审，不能替代图片或效果图生成；`visual-compare` 只用于实现阶段已有参考图之后的实现截图对比。
- 界面、页面、视觉、样式或前端体验开发中，只要已经有效果图、设计稿、图片资产或用户给图并进入实现阶段，阶段性完成后必须先截实现图，再运行 `openprd visual-compare . --reference <效果图> --actual <实现截图>` 生成左右对比 JPG。左侧标注“效果图”，右侧标注“实现截图”；Agent 必须查看合成图并继续对标，直到没有明显视觉差异，不能只凭主观判断宣称完成。
- 看到生成文件疑似过期时，先运行 `openprd doctor .`。
- `openprd run . --context` 只是建议。规划、分析、review、影响范围说明等请求保持只读，除非当前用户消息明确要求开发、实现、继续任务、深度调研、对标复刻或 commit/push。
- 用户给出会话 ID 并要求继续时，按工具无关的历史会话精确续接；不要要求或使用工具专属 ID；当前 active change、相似历史或 requirement gate 只能作为背景，不能替代该会话 ID。
- 代码修改完成后、最终回复前，针对本轮实际 touched code files 运行 `openprd dev-check . <file...>` 或 `node scripts/openprd-dev-check.mjs . <file...>`；700 行以内正常，701-1500 行需说明局部职责，超过 1500 行要判断本轮是否扩大职责，扩大则先重构/拆分/解耦并复查，窄 bugfix 或小修暂不拆时说明原因和后续拆分建议。
- 执行中发现可沉淀项时，不要中途打断当前任务：高置信工具识别补全和减少重复打扰这类低风险项可自动补齐；用户偏好、项目协作规矩和 OpenPrd 默认行为先沉淀为 `.openprd/growth` 候选，收工时再集中运行 `openprd grow . --review` 请用户确认。
- 维护 OpenPrd 本身时，只要新增或修改配置类能力（阈值、规则、识别、豁免、命令别名、环境差异、用户偏好或策略开关），都要做 grow-aware 自检：高置信应可成长时默认纳入 `openprd grow`；不确定时主动问用户；明确一次性或固定规则时才保持静态配置。
- 只要实现新增或修改文件，就做文档影响检查；缺失的 `docs/basic/`、文件说明书和文件夹 README 要补齐，已有文档受影响时要更新。
- 涉及后端、脚本、Agent、工具链、服务或数据处理变更时，把 CLI 与 API 视为同级接入面：检查命令入口、参数、输出契约、`help`、`doctor`、`dry-run`、`status` 与接口协议、返回结构、身份边界是否受影响，并同步更新 `docs/basic/backend-structure.md`；若某一面不适用也要明确写原因。
- Codex hooks 默认使用 `lite`：`UserPromptSubmit` 注入上下文、轻量 `PreToolUse` 写入门禁，以及 `Stop` 本轮收工回顾。只有项目明确需要更重的工具级遥测时，才切到 `full`。
- 需求复杂度分流优先使用 `$openprd-requirement-intake`，不要按固定关键词判断：L0 小修直接处理并事后说明；L1 中等改动先给对话内 mini-plan 再执行；L2 高影响或边界不清的需求在改代码前必须先完成需求入口：clarify、评审、任务拆解。`review --mark confirmed` 只记录稳定评审稿确认；如果用户原始意图已经明确要求实现，tasks 就绪后可直接进入执行，否则等待一句明确的执行指令。
- 涉及最佳实践、benchmark、对标、参考产品、prompt engineering、Agent harness、context engineering、图标资源、CLI 或 skill 体系设计时，先使用 `$openprd-benchmark-router` 选择证据源，再进入 Context7、DeepWiki 或官方资料调研。
- 入口路由优先看 `$openprd-router`；具体命令速查优先看 `.openprd/harness/command-catalog.md`。
- `AGENTS.md` 只保留轻量合同；详细执行细则优先沉淀到 repo-local skills、command catalog 和 hooks。
- 任务需要 API key、token、账号信息、第三方服务凭证或个人信息时，先使用 `secrets-vault` skill，且不要直接读取原始 vault 文件。
- 修改 skill、`SKILL.md`、`AGENTS.md` 或相关 workflow 前，先读取现状、输出彩色 Mermaid 方案图，并等待用户确认后再编辑相关文件。
- 涉及微信小程序测试、验证、截图、日志、网络请求、开发者工具自动化或运行态相关改动时，先使用 `weapp-dev-mcp` skill；未通过本地 MCP 实际验证时，不要宣称“小程序已验证”。
- 用户明确要求 Computer Use 时优先使用 Computer Use，并尽量在 Codex-owned browser window 中操作；对提交、删除、发送、切换账号、退出登录、支付、关闭标签页等高风险网页动作先确认窗口归属。
- 修改用户可见文案前，先检查 `i18n`、`locales`、`translations`、`Localizable` 或其他语言资源；若项目已有多语言结构，用户可见文案要同步维护到所有已支持语言，并避免暴露 API、SDK、模型、数据库、缓存或错误码等实现细节。

## 写入纪律

- 只读命令优先：`status`、`next`、`validate`、`standards --verify`、`doctor`。
- 下一道门禁没看清之前，不要贸然执行写入命令。
- 面对规划、分析、审查类请求，不要运行 `openprd loop --run`、`openprd tasks --advance`、`openprd discovery --advance`、`openprd loop --finish --commit`、git commit 或 git push。
- 代码改动完成后，要回顾 `openprd dev-check` 输出；若出现 `attention` 或 `warning`，说明是否已局部处理、是否已拆分，或为什么窄修暂不拆。
- 代码改动完成后，要回顾自我成长项：已自动补齐的低风险工具识别项简短说明；仍待确认的偏好、项目规矩或 OpenPrd 默认行为再用 `openprd grow . --review` 集中呈现。
- 代码改动完成后，要说明 `docs/basic/`、文件说明书和文件夹 README 是新增、更新还是有意不变。
- 用户要求生成图片、封面图、配图、海报、插画、图标、贴纸、头像、banner、主视觉/KV、运营图、效果图、视觉稿、mockup、先看样子或先确认设计方向时，最终回复应给出 Image 2 生成的图片结果；如果是 logo、icon、avatar、badge 等开发素材且用户未明确要求 mockup 或场景化呈现，默认给出独立素材输出结果。只有实现阶段已有参考图时，才给出 `openprd visual-compare` 生成的 JPG 路径并说明对比后是否仍有差异。
- `freeze`、`handoff`、`change --apply`、`change --archive`、commit、push、release、publish 等高风险动作都要求前置门禁全绿。

## 修复路径

1. 运行 `openprd doctor .`。
2. 如果生成引导或 hooks 漂移，运行 `openprd update .`。
3. 运行 `openprd standards . --verify` 并修复文档标准。
4. 运行 `openprd quality . --verify` 并审阅 HTML 质量评估报告；若 `productionReady=false`，最终回复必须列出缺证据或需关注的必需 EVO 门禁。
5. 报告就绪前运行 `openprd validate .`。
