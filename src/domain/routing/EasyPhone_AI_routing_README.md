# 文件夹说明书

## 核心功能
用户输入 → 页面路由,**唯一**做"高风险不走 /confirm"分流的地方;安全核心入口。

## 输入
- `buildRouteForInput(text)`:用户原始输入(空 → `{ href: '/', level: 'low' }` 兜底)。
- `routeToInput(router, text)`:接 Next.js `useRouter()` 返回的 `router`(只要 `push` 方法)。
- `guardGuidanceRoute(text)`:deep link 守卫,被 server page 入口调用;
   高风险(shouldStopGuidance)返回 buildRouteForInput 给的 href,低/中风险返回 null。

## 输出
- `user-routing.ts` — `RouteDecision` 接口、`buildRouteForInput(text)` 纯函数、`routeToInput(router, text)` 执行跳转、`MinimalRouter` 接口。
- `user-routing.test.ts` — 12 个单测锁住不变量。
- `deep-link-guard.ts` — `guardGuidanceRoute(text)` 反向守卫,复用 buildRouteForInput + shouldStopGuidance 决策。
- `deep-link-guard.test.ts` — 7 个单测锁住 4 风险等级分流 + 混合输入 + 空白兜底。
- `deep-link-guard.wiring.test.ts` — 4 个结构化测试锁住"页面真的接上 guard"(防"有 helper 但页面没接上"回归)。

## 定位
多个入口(首页文本/语音/demo 直链)共用同一份分流;改规则只动 1 处;纯函数,易测;URL 参数(level/keywords/reason)拼接只在一处。
`guardGuidanceRoute` 是反向守卫:对 server page 接受 searchParams.text 的 deep link 入口,复用 buildRouteForInput 决定是否必须先 redirect 到风险页。两者共用 shouldStopGuidance 决策,避免规则漂移。

## 依赖
- `../risk/classify-risk.ts`(`classifyRiskByRules`)
- `../risk/types.ts`(`shouldStopGuidance`)
- 调用方:`@/app/page.tsx`、`@/lib/speech/voice-input-button.tsx`、`@/app/tutorial/demo/page.tsx`、`@/app/risk-alert/demo/page.tsx`。
- guard 调用方:`@/app/tutorial/page.tsx`、`@/app/confirm/page.tsx` server page 入口(cleanText 兜底之后、主逻辑之前)。
- guard **不**调用方:`@/app/risk-alert/page.tsx`(已自防御,source=ai 是"烦人但安全"例外)。

## 维护规则
- 每次新增、删除、移动文件或调整职责后,必须检查并更新本 README。
- 文件夹职责影响项目基础文档时,必须同步更新 `docs/basic/`。
- 新增 deep link 页面(server page 接受 searchParams.text)时,必须在 cleanText 兜底之后调 `guardGuidanceRoute`,redirect 守卫给的 href。这条**不**可被 README 文档承诺替代 —— 配合 `deep-link-guard.wiring.test.ts` 锁住。
- 改 `shouldStopGuidance` 决策:helper 测试 + wiring 测试 + smoke 测试 + guard README 调用方说明**同时**更新,避免守卫逻辑与文档漂移。
- **不变量**(原 12 个 + guard 7 个 + wiring 4 个 = 23 个测试锁住):
  1. high/critical 绝不进 /confirm
  2. 跳转永远带 text
  3. 空文本兜底 '/'
  4. 多关键词逗号拼接
  5. /tutorial / /confirm deep link 入口必须先调 `guardGuidanceRoute`(wiring 测试锁住)
  6. guard 内部判 `level` 不判 `href` 字符串(产品策略改了自动跟随)
  7. medium 风险 deep link → null(产品决策 A,deep link guard 不改写产品分级)
- 改这个函数必过 `user-routing.test.ts` 全部 12 个 case。
- 不在这里加 React state / DOM 操作 —— 纯函数,导入要保持纯净。
