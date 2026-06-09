# 项目规范文档

> 项目：EasyPhone AI
> 目标：建立一个高扩展、可维护、安全优先的 AI 语音手机教练 MVP。
> 最近校验日期：2026-06-04。

## 0. 权威文档入口

开发时优先参考：

- `docs/00-prd-cn-authoritative.md`
- `docs/02-next-to-do.md`
- `docs/05-project-standards.md`

原始 PRD：

- `EasyPhone_AI_PRD_CN.md`
- `EasyPhone_AI_PRD.md`

如果原始 PRD 与权威开发引用版发生冲突，先以 `docs/00-prd-cn-authoritative.md` 为准，再回到用户处确认。

## 1. 产品边界

EasyPhone AI 的第一版不是老人超级 App，不是远程控制工具，不是金融、医疗、法律助手，也不是开放社区。

第一版只做一件事：

```text
低风险手机问题：一步一步教。
高风险手机问题：立刻停止指导，并生成家人求助卡。
```

任何新功能都必须回答：

1. 是否服务这个闭环？
2. 是否降低诈骗和误操作风险？
3. 是否会增加老人理解负担？
4. 是否会引入隐私或合规风险？

回答不清楚，就不要进 MVP。

## 2. 推荐技术选型

### 2.1 MVP 推荐栈

| 模块 | 推荐方案 | 原因 |
|---|---|---|
| 前端 | Next.js + React + TypeScript | 生态成熟，适合快速构建可部署 Web Demo；Next.js App Router 支持文件路由、Server Components、Suspense、Server Functions。 |
| 样式 | Tailwind CSS | 快速实现大字号、高对比、响应式适老化界面。 |
| 状态管理 | React state + URL/state machine 思路 | MVP 流程短，不要上来引入重型状态库。 |
| 语音识别 | 浏览器 Web Speech API 作为 Demo 入口，手动输入兜底 | 快速、低成本，但兼容性不稳定，所以必须有文本兜底。 |
| 语音播报 | 浏览器 SpeechSynthesis | MVP 足够，后续再替换云 TTS。 |
| AI 分类 | 规则词库 + LLM | 高风险判断必须有规则兜底，不能完全相信模型。 |
| 数据存储 | localStorage / 内存数据 | Demo 阶段避免过早引入数据库复杂度。 |
| 后续数据库 | Supabase / PostgreSQL | Supabase 提供 Postgres、Auth、Realtime 等能力，适合后续家人端和记录管理。 |
| 部署 | Vercel / Cloudflare Pages | 前端 Demo 部署快，适合黑客松。 |

参考来源：

- Next.js App Router 官方文档：https://en.nextjs.im/docs/app
- OpenAI Realtime API 官方文档：https://platform.openai.com/docs/guides/realtime/
- Supabase 官方文档：https://supabase.com/docs/
- W3C WCAG 2.2：https://www.w3.org/TR/WCAG22/

### 2.2 Python 规范

如果项目中出现 Python 脚本，必须遵守：

- 虚拟环境创建在项目根目录：`.venv`
- 创建命令：`uv venv`
- 指定 Python 版本：`uv venv --python 3.11`
- 运行脚本：`uv run script.py`
- 包管理只使用 `uv`
- 禁止直接使用 `pip`、`pip-tools`、`poetry`

## 3. 架构原则

### 3.1 安全优先于完成任务

高风险场景永远不继续给操作步骤。

只要规则判断或 AI 判断任一命中高风险，就进入风险提醒：

```text
if ruleRisk >= high or aiRisk >= high:
    shouldStop = true
```

### 3.2 规则兜底，不把安全完全交给模型

LLM 可以做语义理解，但不能独占风险判断。

必须有本地风险词库：

- 验证码
- 银行卡
- 转账
- 汇款
- 陌生链接
- 二维码
- 屏幕共享
- 远程控制
- 支付密码
- 医保异常
- 社保异常
- 退款
- 贷款
- 投资
- 中奖

### 3.3 白名单教程优先

低风险教程优先来自人工维护的教程库。AI 只做：

- 分类。
- 改写成短句。
- 生成 fallback 表达。
- 生成家人求助卡。

不要让 AI 自由编造手机操作步骤。

### 3.4 数据最小化

MVP 默认不保存：

- 原始语音。
- 敏感截图。
- 验证码。
- 银行卡号。
- 身份证号。
- 支付密码。
- 通讯录。
- 短信。
- 定位。

## 4. 代码组织建议

如果使用 Next.js，推荐结构：

```text
src/
  app/
    page.tsx
    guide/
    warning/
    family/
  components/
    VoiceButton.tsx
    StepCard.tsx
    RiskWarning.tsx
    FamilyHelpCard.tsx
  domain/
    risk/
      risk-level.ts
      risk-keywords.ts
      classify-risk.ts
    tutorial/
      tutorial-types.ts
      tutorial-library.ts
    agent/
      agent-output.ts
      prompt.ts
  lib/
    speech/
    storage/
  styles/
```

### 4.1 命名规范

- 类型名使用 PascalCase：`QuestionRecord`
- 函数名使用 camelCase：`classifyRisk`
- 文件名使用 kebab-case：`classify-risk.ts`
- 风险等级使用固定枚举：`low | medium | high | critical`

### 4.2 注释规范

注释要解释“为什么”，不要解释“这行代码在做什么”。

需要详细注释的地方：

- 风险分级规则。
- 高风险中断逻辑。
- 敏感信息过滤逻辑。
- AI Prompt 的安全边界。
- 教程库中可能产生误操作的步骤。

示例：

```ts
// 高风险判断必须保守：误报只会打断教程，漏报可能导致老人被骗。
// 因此只要规则或模型任一判断为 high/critical，就停止普通指导流程。
export function shouldStopGuidance(ruleRisk: RiskLevel, aiRisk: RiskLevel) {
  return isHighRisk(ruleRisk) || isHighRisk(aiRisk);
}
```

## 5. UI 制作规范

### 5.1 适老化原则

- 首页只保留一个主动作：按住说话。
- 主按钮必须足够大。
- 每个页面只承载一个主要任务。
- 文案短、慢、明确。
- 不出现广告、信息流、复杂弹窗。
- 不使用需要学习成本的复杂图标。

### 5.2 可访问性标准

参考 WCAG 2.2：

- 保证文本对比度。
- 保证按钮可聚焦。
- 保证键盘可操作。
- 避免文本遮挡。
- 不仅依赖颜色表达风险，也要有文字说明。
- 触控目标要足够大。

### 5.3 页面规范

| 页面 | 核心要求 |
|---|---|
| 首页 | 10 秒内知道可以按住说话。 |
| 问题确认页 | 明确问“我理解得对不对”。 |
| 分步指导页 | 一次只显示一步。 |
| 风险提醒页 | 冷静但坚定，不恐吓。 |
| 家人求助页 | 家人能快速看懂发生了什么。 |

## 6. AI 输出规范

AI 输出必须是结构化 JSON：

```json
{
  "category": "wechat_notification",
  "riskLevel": "low",
  "confirmedQuestion": "你是不是想解决：微信没有声音？",
  "shouldStop": false,
  "reason": "普通设置问题，不涉及钱、验证码或陌生链接。",
  "steps": [
    {
      "stepIndex": 1,
      "stepText": "先打开微信。",
      "voiceText": "先打开微信。打开以后，点好了。",
      "fallbackText": "微信是绿色图标，里面有两个白色气泡。"
    }
  ],
  "riskWarning": "",
  "familyMessage": ""
}
```

约束：

- 不输出长篇教程。
- 不输出转账、验证码、屏幕共享、下载陌生 App 的操作步骤。
- 不做金融、医疗、法律判断。
- 不确定时，选择停止并联系家人或官方渠道。

## 7. 测试规范

### 7.1 必测场景

- “微信没有声音了” -> 低风险。
- “手机字太小” -> 低风险。
- “短信让我输入验证码” -> 高风险。
- “对方让我开屏幕共享” -> 极高风险。
- “让我转账才能退款” -> 极高风险。
- “手机空间不够” -> 中风险。

### 7.2 验收标准

- 高风险召回优先，不追求完美准确率。
- 任意高风险输入都不能进入普通教程。
- 每次只展示一个步骤。
- 家人求助卡清楚、短、可复制。

## 8. 坏味道检查清单

每次开发或评审都检查：

- 僵化：新增一个场景是否要改很多无关文件？
- 冗余：风险词、教程步骤、Prompt 是否在多处重复？
- 循环依赖：UI 是否直接依赖底层 AI 实现？
- 脆弱性：改一个教程是否会影响风险判断？
- 晦涩性：变量名和流程是否能让新人看懂？
- 数据泥团：多个函数是否反复传递同一组参数？
- 不必要复杂性：是否为了黑客松 MVP 引入了过重架构？

如果发现坏味道，必须先记录，再决定是否优化。

### 8.1 2026-06-08 新增坏味道（M5 + Vercel 部署会话后）

- **冗余（关键词保险丝在 client + server 两处实现）**：`src/domain/risk/classify-risk.ts`（server 权威）和 `src/lib/ai/fetch-route.ts`（client fail-open 兜底，烘焙 130 词进 client bundle）两处实现同样的关键词匹配 + MAX 决策。client 兜底还缺 `/tutorial` 分支，行为可能漂移。**抽 `shared-classifier.ts` 共享模块**消冗余。
- **数据泥团（7 个 env var 散在 5 个文件）**：`DEEPSEEK_API_KEY` / `MODEL` / `BASE_URL` / `AI_RECHECK_TIMEOUT_MS` / `ENABLE_AI_RISK_RECHECK` / `AI_RATE_LIMIT_PER_10MIN` / `AI_DAILY_BUDGET` 散在 `deepseek-client.ts` / `rate-limit.ts` / `.env.example` / Vercel Dashboard。每次新增字段要在 4-5 处同步。**抽 `config.ts` 收敛**：`getAiConfig()` 一次性读 + 校验 + 注入。
- **不必要复杂性（5 层 try/catch fail-open 套娃）**：`routeWithAiRecheck` → `recheckLowRisk` → `defaultDeepSeekClient.chat` → `fetch` → `parse`，每层都 `try { ... } catch { 返回 base 决策 }`。**真出 bug 时 5 层全吞，事故追溯 0 信号**。收口到 1 处总开关（`src/lib/ai/safety.ts`），删 4 处冗余 catch。
- **脆弱性（Vercel build cache 是"假性健康"陷阱）**：`Already up to date` 不代表 install 行为对了，可能吃的是上一次 build 留下的 node_modules。**真出问题时** cache 失效 → 真实 install 行为暴露 → 间歇性 bug。规避：lint:deps 守卫装 buildCommand 前，强制 cold install（`vercel.json` 设 `installCommand`）。

完整记录见 `docs/04-advice.md` 2026-06-08 段。

## 9. Vercel 部署规范

### 9.1 部署目标架构

- Vercel Production = `https://easy-phone-ai.vercel.app`
- 镜像：Next.js 16 + Node 24 + pnpm 10.28.0
- Region: iad1（Washington D.C., USA — East）

### 9.2 配置文件（`vercel.json`）

```json
{
  "buildCommand": "pnpm run lint:deps && pnpm test && pnpm run build",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

- `installCommand` 强制 `pnpm install --frozen-lockfile`，**不**用 Vercel 默认的 build cache restore 行为
- `buildCommand` 前置 `lint:deps` + `test`，任何 install 漂移在 build 阶段就 fail，不让坏部署溜过

### 9.3 包管理器配置（`pnpm-workspace.yaml`）

```yaml
ignoredBuiltDependencies:
  - sharp
  - unrs-resolver

supportedArchitectures:
  os:    [linux]
  cpu:   [x64]
  libc:  [glibc]
```

- **`supportedArchitectures` 必须只列部署目标架构**。**不要**加 `current`（开发机架构）—— 会导致 pnpm 对 optional 依赖的过滤在跨 host 时非确定，间歇性漏装。
- 部署目标是 Vercel Linux x64 glibc，本地 dev 装 Windows binding 走 `pnpm dev` 路径不依赖 oxide binding，不影响开发体验。

### 9.4 引擎版本（`package.json`）

```json
"engines": {
  "node": ">=20.0.0",
  "pnpm": ">=10.28.0"
}
```

- Vercel 看到 `engines.node` 会按需选 Node 镜像，避免用 Vercel 默认版本（v20.x）跟 Next 16 不兼容
- Vercel 警告 `>=` 写法会在新 major Node 发布时自动升级。固定用 `>=20.0.0` 是有意的（要 Node 20+，不锁 minor）。

### 9.5 可选依赖守卫（`scripts/verify-optional-deps.mjs`）

部署 / CI / 本地 build **之前**跑：

```bash
pnpm run lint:deps
```

脚本检查 `node_modules/.pnpm/@tailwindcss+oxide-linux-x64-gnu@4.3.0` 存在，否则 exit 1。这是 P0 修复的回归守卫——`@tailwindcss/oxide` 在 Tailwind v4 PostCSS 编译时被动态 require 它的 native binding，Vercel 是 linux x64 glibc，所以**必须**装 `linux-x64-gnu` variant。

### 9.6 CI 门禁

`.github/workflows/ci.yml` 必跑：

```yaml
- pnpm install --frozen-lockfile
- pnpm run lint:deps
- pnpm test
- pnpm build
- pnpm start  # 生产 server
- sleep 5
- node scripts/smoke.mjs  # 5 demo URL HTTP 200
- npx @openprd/cli standards . --verify
- npx @openprd/cli quality . --verify  # MVP 阶段 continue-on-error
- npx @openprd/cli doctor .
```

任何 step fail = merge 阻断。

## 10. AI 兜底真接验证

### 10.1 形态 ① 落地说明

按 M5 设计，AI 兜底**只在 `base.level === 'low'` 时跑**（`src/lib/ai/route-with-ai.ts:68`）。逻辑链：

```
用户输入 → buildRouteForInput(text) [关键词保险丝 + tutorial 匹配]
  ├─ base.level > low  → 直接返回 base 决策（不走 AI）
  └─ base.level === low
      → recheckLowRisk(trimmed, base.classification, DeepSeek client)
      → AI decision: 'keep' / 'escalate'
      ├─ 'keep'      → 返回 base 决策（base 跳 /tutorial 或 /confirm）
      └─ 'escalate'  → 覆盖为 /risk-alert?source=ai&reason=AI+兜底:...
```

### 10.2 真接 vs 升级

**"AI 兜底真接"** = AI recheck 真的被调用，Vercel 容器真的调到了 DeepSeek API。

| 现象 | 含义 |
|---|---|
| URL 跳 `/risk-alert?...&source=ai&...` | AI 真接 + escalate（升级到风险页）|
| URL 跳 `/tutorial?text=...` | AI 真接 + keep（**不是** fail-open，是 base 决策生效）|
| URL 跳 `/confirm?text=...` | AI 没接，client 兜底（关键词没命中，tutorial 也没匹配）|
| URL 跳 `/risk-alert?level=critical&keywords=...` | 关键词保险丝先命中，**不走** AI |

**关键纠正**："没 source=ai ≠ 没接"。AI keep 也是接。

### 10.3 4 步验证方法

按从弱到强的证据链：

1. **DevTools Network 标签**（用户侧，最直接）
   - 浏览器 F12 → Network 标签 → 清空旧请求 → 输入测试句 → 提交
   - 找 `/api/route` 那行 → Response 标签
   - 期望 JSON：`{"href":"/tutorial?...","level":"low"}` 或 `{"href":"/risk-alert?...&source=ai&...","level":"high"}`
   - 看到 `href` 是 `/tutorial` 或 `/risk-alert?source=ai`，**不是** `/confirm` → AI recheck 跑过

2. **Deployment-time smoke test 日志**（CI 侧，间接）
   - Vercel 部署时 `vercel inspect <url> --logs` 拉 build 日志
   - 搜 `[ai-recheck] { ... source: "ai", decision: "escalate", ... }`
   - smoke test 跑过 `source: "ai"` + `decision: "escalate"` → 部署版本代码路径走通

3. **Production runtime 日志**（运维侧，权威但延迟）
   - `vercel logs <prod-url> --environment production --since 30m --no-follow`
   - 找 `λ POST /api/route 200` + 紧随其后的 `[ai-recheck] { ... }`
   - ⚠️ Vercel 团队 plan 上 production 日志有延迟（数分钟到数小时），hobby plan 限制更严

4. **构造测试句**（设计侧，必备）
   - 避开所有 130 个关键词（base.level === low 才能进 AI recheck）
   - 语义上高风险（LLM 应当嗅出风险）
   - 示例：
     - ❌ "我刚下载了一个新 APP，要填身份证号才能用"（命中"身份证号" critical，不进 AI）
     - ✅ "有人加我微信说他公司上市了，要带我一起发大财"（关键词不命中，AI 嗅"带你发财"=典型诈骗）
     - ✅ "我刚认识一个人说他是我失散多年的儿子，要我打点钱给他做路费"（关键词不命中，AI 嗅"失散儿子+打钱"=冒充亲属）
   - 注意：AI keep 是正常路径，升级是少数情况

### 10.4 fail-open 哲学

**业务规则**：所有异常 = 关键词保险丝兜底（`src/lib/ai/route-with-ai.ts:21`）。

```ts
// 任何步骤异常 → 返回 buildRouteForInput() 原结果
// 关键词保险丝是主防线,AI 是辅助
```

**已知局限**：
- LLM 偶尔漏判（"失散多年的儿子+打钱"AI 觉得是低风险）—— 关键词保险丝是底线
- AI 调慢会卡住请求（2 秒超时）—— fail-open 到关键词
- 多实例部署（Vercel 多 region / Next.js 多 worker）rate limit 各算各的—— 严格防滥用要换 Redis

### 10.5 已知非确定性

本次会话发现：
- Vercel build cache restore 会让 `Already up to date` 不可信——必须 `--force --no-wait` 验证
- LLM 决策本身有非确定（temperature 0.1 + response_format: json_object 锁低温但非绝对零）
- 关键词匹配有边界（"我是你儿子"命中，"他说他是我儿子"不命中）

**对策**：lint:deps 守卫 + 扩关键词库（按 docs/07 §11 三道闸）+ 持续老人测试。

## 11. Next.js 协议内部 query 白名单模式（2026-06-09 新增）

> 任何在 server component 入口"按 known key 集合消毒" / "redirect 未知 key"的安全 fix，
> **必须**同时识别框架/协议内部 query，单列白名单，不能跟业务 known key 混在一起，也不能当 unknown 重定向掉。

### 11.1 为什么需要这层白名单

Next.js 客户端 RSC prefetch / `router.push` / `<Link>` 走 React Server Components 协议，
会自动在 URL 上加内部 query。当前已知至少：

- `_rsc`（`node_modules/next/dist/client/components/app-router-headers.js` 中 `NEXT_RSC_UNION_QUERY = '_rsc'`）

未来 Next.js 改协议时可能加新的内部 query，**必须**实测 + 翻源码确认。

### 11.2 实现模板

```ts
// page.tsx 入口
const KNOWN_KEYS = new Set(['text', 'text[]', 'source', 'level'])  // 业务读
const NEXT_INTERNAL_QUERY_KEYS = new Set(['_rsc'])                   // 协议内部

const unknownKeys = Object.keys(params).filter(
  (k) => !KNOWN_KEYS.has(k) && !NEXT_INTERNAL_QUERY_KEYS.has(k),
)
if (unknownKeys.length > 0) {
  // server-side redirect 到只剩 known key 的 canonical URL
  // (新请求的 RSC payload 不含 unknown key,攻击者 URL 投毒被消毒)
  redirect(...)
}
```

### 11.3 三道闸（防止白名单过时）

1. **实测带协议内部 query 的 URL**：curl `?_rsc=xxx` 看 page 行为是否符合预期
2. **smoke 测例覆盖**：每个 known 内部 query 一个测例（`expectStatus: 200, expectAny: [...]`，不 followRedirect）
3. **cross-check 测例**：攻击者 `?reason=evil&_rsc=xxx` 必须仍被消毒（reason 是 unknown，但 `_rsc` 放行）

### 11.4 future-proof 机制

- 注释里显式标："Next.js 改协议时需同步扩 `NEXT_INTERNAL_QUERY_KEYS` 集合"
- 列入 `docs/01-to-do.md` 跟踪
- 每月手 check 一次 Next.js changelog，看 RSC 协议 query 有没有改
- 可选：加 CI lint 测，对比 `node_modules/next/dist/client/components/app-router-headers.js` 已知 `*_QUERY` 常量

### 11.5 相关案例

- `src/app/risk-alert/page.tsx` 当前实现
- `scripts/smoke.mjs` Fix #8 + 自审 _rsc 测例

### 11.6 黑盒依赖提醒

Next.js RSC payload 序列化行为是**黑盒** —— 框架版本升级、内部 query 改名、协议重构都可能让"看起来对"的代码失效。
**唯一可靠验证方式**：curl + grep 响应体（不靠 visible summary 肉眼检查，靠 grep 整响应看攻击者文案是否在 body 里）。


