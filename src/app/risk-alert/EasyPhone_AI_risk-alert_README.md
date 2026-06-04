# 文件夹说明书

## 核心功能
高风险分流后的「家人求助卡」页:server 端重新分类(防 URL 篡改) + 打包求助卡数据,client 端做 UI、复制、模拟发送。

## 输入
- URL `searchParams.text`(忽略其他 query);text 缺失 redirect 到 `/`。
- 上游依赖:`@/domain/risk/classify-risk`、`@/domain/question/question`、`@/domain/help/help-templates`、`@/domain/help/help-request`。

## 输出
- `page.tsx` — server 入口,导出 `RiskAlertPage`;调用 `classifyRiskByRules` 二次校验,渲染 `<RiskAlertClient help={help} />`。
- `risk-alert-client.tsx` — client 组件,导出 `RiskAlertClient`,渲染求助卡 UI 并处理复制/模拟发送/返回首页。

## 定位
高风险路径的入口 server + UI client;不信任 URL 里的 `level/keywords/reason`,防御手拼 URL 绕过;非高风险兜底 redirect 到 `/tutorial` 或 `/`。

## 依赖
- `@/domain/risk/classify-risk`(classifyRiskByRules)
- `@/domain/risk/types`(shouldStopGuidance)
- `@/domain/question/question`(createQuestion)
- `@/domain/help/help-templates`(buildHelpRequest)
- `@/domain/help/help-request`(HelpRequest)
- `@/domain/help/card-serialization`(serializeHelpCard)
- `next/link`、浏览器 Clipboard API

## 维护规则
- 每次新增、删除、移动文件或调整职责后,必须检查并更新本 README。
- 文件夹职责影响项目基础文档时,必须同步更新 `docs/basic/`。
- 改分类或卡片模板要同步跑对应 domain 单元测试;新增兜底 redirect 要在首页 user-routing 测试里加 case。
