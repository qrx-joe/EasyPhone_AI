# 文件夹说明书

## 核心功能
家人求助卡领域:HelpRequest 类型 + 模板 + 序列化三件套,把已分类为高/极高风险的问题打包成可发给家人的求助卡。

## 输入
- `buildHelpRequest(question)`:question 必填,且 `question.risk.level !== 'low'`(否则抛错)。
- `serializeHelpCard(help)`:必填的 HelpRequest。

## 输出
- `help-request.ts` — `HelpRequest` 接口 + `createHelpRequest()` 工厂(全 readonly + 冻结)。
- `help-templates.ts` — `SUGGESTIONS_BY_LEVEL` 内部模板表(medium 3 / high 4 / critical 5) + `buildHelpRequest(question)` 策略层。
- `card-serialization.ts` — `serializeHelpCard(help)` 纯文本序列化(产品签名 + summary + 编号建议 + 风险等级 + 时间)。
- `help.test.ts` / `card-serialization.test.ts` — 单元测试。

## 定位
关注点分离:**类型/工厂在 help-request.ts,模板策略在 help-templates.ts,view 序列化在 card-serialization.ts**;M5 接 AI 改写 summary 时只换 templates。

## 依赖
- `../risk/types.ts`(`RiskLevel`)
- `../question/question.ts`(`QuestionRecord`)
- 调用方:`@/app/risk-alert/page.tsx`、`@/app/risk-alert/risk-alert-client.tsx`。

## 维护规则
- 每次新增、删除、移动文件或调整职责后,必须检查并更新本 README。
- 文件夹职责影响项目基础文档时,必须同步更新 `docs/basic/`。
- 工厂对非法输入**抛错**(不返回 null)—— 低风险"误生成求助卡"是体验事故。
- 数据最小化:不进卡片的(验证码/密码/身份证号)由 `card-serialization.ts` 守。
- 序列化**不**嵌 HTML/Markdown(纯文本最稳,家人直接转发);**不**含 matched keywords(那是给开发/调试看的)。
