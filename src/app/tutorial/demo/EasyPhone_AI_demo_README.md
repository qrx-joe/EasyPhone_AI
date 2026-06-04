# 文件夹说明书

## 核心功能
教程 Demo 直链路由:白名单 case → 走 `buildRouteForInput` 走完整生产路径 → 1 次 server redirect 到 `/confirm`(同生产路径)。

## 输入
- URL `searchParams.case`(白名单 key:`wechat` / `font` / `space`);未知 case 兜底 redirect 到 `/`。

## 输出
- `page.tsx` — 唯一文件,导出 `TutorialDemoPage`;server component,只 1 次 redirect,不在该页渲染任何 UI。

## 定位
演示专用路由(让投资人/家人/队友**直接看 UI**,不用先语音/输入);只接受白名单 key,防随手拼 `?text=敏感词` 绕过输入页;走生产路径保证安全不变量自动生效。

## 依赖
- `next/navigation`(redirect)
- `@/domain/routing/user-routing`(buildRouteForInput)

## 维护规则
- 每次新增、删除、移动文件或调整职责后,必须检查并更新本 README。
- 文件夹职责影响项目基础文档时,必须同步更新 `docs/basic/`。
- 增删 demo case 同步更新 `TUTORIAL_DEMO_CASES` 与首页 `DEMO_CASES` 保持一致;改路由策略要回归 `buildRouteForInput` 单测。
