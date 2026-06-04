# 文件夹说明书

## 核心功能
用户输入 → 页面路由,**唯一**做"高风险不走 /confirm"分流的地方;安全核心入口。

## 输入
- `buildRouteForInput(text)`:用户原始输入(空 → `{ href: '/', level: 'low' }` 兜底)。
- `routeToInput(router, text)`:接 Next.js `useRouter()` 返回的 `router`(只要 `push` 方法)。

## 输出
- `user-routing.ts` — `RouteDecision` 接口、`buildRouteForInput(text)` 纯函数、`routeToInput(router, text)` 执行跳转、`MinimalRouter` 接口。
- `user-routing.test.ts` — 12 个单测锁住不变量。

## 定位
多个入口(首页文本/语音/demo 直链)共用同一份分流;改规则只动 1 处;纯函数,易测;URL 参数(level/keywords/reason)拼接只在一处。

## 依赖
- `../risk/classify-risk.ts`(`classifyRiskByRules`)
- `../risk/types.ts`(`shouldStopGuidance`)
- 调用方:`@/app/page.tsx`、`@/lib/speech/voice-input-button.tsx`、`@/app/tutorial/demo/page.tsx`、`@/app/risk-alert/demo/page.tsx`。

## 维护规则
- 每次新增、删除、移动文件或调整职责后,必须检查并更新本 README。
- 文件夹职责影响项目基础文档时,必须同步更新 `docs/basic/`。
- **不变量**(12 个测试锁住):
  1. high/critical 绝不进 /confirm
  2. 跳转永远带 text
  3. 空文本兜底 '/'
  4. 多关键词逗号拼接
- 改这个函数必过 `user-routing.test.ts` 全部 12 个 case。
- 不在这里加 React state / DOM 操作 —— 纯函数,导入要保持纯净。
