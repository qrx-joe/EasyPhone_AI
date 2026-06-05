# 文件夹说明书

## 核心功能
M5 AI 兜底的对外 HTTP 端点 —— `POST /api/route`,作为 client 与 server 路由之间的唯一网关。

## 输入
- HTTP POST 请求,Content-Type: application/json
- 请求体:`{ "text": "用户输入" }`
- 调用方:`src/app/page.tsx` 的 `goConfirm`、`src/lib/speech/voice-input-button.tsx` 的 `onFinal`(都通过 `src/lib/ai/fetch-route.ts`)

## 输出
- `src/app/api/route/route.ts` — Next.js Route Handler,导出 `POST(request)`;内部调 `routeWithAiRecheck(text)` 拿 `{ href, level }`,JSON 返回。

## 定位
**对外网关层**,不是路由逻辑所在。路由逻辑关键词部分在 `src/domain/routing/user-routing.ts`,AI 兜底部分在 `src/lib/ai/`。本目录只做"接 HTTP 请求 + 调核心 + 返回"。

## 依赖
- `next/server` 的 `NextResponse`
- `@/lib/ai/route-with-ai` 的 `routeWithAiRecheck`(关键词保险丝 + AI 兜底)
- **不依赖** 任何 client 端模块;不 import 'use client' 文件
- Node 20+ 内置 `fetch`(无外部 HTTP SDK)

## 维护规则
- 改响应字段 → 同步改 client 调用方(`page.tsx` / `voice-input-button.tsx`)和 `fetch-route.ts` 的类型
- 改错误码 → 更新本 README 的"输出"段
- **永不**把 API key / 原始 text / DeepSeek 内部错误细节透到响应里(防信息泄漏)
- 跑 `pnpm test` 时此目录无单测 —— 路由逻辑在 `route-with-ai.test.ts` 覆盖;端点本身是薄壳
- 加新端点(如未来的 `/api/help-card`)时,放同级新目录,不要膨胀本目录
