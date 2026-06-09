# 文件夹说明书

## 核心功能
高风险场景的 Demo 直链路由:白名单 case → 走统一 `buildRouteForInput` → 1 次 server redirect 到 `/risk-alert` 或兜底回 `/`。

## 输入
- URL `searchParams.case`(白名单 key:`medical-sms` / `public-security` / `screen-share` / `apple-id` / `fake-benefit`)。

## 输出
- `page.tsx` — 唯一文件,导出 `RiskAlertDemoPage`;server component,只 1 次 redirect,不在该页渲染任何 UI。

## 定位
演示专用路由(路演 2-3 分钟的「风险中断」记忆点);白名单防随手拼敏感词绕过输入页;不接任意 text,走生产路径保证安全不变量自动生效。

## 依赖
- `next/navigation`(redirect)
- `@/domain/routing/user-routing`(buildRouteForInput)

## 维护规则
- 每次新增、删除、移动文件或调整职责后,必须检查并更新本 README。
- 文件夹职责影响项目基础文档时,必须同步更新 `docs/basic/`。
- 增删 demo case 同步更新本文件 `RISK_DEMO_CASES` 与 `docs/06 §6 M6 验收清单`。
