# To Do

> 用途：项目全量任务池。这里记录所有已识别但不一定马上做的事项。
> 规则：任何任务进入开发前，必须从这里筛选到 `02-next-to-do.md`，并补齐验收标准。

## P0 立即处理

### 1. ✅ 修复 PRD 中文显示乱码（M0，2026-06-04 完成）

- 状态：已确认文件本体是 UTF-8，乱码主要来自 Windows PowerShell 默认读取无 BOM UTF-8 的方式；已将两份 PRD 转为 Windows 工具更稳定识别的 UTF-8。
- 后续风险：如果编辑器或脚本再次按错误编码写入，仍可能复发。
- 验收标准：
  - 中文 PRD 在编辑器和终端中均可正常显示。
  - 文件统一为 UTF-8 编码。
  - 产品名、副标题、核心文案不再出现乱码。

### 2. ✅ 建立项目基础骨架（M0–M4，2026-06-05 完成）

- 初始范围：
  - 首页。
  - 语音输入页。
  - 问题确认页。
  - 分步指导页。
  - 风险提醒页。
  - 家人求助卡页。
- 验收标准：
  - 本地可以启动项目。
  - 三个 Demo 场景可以通过固定入口跑通。
  - 高风险场景不会进入普通教程流程。

### 3. ✅ 建立风险词库与风险分级规则（M1，2026-06-04 完成）

- 风险词已扩到 130+ 条，分布在 7 个场景桶（money_transfer / code_or_password / remote_control / stranger_link / fake_identity / lottery_or_benefit / account_or_privacy）。
- 验收标准：
  - 命中高风险关键词时强制 `shouldStop=true`。
  - 规则判断和 AI 判断任一认为高风险，都停止指导。
  - 单元测试覆盖低风险、中风险、高风险、极高风险样例（16 个 MAX 验收用例 + 12 个 routing 不变量）。

## P1 MVP 核心功能

### 4. ✅ 语音输入与转写（M2，2026-06-04 完成）

- MVP 可先使用浏览器 Web Speech API。
- 需要保留手动输入兜底，避免浏览器不支持语音识别导致 Demo 崩盘。
- 验收标准：
  - 可以开始、停止语音输入。
  - 可以展示转写文本。
  - 可以重新输入。

### 5. ✅ 分步教程库（M3，2026-06-04 完成）

- 首批教程：
  - 微信没有声音。
  - 手机字体太小。
  - 手机空间不足。
  - 手机充不进电。
- 验收标准：
  - 每次只展示一步。
  - 每步文案尽量不超过 20 个汉字。
  - 每步包含 `fallbackText`，用于“没看到”时换一种说法。

### 6. ✅ 家人求助卡生成（M4，2026-06-04 完成）

- 输出内容：
  - 问题摘要。
  - 风险等级。
  - 建议动作。
  - 可复制文本。
  - 可保存卡片或模拟发送。
- 验收标准：
  - 高风险输入会生成家人可读的求助信息。
  - 求助卡不保留验证码、银行卡号、身份证号等敏感原文（教给出去 lint 测试覆盖）。

## P2 体验与展示

### 7. ✅ 适老化 UI（M2–M4，2026-06-05 完成）

- 大字号、高对比、少按钮、无信息流、无复杂图标。
- 所有关键操作都有语音播报入口。
- 验收标准：
  - 手机竖屏下无文字遮挡。
  - 主要按钮手指可轻松点击。
  - 页面 10 秒内能看懂主操作。

### 8. ✅ Demo 脚本与评审材料（M6 部分，2026-06-08 完成）

- 三个 Demo：
  - 微信没有声音。
  - 字体太小。
  - 医保短信加验证码风险。
- 验收标准：
  - 2-3 分钟能讲完整闭环。
  - 明确表达核心差异：EasyPhone AI 知道什么时候不该继续回答。

### 9. ✅ Vercel 部署生产可访问（M6，2026-06-08 完成）

- 部署 URL：`https://easy-phone-ai.vercel.app`
- 5 个 demo 直链（`/tutorial/demo?case=wechat|font` + `/risk-alert/demo?case=medical-sms|public-security|screen-share`）跑通。
  > **2026-06-10 备注**：`public-security` 场景在 README 重写（commit `476f024`）时从首页 demo 入口清单移除；该场景的关键词仍在 `docs/07-risk-keywords-library.md` 公检法分类里命中，模型可继续触发高风险流程。当前对外 demo 数为 **4**。
- 验收标准：
  - Production build 不依赖 build cache 可重复部署。
  - `@tailwindcss/oxide-linux-x64-gnu` native binding 装得上（`pnpm-workspace.yaml` `supportedArchitectures` 锁 linux/x64/glibc）。
  - AI 兜底真接（M5 形态 ①，Vercel env `DEEPSEEK_API_KEY` 已配，smoke test 跑过 `decision: "escalate"`）。

## P2 治理（2026-06-08 会话发现，待办）

### 10. 🔧 扩关键词库覆盖主谓换位变体

- 现状：现有 130 词对"我是你儿子"命中，但"他说他是我儿子"（主谓换位）不命中，AI 兜底时 LLM 偶尔 keep → 漏报。
- 验收标准（按 `docs/07` §11 三道闸：真实漏报驱动 → 测试 → 老人测试）：
  - 至少扩 10 条主谓换位、口语化变体。
  - 补对应单测和 `classify-risk.test.ts` 16 个验收用例的覆盖。
  - 老人测试通过。

### 11. 🔧 抽 `shared-classifier.ts` 共享模块消冗余

- 现状：关键词保险丝在 server (`src/domain/risk/classify-risk.ts`) + client (`src/lib/ai/fetch-route.ts`，烘焙 130 词进 client bundle) 两处实现。同一份逻辑改两处，行为还可能漂移（client 兜底缺 `/tutorial` 分支）。
- 验收标准：
  - 新建 `src/domain/risk/shared-classifier.ts`，client + server 共享同一份。
  - 156 个测试必过。
  - 5 demo URL 必跑通。
  - client bundle 体积不增长（关键词数据只一份）。

### 12. 🔧 抽 `config.ts` 收敛 env 数据泥团

- 现状：7 个 env var（`DEEPSEEK_API_KEY` / `MODEL` / `BASE_URL` / `AI_RECHECK_TIMEOUT_MS` / `ENABLE_AI_RISK_RECHECK` / `AI_RATE_LIMIT_PER_10MIN` / `AI_DAILY_BUDGET`）散在 5 个文件（`deepseek-client.ts` + `rate-limit.ts` + `.env.example` + Vercel Dashboard）。
- 验收标准：
  - 新建 `src/lib/ai/config.ts`，`getAiConfig()` 一次性读 + 校验 + 注入。
  - 所有上层（`deepseek-client` / `rate-limit`）从 `getAiConfig()` 注入，不直接 `process.env`。
  - `.env.example` 仍是真理来源（不重复逻辑，只列变量）。

### 13. 🔧 收口 5 层 `try/catch` `fail-open`

- 现状：`routeWithAiRecheck` → `recheckLowRisk` → `defaultDeepSeekClient.chat` → `fetch` → `parse`，每层都 `try { ... } catch { 返回 base 决策 }`。5 层套娃，**真出 bug 时 5 层全吞，事故追溯 0 信号**。
- 验收标准：
  - 改成 1 处总开关（`src/lib/ai/safety.ts`），删 4 处冗余 `try/catch`。
  - 关键词保险丝仍 fail-open（业务规则：所有异常 = 关键词兜底）。
  - 真异常时 `log.error` 含 `err` + 文本 hash（不打 raw text 避免 PII）。
  - AI 兜底真接测试 + smoke test 必过。

## P2 测试覆盖洞（2026-06-09 Fix #3/#8 会话发现）

### 14. 🆕 `firstParam` helper 缺单测

- 现状：`src/app/risk-alert/page.tsx` 新加的本地 `firstParam(value: string | string[] | undefined): string | undefined` 纯函数，**只**被 HTTP smoke 测过（`scripts/smoke.mjs` 测了 `?text[]=foo` 一例），没单测。
- 验收标准：
  - `firstParam` 至少 5 个单测：`'foo' → 'foo'` / `['foo','bar'] → 'foo'` / `[] → undefined` / `undefined → undefined` / `['foo',''] → 'foo'`。
  - 测文件可放 `src/app/risk-alert/__tests__/page.test.ts` 或同目录的 `first-param.test.ts`。

### 15. 🆕 unknown-key redirect 行为只 HTTP smoke 覆盖

- 现状：`page.tsx` 顶部 `KNOWN_KEYS` + `NEXT_INTERNAL_QUERY_KEYS` + redirect 逻辑是 server component 主逻辑的一部分，**没** page-level 单测，只靠 `scripts/smoke.mjs` 的 4 个 expectNone/expectStatus 测例覆盖。
- 验收标准：
  - 至少 3 个测例：① URL 含 unknown key → 307 到 canonical ② URL 只含 `_rsc` → 200 不 redirect ③ URL 含 reason + _rsc → 307（cross-check）④ 文本空 + 含 unknown key → 307（不是先 redirect('/')）。
  - 测 Next.js server component 直接单测成本高，可考虑把 redirect target 构造抽成纯函数 `buildCanonicalHref(params)` 单独测。

### 16. 🆕 `KNOWN_KEYS` / `NEXT_INTERNAL_QUERY_KEYS` 协议白名单需 future-proof

- 现状：`NEXT_INTERNAL_QUERY_KEYS = new Set(['_rsc'])` 是字面量。Next.js 改协议（如改用 `__rsc__`）时需手动扩集合，否则又会出现同类 bug（`text[]=foo` 那种"协议约束变了我们没跟上"）。
- 验收标准：
  - 加 CI lint 测：构造一组 `node_modules/next/dist/client/components/app-router-headers.js` 已知的 `*_QUERY` 常量，与 `NEXT_INTERNAL_QUERY_KEYS` 做集合差集比较，缺一个就 warn（不 fail，避免 Next.js 升级时阻塞）。
  - 或更轻：每月手 check 一次 Next.js changelog，看 RSC 协议 query 有没有改。

## P3 后续版本

### 14. 家人端

- 绑定家人。
- 接收求助卡。
- 家人回复转成老人听得懂的话。

### 15. 截图理解

- 上传前必须提示遮住敏感信息。
- 默认不保存截图。
- 高风险截图不进入公开知识库。

### 16. 教程后台

- 教程库管理。
- 志愿者贡献。
- 管理员审核。
- AI 改写成适老化表达。

### 17. 🆕 评估栈替换（Vite + Edge Function）

- 现状：Next.js 16 + Turbopack + Tailwind v4 + DeepSeek 这一整套是为 LLM 应用准备的，但目标用户（老人）几乎用不到 SSR / Turbopack 优化 / Tailwind oxide native binding / Edge function 边缘节点。**杀鸡用牛刀**。
- 候选栈：Vite + 原生 CSS / UnoCSS 2 KB + Cloudflare Workers / Vercel Edge Function。
- 验收标准（仅评估，不承诺动）：
  - 完整产物 < 50 KB（HTML + CSS + JS + JSON 全部）。
  - 首屏冷启动 < 200ms（4G 网络）。
  - AI 兜底按需调用（不是每次请求都跑）。
  - 老人 3 分钟操作预算内。
  - 调研报告写到 `docs/09-stack-evaluation.md`（新建），不直接动手。

