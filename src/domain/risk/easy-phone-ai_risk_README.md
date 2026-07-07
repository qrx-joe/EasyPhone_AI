# 文件夹说明书

## 核心功能
整个产品的"安全核心":风险等级枚举 + 等级数值映射 + "是否该停教程"判定 + 规则版风险分类器 + 关键词数据源。

## 输入
- 上游:`classifyRiskByRules(text)` 接 `text: string`(空 / 纯空白 → 直接返回 low)。
- 上游:`routing/user-routing.ts` 读 `shouldStopGuidance` / `RiskClassification`。

## 输出
- `types.ts` — `RiskLevel` / `RISK_RANK` / `shouldStopGuidance()` / `RiskClassification` 接口。
- `risk-keywords.ts` — `RiskKeyword` / `ScenarioTag` / 冻结的 `RISK_KEYWORDS`(~100 条 7 桶)。
- `classify-risk.ts` — `classifyRiskByRules(text)` 纯函数,返回 `RiskClassification`(命中多关键词时 level = MAX,安全保险丝)。
- `classify-risk.test.ts` — 16 个验收用例。

## 定位
风险领域协议层 + 分类实现;`shouldStopGuidance` 是高风险分流的唯一判官;增删关键词**只动 risk-keywords.ts**,不动 classify 逻辑。

## 依赖
- 内部无(纯类型 + 纯函数 + 数据)。
- 调用方:`@/domain/routing/user-routing`、`@/domain/question/question`、`@/app/risk-alert/page.tsx` 等。

## 维护规则
- 每次新增、删除、移动文件或调整职责后,必须检查并更新本 README。
- 文件夹职责影响项目基础文档时,必须同步更新 `docs/basic/`。
- 改 `classifyRiskByRules` 匹配算法 / 降级逻辑 / MAX 行为 = 改安全不变量,**必须 review + 加测试**。
- 改 `shouldStopGuidance` 阈值必过 `classify-risk.test.ts` + `user-routing.test.ts`。
- 扩库按 `docs/07 §11` 三道闸:真实漏报驱动 → 测试覆盖 → 老年用户测试;不凭想象写。
