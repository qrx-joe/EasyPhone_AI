---
name: openprd-quality
description: 评估可观测性、业务成本与滥用护栏、评估执行环境覆盖、性能基线、极端场景，以及 HTML 质量评估报告和项目知识 Skill。
---

<!-- OPENPRD:GENERATED
adapter=claude
source=openprd-quality
version=0.1.1
checksum=2f81f0cfd774aea6
-->

# OpenPrd Quality

当实现就绪、日志、链路追踪、免费额度、业务成本、滥用防护、评估执行环境、冒烟测试、性能基线、压力数据或项目级经验 Skill 在范围内时，使用这份 skill。

## 命令

- `openprd quality . --init`：初始化 `.openprd/quality/config.json` 和 `.openprd/knowledge/`
- `openprd quality . --verify`：在 `.openprd/quality/reports/` 下生成 JSON 和 HTML 质量评估报告
- `openprd quality . --learn --from <report-id-or-json>`：把已修复或已审查的质量问题沉淀为项目级经验 Skill
- `openprd grow . --review`：审查执行中发现的可复用配置、规则候选或 user-local 偏好；和 `quality --learn` 互补，前者沉淀操作配置，后者沉淀已验证质量经验。

## 审查契约

- 场景画像：先判断当前变更是基础、前端、桌面端、后端、成本、安全、性能、极端数据还是发布交付场景，再确定必需 EVO 门禁。
- 可观测性：确认中心化 logs / traces / errors、共享 trace/request/task/error id、脱敏、保留期和查询示例。
- 业务护栏：涉及免费用户、额度、AI 调用、第三方 API、生成、存储或下载时，确认成本来源、用户级限制、负向验证、监控、报警和止损动作。
- 评估执行环境：确认冒烟测试、任务到功能覆盖、正常性能基线和极端数据压力场景；脚本存在只代表能力，不能替代本次运行证据。
- 视觉评审证据：涉及界面视觉实现且已有参考效果图时，确认 `.openprd/harness/visual-reviews/` 下存在本次 `openprd visual-compare` 输出的 JPG，并且 Agent 已基于合成图复核差异。
- HTML 报告：把 `.openprd/quality/reports/*.html` 当成面向人的评审产物，而不是次级导出。
- 知识沉淀：当某个已验证修复具备重复性、高影响、隐藏性或由 agent 误判引发时，把模式抽象到 `.openprd/knowledge/skills/<skill>/SKILL.md`。
- 自我成长：当问题来自配置缺口、文件识别、命令习惯或用户偏好时，优先记录为 `.openprd/growth` 候选，经用户确认后固化；不要把个人偏好混进项目共享质量经验。

## 就绪规则

- `openprd run . --verify` 中只要质量报告 `productionReady=false`，就不能宣称整体就绪。
- UI 任务有参考图但缺少 visual-compare 输出时，不要宣称视觉实现完成；如果对比图仍有明显偏差，先返工而不是把差异留给用户发现。
- 最终回复必须列出未通过的必需 EVO 门禁；场景可选门禁可以说明为 advisory，但不能混同为已通过。

## 收紧规则

Agent 创建的性能基线从合理的行业平均默认值开始。用户可以放宽或收紧，但 Agent 的自更新只能收紧阈值。
