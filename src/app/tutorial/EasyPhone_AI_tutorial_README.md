# 文件夹说明书

## 核心功能
教程页 server 入口 + 客户端分步交互:server 匹配教程 + 没匹配时给兜底页(不直接断流程),client 维护步进索引、显示当前步骤并支持「念给我听」/前进/没看到/点错了。

## 输入
- URL `searchParams.text`;text 缺失 redirect 到 `/`。
- 上游依赖:`@/domain/tutorial/tutorial`(findTutorial)。

## 输出
- `page.tsx` — server 入口,导出 `TutorialPage`;匹配到教程 → 渲染 `<TutorialClient>`,没匹配到 → 渲染 `<NoTutorialFound>`(保留 text 让用户改)。
- `tutorial-client.tsx` — client 组件,导出 `TutorialClient`,内部含 `CompletedView`;维护 currentStepIndex / showAlternative / showResetWarning 三态,接 SpeechRateControl + SpeakButton。

## 定位
教程路径的 server 入口 + UI 状态机;不做风险过滤(高风险应已在前置路由被分流到 `/risk-alert`);教程库放 server 减 client bundle。

## 依赖
- `next/navigation`(redirect)、`next/link`
- `@/domain/tutorial/tutorial`(findTutorial / Tutorial 类型)
- `@/lib/speech/speak-button`(SpeakButton)
- `@/lib/speech/speech-rate`(SpeechRateControl、useSpeechRate)

## 维护规则
- 每次新增、删除、移动文件或调整职责后,必须检查并更新本 README。
- 文件夹职责影响项目基础文档时,必须同步更新 `docs/basic/`。
- 改兜底页要保持「不直接 redirect、保留 text」以便老人改说法重试;教程库变更后同步看 `findTutorial` 单测。
