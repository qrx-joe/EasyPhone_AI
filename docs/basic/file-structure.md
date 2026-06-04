# 项目文件结构

> OpenPrd 基线文档 · 反映 EasyPhone_AI / 爸妈别急 实际项目结构
> 最近更新:2026-06-05

## 项目定位

- **项目名**:EasyPhone_AI / 爸妈别急
- **形态**:Next.js 16 Web App(MVP),无独立后端
- **运行入口**:`pnpm dev` → `localhost:3000`;`pnpm build` → 生产构建
- **核心模块**:首页输入 → 风险判断(domain) → 低风险进教程 / 高风险进求助卡

## 核心目录

```
.
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # 首页(语音/文本/demo 入口)
│   │   ├── layout.tsx                # 根布局
│   │   ├── globals.css               # 全局样式 + design tokens
│   │   ├── confirm/                  # 确认页(问对了吗)
│   │   ├── tutorial/                 # 分步指导页
│   │   │   └── demo/                 # /tutorial/demo 直链
│   │   └── risk-alert/               # 高风险页 + 家人求助卡
│   │       └── demo/                 # /risk-alert/demo 直链
│   ├── domain/                       # 纯领域逻辑(无 I/O,可单测)
│   │   ├── risk/                     # 风险等级 + 关键词库 + 分类器
│   │   ├── question/                 # QuestionRecord
│   │   ├── tutorial/                 # TutorialStep + 教程库
│   │   ├── help/                     # HelpRequest + 卡片序列化
│   │   └── routing/                  # 用户输入 → 页面路由(安全核心)
│   └── lib/
│       └── speech/                   # Web Speech API 封装(recognition + synthesis)
├── docs/                             # 权威 PRD / 规范 / 决策
│   ├── 00-prd-cn-authoritative.md    # 权威 PRD(中文)
│   ├── 05-project-standards.md       # 项目规范(必读)
│   ├── 06-development-plan.md        # Milestone 0-6 路线图
│   ├── 07-risk-keywords-library.md   # 风险关键词库 + 16 个验收用例
│   ├── 08-sprint-0-decisions.md      # Sprint 0 决策记录
│   └── basic/                        # OpenPrd 基线文档(本目录)
├── .openprd/                         # OpenPrd 工作区
├── .github/workflows/ci.yml          # GitHub Actions CI
└── package.json                      # pnpm 项目,Node 24+
```

## 文件组织规则

- **src/domain/**:纯函数 + 类型,无 React、无 I/O。所有业务逻辑(风险判断、教程匹配、卡片序列化、路由)在这里,**单测覆盖核心不变量**。
- **src/app/**:Next.js 页面 + 客户端组件。每个目录对应一个路由,server component 读 query,client component 维护 UI state。
- **src/lib/**:第三方 API 封装(目前只有 speech)。**不**放业务逻辑 —— 业务逻辑归 domain。
- **docs/**:PRD / 规范 / 决策。**代码改了,docs 也得改**(OpenPrd 理念)。

## 维护规则

- 每次新增、删除、移动目录或核心文件后,必须:
  1. 更新本文件
  2. 同步更新受影响的文件夹 README
  3. 跑 `openprd standards . --verify` 验证
- 本文档只记录项目结构事实,不承载具体功能需求(那些在 `docs/00-08`)。
- 添加新模块前先想清楚归 `domain/` 还是 `app/` 还是 `lib/`,**别乱放**。
