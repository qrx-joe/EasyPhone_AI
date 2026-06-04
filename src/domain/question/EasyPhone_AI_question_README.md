# 文件夹说明书

## 核心功能
用户问题领域:`QuestionRecord` 类型 + `createQuestion()` 工厂;一旦被记为 QuestionRecord,就**已经过**风险分类。

## 输入
- `createQuestion(text, source, risk)`:text 必填(空抛错)、source 为 `'voice' | 'text' | 'demo'`、risk 必填(必来自 `classifyRiskByRules`)。

## 输出
- `question.ts` — `QuestionSource` 联合类型、`QuestionRecord` 接口(全 readonly + 冻结)、`createQuestion()` 工厂(抛错不返回 null)。
- `question.test.ts` — 单元测试。

## 定位
"已分类"问题的快照类型与工厂;防止"拿着原始输入跳过分流"的安全漏洞;工厂抛错而非返回 null,安全核心不留残缺态。

## 依赖
- `../risk/types.ts`(`RiskClassification`)。
- 调用方:`@/app/risk-alert/page.tsx`、`@/domain/help/*`。

## 维护规则
- 每次新增、删除、移动文件或调整职责后,必须检查并更新本 README。
- 文件夹职责影响项目基础文档时,必须同步更新 `docs/basic/`。
- 改 `createQuestion` 的不变量必过 `question.test.ts`。
- 工厂对非法输入**抛错**(不返回 null)—— 安全核心不留残缺态。
- 不在这里写风险判断(那是 `risk/classify-risk.ts` 的事)。
