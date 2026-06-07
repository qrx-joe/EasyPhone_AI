# EasyPhone_AI scripts

## 核心功能

`scripts/` 目录承载 **生产构建之后的运行时验证** 工具,目前只有 `smoke.mjs` 这一个 HTTP 黑盒 smoke 脚本。它是 OpenPrd quality 门禁 `smoke` 的唯一证据源,也是 CI gate。

## 输入

- 任意由本仓库产出的 Next.js 生产构建(`pnpm build` 产物)
- 已在某端口 listen 的 `next start` 进程(默认 `http://localhost:3000`,可用 `SMOKE_BASE` 覆盖)

## 输出

- `smoke.mjs`:在 stdout 输出 9 条路由断言结果,失败时 exit 1

## 定位

工程脚本(非业务代码),**不进 src 编译产物,不进 Next.js bundle**。`smoke.mjs` 是"业务页面→ HTTP 入口"这条链路的最后一道闸,只验证：

1. 生产构建能起来
2. 关键路由 200
3. 关键文案出现在 HTML 中(防止"页面 200 但渲染空白"被误判为通过)

它**不验证**领域逻辑(那是 `pnpm test` 的活,覆盖 `src/domain/risk / routing / help / tutorial` 80 个用例)。

## 依赖

- Node.js ≥ 24(原生 fetch + assert/strict)
- `pnpm`(开发期运行命令)
- 不依赖 puppeteer / playwright / 任何第三方 HTTP 客户端

## 维护规则

- 新增页面 → 同步在 `smoke.mjs` 的 `CHECKS` 数组里加断言
- 改页面文案 → 同步更新对应 `expectAny` 关键词
- 改 smoke 自身 → 跑一遍 `pnpm build && pnpm start & sleep 3 && node scripts/smoke.mjs` 验证仍 9/9 通过
- 文件夹内新增脚本时,必须为新脚本写文件说明书(参考 `.openprd/standards/file-manual-template.md` 的 6 节格式)
- 文件夹职责变化时,同步更新本 README
