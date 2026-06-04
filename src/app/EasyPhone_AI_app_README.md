# 文件夹说明书

## 核心功能
Next.js App Router 根目录,承载入口页 `/` 与全站根布局,是整个问答主流程的着陆点。

## 输入
- 浏览器对 `/` 的访问(无 query)。
- 上游依赖 `@/domain/routing/user-routing` 的 `routeToInput` 与 `@/lib/speech/voice-input-button`。

## 输出
- `page.tsx` — 入口页(server/client),渲染「爸妈别急」首页 + 语音/打字按钮 + 3 个常见问题。
- `layout.tsx` — Next.js 根布局,导出 `metadata` 与 `viewport`。
- `globals.css` — 全站 CSS(由 `layout.tsx` 引入)。

## 定位
App Router 的根层级;所有其它路由(`/confirm` / `/risk-alert` / `/tutorial` 及其 `/demo`)的容器;负责全局元信息与设计令牌挂载。

## 依赖
- `next/navigation`(useRouter)
- `@/domain/routing/user-routing`(routeToInput)
- `@/lib/speech/voice-input-button`(VoiceInputButton)
- `./globals.css`(全局 CSS 变量)

## 维护规则
- 每次新增、删除、移动文件或调整职责后,必须检查并更新本 README。
- 文件夹职责影响项目基础文档时,必须同步更新 `docs/basic/`。
