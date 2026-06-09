# 文件夹说明书

## 核心功能
「问对了吗」确认页路由,服务低/中风险分流:回显用户原问题,提供「是的,继续 / 不是,重新说」两个大按钮。

## 输入
- URL `searchParams.text`(由首页 `routeToInput` 跳转时附带);空文本兜底 redirect 到 `/`。
- 父目录 `app/` 提供的 Next.js 路由系统。

## 输出
- `page.tsx` — server component,读 `text` 后渲染卡片 + `<ConfirmActions>`。
- `confirm-actions.tsx` — client component,导出 `ConfirmActions`,处理两个按钮的 `router.push`。

## 定位
确认页路径的入口;只服务低/中风险(高风险已在首页被分流到 `/risk-alert`);server 兜底空文本、client 只装交互按钮,职责拆分清晰。

## 依赖
- `next/navigation`(redirect、useRouter)
- `./confirm-actions`(ConfirmActions)

## 维护规则
- 每次新增、删除、移动文件或调整职责后,必须检查并更新本 README。
- 文件夹职责影响项目基础文档时,必须同步更新 `docs/basic/`。
- 跳转目标(`/tutorial`)调整需同步 review `tutorial/page.tsx` 的 query 约定。
