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

## 2026-06-09：Fix #3 / Fix #8 + _rsc + rebase 合冲突 + PR #5 落地

### 用户输入

- 状态框两条线："本地 main 落后 origin 1 commit" + "🟡 2 个 pre-existing smoke 失败（/risk-alert Fix #3/#8）"
- "这两个任务现在完成" —— **用户判断完成**，但实际 smoke 17 passed / 2 failed
- 多次"我无法做出判断" —— 用户主动承认非技术边界，要求 AI 翻译成业务影响
- 4 条强约束（Fix #3 A 选型确认时用户提的）：
  1. Fix #3 A 要删干净（不只删 `console.info`，连解构 + 类型声明 + 顶部注释里的 `&reason=` 都要拿掉）
  2. smoke 注释同步（"reason 仅服务端审计日志用" → "完全忽略"）
  3. Fix #8 A 只接受精确 key：`text` 或 `text[]`，不模糊匹配
  4. searchParams 类型改真实（`string | string[]`），用 `firstParam` helper 收敛
- "提交" / "push" / "1. 开 PR" / "合 main" —— 4 步显式授权每一步

### AI 操作

1. **第一遍：错误接受"已完成"判断**
   - 我**先信了用户说"完成"**，没有自己跑 smoke
   - 跑 smoke 后才发现 Fix #3 / #8 实际失败（17 passed, 2 failed）
   - **这是我的判断错位** —— "用户说完成" 不等于 "evidence 拿到"

2. **诊断 Fix #3 / #8 失败根因**
   - Fix #3：page.tsx 解构了 `searchParams.reason` 并做 audit log，**Next.js 把整个 searchParams 序列化进 RSC `__PAGE__?{...}` 流** → 攻击者 URL 上的 reason 出现在响应体里。visible summary 是安全的（硬编码），但 grep 抓得到。
   - Fix #8：`?text[]=foo` 被 Next.js 解析为字面 key `'text[]'`（不是 `text:['foo']`），旧 fix 的 `Array.isArray(text) ? text[0] : text` 挡不住，cleanText 空，redirect('/') 307。

3. **修第一遍（半截 fix）**
   - 删除 destructure reason + audit log；risk.reason 硬编码安全默认
   - searchParams 类型改真实：`text?: string | string[]` + `'text[]'?: string | string[]`
   - 新增 `firstParam` 本地 helper
   - 加 page 顶部 unknown-key redirect：URL 里有 reason 等恶意 key → server-side 重定向到只剩 known key 的 canonical URL
   - smoke 注释同步更新

4. **修第二遍（自审发现 _rsc 回归）**
   - 我自己 review 时想到：客户端 `<Link>` / `router.push` 走 RSC 协议会发 `?_rsc=xxx`，**被 redirect 吞掉会破坏客户端导航**
   - 实测：curl `?text=...&_rsc=xxx` 看到响应是 307 → /risk-alert?text=...（_rsc 没了）
   - 翻 Next.js 源码：`node_modules/next/dist/client/components/app-router-headers.js` 里 `NEXT_RSC_UNION_QUERY = '_rsc'`
   - 结论：**光删 destructure 是半截 fix**，必须在 URL 入口消毒（redirect） + 加 `NEXT_INTERNAL_QUERY_KEYS` 白名单接住 Next.js 协议内部 query

5. **用户两次"无法做出判断" + 4 条强约束 + 1 个最终选择**
   - 第一次"无法判断"：我列了 A/B/C 三个选项让用户挑，用户继续说无法判断
   - 我意识到这是**产品负责人不该背技术细节**的边界 → 主动把技术翻译成业务影响（"老人输入问题后页面卡住"）
   - 用户看完说"A"（恢复 _rsc 白名单）+ 给 4 条强约束

6. **执行用户拍板的方案**
   - 加 `NEXT_INTERNAL_QUERY_KEYS = new Set(['_rsc'])`
   - smoke 补 2 测例：① `?_rsc=xxx` 单独不 redirect ② `?reason+_rsc` 攻击者 cross-check 仍 redirect
   - 全量验证：smoke 21 passed / pnpm test 156 passed / openprd dev-check + quality + run + doctor 全过

7. **用户授权提交 + push + 开 PR + 合 main**
   - `git checkout -b fix/risk-alert-fix-3-and-8`（不能在 main 上直接 commit）
   - commit `7cba635`（含 4 个安全不变量"未改"声明）
   - `git push -u origin fix/risk-alert-fix-3-and-8` → 第一次 push 成功
   - `gh pr create` → PR #5 创建
   - `gh pr merge --squash --delete-branch` → **撞到冲突**

8. **rebase 解决冲突（机械合）**
   - main 上有 PR #2 `feat(deep-link-guard)` 5 个新 commit
   - 冲突只在 `scripts/smoke.mjs`（两边都加了测例，逻辑零冲突）
   - `git stash -u`（保护 .openprd state noise） → `git rebase origin/main` → 手解 smoke.mjs 冲突（取两边 4 个测例）→ `git stash pop`
   - 新 commit `bff458d`，`git push --force-with-lease` 成功
   - smoke 23 passed（21 我 + 2 deep link guard）

9. **最终合 main**
   - re-verify 全过 → `gh pr merge 5 --squash --delete-branch` → main 头变 `8240e7d`
   - 验证 main 上 merge commit 只改了我那 2 个文件（12 files 那个是 PR 历史 diff，squash 后只剩 2）
   - 删本地分支（远程 + 本地都被 `--delete-branch` 清掉）
   - `docs/.openprd/engagements/active/progress.md` 加 final 收口 entry → commit `2b645b7` 推 main

### 关键判断

- **"用户说完成" ≠ evidence 拿到**：fix 完成后必须自己跑 smoke / 看测试结果，不能 commit message / 用户口头确认就当成 done
- **"代码里不读 X" ≠ "响应体里没有 X"**：Next.js RSC payload 把整个 searchParams 序列化是黑盒，光改 server component 业务逻辑不够，必须在 URL 入口消毒（redirect） + 协议内部 query 白名单
- **"安全不变量文件改动需要用户显式确认方向"**：Fix #3 动 `src/app/risk-alert/page.tsx` 是 AGENTS.md 列的安全不变量分支，AI 不应自作主张
- **"产品负责人不该背技术细节"**：用户两次"无法做出判断" → 我应该主动翻译成业务影响（"老人输入问题后页面卡住"），而不是让用户挑技术选项 A/B/C
- **"安全 fix 不能只看 visible summary"**：必须 grep 整个响应体，因为 RSC payload 会把攻击者 URL 文本序列化进响应
- **"消毒类 fix 必须确认不会吃掉框架协议内部 query"**：自审发现 _rsc 回归就是这个原则的体现
- **"本地 main 落后 origin 1 commit"**：本轮一开头用户说落后，我看了 `git rev-list` 已是 0/0，那条状态已不再准确

### 待用户确认

- Vercel production deploy 是否在 dashboard 上看到 main 这次 commit 标 Ready（这步我远程看不到）
- 旧 key 轮换：仍未做

### 后续处理

- ✅ PR #5 squash merged into main as `8240e7d`
- ✅ 收口 commit `2b645b7`（progress.md）推 main
- ✅ 2 条 OpenPrd candidate 自动沉淀：`hidden-debug-knowledge`（不读 X ≠ 响应体里没有 X）+ `high-impact-fix`（消毒类 fix 必须确认不破坏框架协议）
- ✅ 工作目录只剩 .openprd state noise（自动管理，下次 session 或 hook 处理）
- 🔧 Vercel production deploy 是否自动 promote（用户自查 dashboard）
- 🔧 旧 key 轮换（仍未做）

