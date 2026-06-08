# Communicating

> 用途：记录你与 AI 的关键交互，方便复盘产品决策、需求变化和架构取舍。
> 规则：只记录影响项目方向或实现的重要内容，不记录闲聊。

## 2026-06-04

### 用户输入

用户要求先查看项目 PRD，并建立五个文档：

1. `to do`
2. `next to do`
3. `communicating`：用户与 AI 的交互记录
4. `advice`：针对用户问题给出的建议
5. `规范文档`：包括技术选型、同类产品制作规范、热门且符合行业规范的参考、可扩展与可维护要求、详细注释要求

用户还强调：

- Python 开发必须使用 `uv`。
- 虚拟环境必须在项目内使用 `.venv`。
- 必须关注架构坏味道：僵化、冗余、循环依赖、脆弱性、晦涩性、数据泥团、不必要复杂性。
- 识别坏味道后要询问是否需要优化，并给出建议。
- AI 应该用审视视角指出用户输入中的潜在问题，并提出用户思考框架之外的建议。

### AI 操作

- 扫描项目目录。
- 发现项目目前只有两份 PRD：
  - `EasyPhone_AI_PRD.md`
  - `EasyPhone_AI_PRD_CN.md`
- 读取 PRD 时发现中文显示乱码；后续确认文件本体是 UTF-8，乱码主要来自 Windows PowerShell 默认读取方式。
- 建立 `docs/` 目录。
- 创建五份基础文档：
  - `01-to-do.md`
  - `02-next-to-do.md`
  - `03-communicating.md`
  - `04-advice.md`
  - `05-project-standards.md`

### 关键判断

- `to do` 和 `next to do` 必须分工明确，否则会变成两个重复待办池。
- PRD 编码问题是当前最高优先级之一，因为它会影响后续协作与文案复用。
- MVP 不应扩张成“老人超级 App”，应保持在“语音手机教练 + 高风险中断 + 家人求助卡”的主线。

### 待用户确认

- 用户已同意修复 PRD 编码问题。
- 是否采用 Next.js + TypeScript + Tailwind CSS 作为前端 MVP 技术栈。
- 是否第一版只做前端 Demo，还是直接接入 AI API。

### 后续处理

- 已将两份 PRD 重新保存为 UTF-8。
- 已新增 `docs/00-prd-cn-authoritative.md` 作为权威中文开发引用版。

## 2026-06-07 ~ 2026-06-08

### 用户输入

- "Vercel 部署为什么会失败" → 拉历史部署日志查根因
- "长远来讲，应该怎么修" → 4 档方案（P0 止血 / P1 固本 / P2 治理 / P3 重构）
- "现在打算把产品的 demo 跑通" → 选 Vercel 部署 + AI 兜底真接
- "我希望你可以 100% 保证不泄露这个 apikey" → 选 "AI 0 接触 key" 边界
- 4 次"已配好 / 配好了"反馈里，3 次配错（Vercel name 字段是 key 字符串 / 项目名 / 留空），最后一次 `vercel env add` 走通
- P1：5 个 demo URL 浏览器访问确认 200

### AI 操作

1. **Vercel 部署失败诊断**
   - 拉 `dpl_9uCGwJJ9YJGCAbwxMybGjTtmPUka` 日志，定位错误：`Cannot find module '@tailwindcss/oxide-linux-x64-gnu'`
   - 根因：`pnpm-workspace.yaml` 的 `supportedArchitectures: [current, linux, ...]` 在跨 host 时对 optional 依赖过滤非确定
   - 本地 `pnpm install` 装的是 Windows binding（`@tailwindcss+oxide-win32-x64-msvc`），Vercel Linux 镜像装不上 linux binding

2. **P0 修复**（commit `62fcda6` + `b77cc5e`）
   - `pnpm-workspace.yaml`：砍掉 `current`，只留 `[linux, x64, glibc]`
   - `package.json`：加 `engines.node` + `engines.pnpm`
   - 新建 `vercel.json`：强制 cold install + gate build on `lint:deps && test`
   - 新建 `scripts/verify-optional-deps.mjs`：装不上 linux binding 直接 fail
   - 改 `verify-optional-deps.mjs` 文件说明书补 `## 依赖` 段（`standards --verify` 要求 6 段齐全）
   - Preview 部署冷启动验证：`+ @tailwindcss/oxide-linux-x64-gnu 4.3.0` 真的装上了

3. **AI 0 接触 key** 边界执行
   - 不读 `.env.local` / 不 cat / 不 echo
   - 用户在 Vercel Dashboard 手动配 + `vercel env add` 走 stdin pipe
   - 但中途用户粘错位置，env var name 字段出现 key 前缀（`sk1e8c6c...`）→ 实质泄露 → 强烈建议轮换

4. **合并 main → Production 部署**
   - `git checkout main && git merge --no-ff fix/vercel-deploy && git push`
   - 部署 24s Ready：`https://easy-phone-g3oc60ymw-qrx-joes-projects.vercel.app`

5. **AI 兜底真接验证**
   - 5 demo URL 浏览器访问：全部 200
   - AI 兜底测试句：
     - 第 1 句"我刚下载了一个新 APP，要填身份证号才能用" → 关键词"身份证号"命中 critical → 跳 `/risk-alert?level=critical&keywords=身份证号`（**不是** AI 升级路径）
     - 第 2 句"有人加我微信说他公司上市了，要带我一起发大财" → 关键词不命中 → AI keep → 跳 `/tutorial`（**间接证据**：client 兜底逻辑只能跳 `/confirm`，跳 `/tutorial` 说明 `/api/route` 成功响应）
     - 第 3 句"我刚认识一个人说他是我失散多年的儿子，要我打点钱给他做路费" → 关键词不命中 → AI keep → 跳 `/tutorial`（同第 2 句）
   - Deployment-time smoke test 日志直接证据：`source: "ai", decision: "escalate", reason: "嗅到诈骗"` 多次出现

6. **收尾门禁**
   - `openprd dev-check` ✅ / `standards --verify` ✅（51/51 + 17/17 + 6/6） / `quality --verify` ✅（`production-ready: 是`）
   - `doctor` ⚠️ 失败但失败项是 OpenPrd harness 内部（缺 test-strategy skill、Codex CLI 没装），**不是**项目问题

### 关键判断

- **"100% 不泄露 secret" 在工程上不存在**，可达成的只有"AI 0 接触 key"这种可验证边界
- **"AI 兜底真接" ≠ "URL 一定出现 ?source=ai"**——AI 跑 keep（不升级）也是真接。正确验证方式：DevTools 看 `/api/route` response JSON，`href` 不是 `/confirm?text=...` 就说明 AI 跑过
- **Vercel build cache 是"假性健康"陷阱**——`Already up to date` 不代表 install 行为对了，可能吃的是上一次 build 留下的 node_modules。要测真实 install 必须 `--force --no-wait`
- **5 demo URL 不一定都要逐个浏览器访问**——production client bundle 是同一份，1 个能动其他 5 个理论不会错
- **client bundle 烘焙完整 130 词**——`src/lib/ai/fetch-route.ts` 是 client-side，失败时降级到 client 关键词保险丝。"双保险"机制：client + server 都有完整关键词决策，但**违反代码架构 #2 冗余**（同一份逻辑两处实现）
- **3 次"配好了"反馈失真**——用户口头说"配好了"但 Vercel 实际没动，必须 `vercel env ls` 直接验证，不能信口头报告

### 待用户确认

- 是否撤销 + 轮换旧 key（已在最后建议里说明步骤）
- 是否开始 P2 治理（用户已选"先拆 PR1 (shared-classifier)"，但没确认开始动手）

### 后续处理

- 已将 4 个文档（01/02/03/04）按本次会话发现更新（标完成项、加 P2 治理项、加 communicating/advice 段）
- 5 个 demo URL 验证：用户已确认全部 200
- Vercel production 部署：稳定 Ready
- 旧 key 轮换：未做（强烈建议用户尽快处理）

