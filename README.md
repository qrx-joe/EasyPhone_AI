# 爸妈别急 / EasyPhone AI

> 给老人的手机教练：低风险问题一步一步教，高风险问题立刻停下来，并生成家人求助卡。

**项目状态**：MVP（M0–M4 已完成；M5 AI 接入、M6 部署待办）。详见 [docs/06-development-plan.md](docs/06-development-plan.md)。

## 30 秒看懂它做什么

老人遇到手机问题，对着手机说话或打字：

- **低风险**（"微信没声音"、"字太小"）→ 一步一步带做，每步可「念给我听」
- **高风险**（"短信让我输验证码"、"对方让我开屏幕共享"）→ 红色"停"页 + 一键复制**家人求助卡**

风险判断完全本地，**不发任何数据到服务器**，**不读短信/通讯录/位置**。

## 3 分钟跑通 Demo

```bash
pnpm install
pnpm dev
# 打开 http://localhost:3000
```

然后试这 3 个场景（任选）：

| 场景 | 怎么试 | 看什么 |
|---|---|---|
| 微信没声音 | 语音说"微信没有声音了"或点首页 📱 demo 按钮 | 5 步分步指导 + 每步「念给我听」 |
| 字太小 | 点首页 🔍 demo 按钮 | 4 步分步指导 + 进度条 |
| 医保异常短信 | 语音说"短信让我输验证码"或点首页 ⚠️ demo 按钮 | 红色"停"页 + 求助卡 + 复制按钮 |

或者**直接打开 demo 直链**（给投资人/队友演示用）：

- <http://localhost:3000/tutorial/demo?case=wechat> — 微信没声音教程
- <http://localhost:3000/tutorial/demo?case=font> — 字太大教程
- <http://localhost:3000/risk-alert/demo?case=medical-sms> — 验证码诈骗
- <http://localhost:3000/risk-alert/demo?case=public-security> — 公检法诈骗
- <http://localhost:3000/risk-alert/demo?case=screen-share> — 屏幕共享诈骗

## 命令速查

```bash
pnpm dev          # 开发服务器 (localhost:3000)
pnpm build        # 生产构建
pnpm start        # 跑生产构建
pnpm test         # 跑所有测试 (80+ cases)
```

## 目录结构

```
src/
  app/                    # Next.js App Router
    page.tsx              # 首页 (输入 + demo 入口)
    confirm/              # 确认页 ("您是不是想问 XXX?")
    tutorial/             # 分步指导页
    risk-alert/           # 高风险提醒页 + 家人求助卡
    tutorial/demo/        # /tutorial/demo 直链
    risk-alert/demo/      # /risk-alert/demo 直链
  domain/                 # 纯领域逻辑(纯函数,可单测)
    risk/                 # 风险等级 + 关键词库 + 分类器
    question/             # QuestionRecord
    tutorial/             # TutorialStep + Tutorial 库
    help/                 # HelpRequest + 求助卡序列化
    routing/              # 用户输入 → 页面路由(安全核心)
  lib/
    speech/               # Web Speech API 封装 (recognition + synthesis)
docs/                     # PRD / 规范 / 决策 / 计划
```

## 关键设计原则

完整规范见 [docs/05-project-standards.md](docs/05-project-standards.md)。最重要的几条：

1. **安全优先于完成任务**（§3.1）— 高风险输入永远不进教程引导
2. **规则兜底，不把安全完全交给 AI**（§3.2）— 即使 M5 接 AI，规则仍是核心
3. **数据最小化**（§3.4）— 不保存语音/短信/通讯录/位置
4. **白名单教程**（§3.3）— AI 不自由编造手机操作步骤

## 核心安全不变量

PR 改这些代码时务必保留：

- `src/domain/routing/user-routing.ts` — `buildRouteForInput()` 是**唯一**做"高风险不走 /confirm"分流的地方（[`user-routing.test.ts`](src/domain/routing/user-routing.test.ts) 12 个测试覆盖）
- `src/domain/risk/classify-risk.ts` — 多关键词命中永远取 `MAX(level)`，**不平均、不取第一个**
- `src/domain/help/help-templates.ts` — 求助卡不教"把验证码发给我"等给出去模式

## 测试

- 80+ 测试覆盖核心 domain（风险分类、教程匹配、求助卡、路由）
- Web Speech API 路径靠 build + TypeScript 严格模式兜底（API 难 mock）
- `pnpm test` 跑全套

## 技术栈

- Next.js 16.2.7 (App Router) + TypeScript 严格模式
- Tailwind CSS
- Web Speech API（recognition + synthesis）
- `node:test` (Node 24+ 原生测试) — 没用 vitest/jest，省一份依赖

## 部署

代码可一键部署到 [Vercel](https://vercel.com)（Next.js 原生支持）：

1. 注册 Vercel，链接 GitHub 账号
2. Import 这个 repo
3. 默认配置即可，`pnpm build` 会自动跑

**M6 部署文档待补**（[docs/06-development-plan.md](docs/06-development-plan.md) §6）。

## 路线图

- [x] M0 项目初始化
- [x] M1 核心领域模型
- [x] M2 首页与输入流程
- [x] M3 低风险分步指导
- [x] M4 高风险中断 + 家人求助卡
- [ ] M5 AI 接入（P2，需要 API key）
- [ ] M6 Demo 打磨 + 部署

## 相关文档

- [docs/00-prd-cn-authoritative.md](docs/00-prd-cn-authoritative.md) — 权威 PRD
- [docs/05-project-standards.md](docs/05-project-standards.md) — 项目规范（必读）
- [docs/06-development-plan.md](docs/06-development-plan.md) — Milestone 规划
- [docs/07-risk-keywords-library.md](docs/07-risk-keywords-library.md) — 风险关键词库 + 16 个验收用例
- [docs/08-sprint-0-decisions.md](docs/08-sprint-0-decisions.md) — Sprint 0 决策记录

## License

未指定。
