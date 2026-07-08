# 文件夹说明书(项目根)

> OpenPrd 文件夹说明书 · 项目根目录的"模块级"说明书
> 最近更新:2026-07-08

## 核心功能

整个 EasyPhone_AI / 爸妈别急 项目的根目录,承载:
- `package.json` / `pnpm-lock.yaml` — 包管理
- `tsconfig.json` / `next.config.ts` / `postcss.config.mjs` / `.gitattributes` — 构建配置
- `README.md` — 30 秒看懂 + 3 分钟 demo + 部署入口
- `AGENTS.md` — Agent 入口合同(项目状态 + 安全不变量 + 守则)
- `CLAUDE.md` — Claude Code 入口(转引 AGENTS.md)
- `docs/` — 权威 PRD / 规范 / 决策 / OpenPrd 基线
- `.openprd/` — OpenPrd 工作区(本工作区自己的状态)
- `.github/` — GitHub Actions CI
- `src/` — 实际代码

## 输入

- 用户 clone 后跑 `pnpm install` → Node 24 + pnpm 10 拉依赖
- 编辑器(TS 严格模式 / 任何 IDE)
- CI 跑 `pnpm test` + `pnpm build`

## 输出

- 部署到 Vercel / Cloudflare Pages 的 Next.js 16 Web App
- `localhost:3000` 开发服务器
- OpenPrd 工作区状态(`openprd status .` 看门禁)

## 定位

项目根 = **项目元信息**层。**不**放业务代码(那是 `src/`);**不**放产品 PRD(那是 `docs/`)。

任何"看起来该在根目录"的东西,先问:这是项目元信息(根)、业务代码(src)、还是文档(docs)?

## 依赖

- `package.json` 列出的所有依赖(见 docs/basic/tech-stack.md)
- Node.js 24+
- pnpm 10+
- OpenPrd CLI(开发时用,`npx @openprd/cli@latest ...`)

## 维护规则

- 改 `package.json` / `tsconfig.json` / `next.config.ts` 必过 CI(`pnpm test` + `pnpm build`)。
- 改 `AGENTS.md` / `CLAUDE.md` / `README.md` 必同步更新 `docs/basic/` 跟 `easy-phone-ai_easy-phone-ai_README.md` 的"输入/输出"段。
- 加根级新文件前先想清楚归元信息 / 代码 / 文档,别乱塞。
- 跑 `openprd standards . --verify` 验证项目级规范。
