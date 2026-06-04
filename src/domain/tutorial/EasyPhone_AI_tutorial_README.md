# 文件夹说明书

## 核心功能
教程领域:`Tutorial` / `TutorialStep` 类型 + `findTutorial()` 匹配 + `safeTutorialsFor()` 防御性过滤 + 首批教程库(白名单)。

## 输入
- `findTutorial(text)`:归一化后做 includes 匹配(关键词数量倒序,更具体的优先)。
- `safeTutorialsFor(level)`:按风险等级过滤(高/极高风险不展示教程)。

## 输出
- `tutorial.ts` — `Tutorial` / `TutorialStep` 接口、`findTutorial()` / `safeTutorialsFor()`、冻结的 `TUTORIALS`(首批 2 个:微信无声音 / 把手机字变大)。
- `tutorial.test.ts` — 单元测试。

## 定位
教程库 = 人工维护的"白名单"(docs/05 §3.3);AI 不自由编教程,**只改写**(M5);`safeTutorialsFor` 二次防御 `shouldStopGuidance`。

## 依赖
- `../risk/types.ts`(`RiskLevel`)。
- 调用方:`@/app/tutorial/page.tsx`、`@/app/tutorial/tutorial-client.tsx`。

## 维护规则
- 每次新增、删除、移动文件或调整职责后,必须检查并更新本 README。
- 文件夹职责影响项目基础文档时,必须同步更新 `docs/basic/`。
- 扩库按 `docs/07 §11` 三道闸(真实漏报驱动),不凭想象。
- 改 `findTutorial` 匹配算法 = 改用户体验,**必须 review**。
- `alternative` 字段放数据不放 UI state(参 `tutorial-client.tsx` 的 rationale)。
