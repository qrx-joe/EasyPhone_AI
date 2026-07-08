# 项目技术栈

> OpenPrd 基线文档
> 最近更新:2026-06-05

## 运行环境

- **Node.js**:`24.x`(engines 锁定 24.x,防 Vercel 构建随 major 升级漂移;项目用其 `node --test` 原生测试)
- **包管理**:**pnpm**(`>= 10`),lockfile 格式 v9+
- **平台**:Web 浏览器(Chrome/Safari/Edge 现代版本)
  - iOS Safari 需要 iOS 16+(Web Speech API 限制)
  - Firefox 语音识别**不支持**(走文本兜底)
- **部署目标**:Vercel / Cloudflare Pages(Next.js 原生支持)
- **OS 开发**:Windows / macOS / Linux 均可(`.gitattributes` 强制 LF)

## 核心依赖

### 框架与运行时

| 依赖 | 版本 | 用途 |
|---|---|---|
| `next` | 16.2.7 | App Router + Turbopack + Server Components |
| `react` | 19.2.4 | UI 库 |
| `react-dom` | 19.2.4 | 同上 |
| `typescript` | ^5 | 类型系统(严格模式 `strict: true`) |

### 样式

| 依赖 | 版本 | 用途 |
|---|---|---|
| `tailwindcss` | ^4 | 原子化 CSS |
| `@tailwindcss/postcss` | ^4 | PostCSS 插件 |
| `postcss` | (依赖) | CSS 处理 |

### 类型

| 依赖 | 版本 | 用途 |
|---|---|---|
| `@types/node` | ^20 | Node.js 类型 |
| `@types/react` | ^19 | React 类型 |
| `@types/react-dom` | ^19 | React DOM 类型 |

### 浏览器 API(零依赖)

- `window.SpeechRecognition` / `window.webkitSpeechRecognition` — 语音输入
- `window.speechSynthesis` — 语音播报
- `navigator.clipboard.writeText` — 复制求助卡
- `localStorage` — 语速档位持久化

## 工具链

### 开发命令

```bash
pnpm dev          # 开发服务器 (localhost:3000,Turbopack)
pnpm build        # 生产构建
pnpm start        # 跑生产构建
pnpm test         # 跑所有测试 (node --test src/**/*.test.ts)
pnpm test:risk    # 只跑风险分类测试
```

### OpenPrd 命令

```bash
npx @openprd/cli@latest init .      # 初始化工作区(已跑)
npx @openprd/cli@latest status .    # 看门禁状态
npx @openprd/cli@latest next .       # 下一步建议
npx @openprd/cli@latest standards . --verify
npx @openprd/cli@latest quality . --verify
npx @openprd/cli@latest run . --verify
npx @openprd/cli@latest doctor .
```

### CI

- GitHub Actions:`.github/workflows/ci.yml`
- 跑 `pnpm install --frozen-lockfile` + `pnpm test` + `pnpm build`
- Node 24 + pnpm 10
- PR 必过

### 编辑器

- TypeScript 严格模式(已在 `tsconfig.json` 开启)
- 不强制 ESLint(后续可加)
- 不强制 Prettier(后续可加)

## 维护规则

- **升级核心依赖前**先看 Next.js changelog(项目 AGENTS.md 警告:Next 16 有 breaking changes)
- **新增运行时依赖前**先回答:浏览器 API 能做吗?Node.js stdlib 能做吗?
  - Web Speech API 已经有 → 不引第三方语音库
  - `node --test` 已经有 → 不引 vitest/jest
  - 这俩决策**值得保留**:
- **每次升级 Node/pnpm/Next 大版本**后,跑完整 CI + 手动测 3 个 demo
- 跑 `openprd standards . --verify` 确认技术栈文档与 package.json 一致
