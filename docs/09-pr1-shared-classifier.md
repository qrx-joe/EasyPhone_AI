# PR1: 抽 `shared-classifier.ts` 共享模块

> **类型**：P2 治理（代码架构坏味道 #2 冗余）
> **状态**：待开始（plan 已就绪，user approved 方向，未动代码）
> **创建**：2026-06-08
> **关联**：
> - `docs/01-to-do.md` §11（任务池条目）
> - `docs/04-advice.md` 2026-06-08 段 §5.1（坏味道分析）
> - `docs/05-project-standards.md` §8.1（坏味道清单）
> - commit `d5a5b61`（05-project-standards.md 补充）

---

## 1. 问题陈述（What）

关键词保险丝的**逻辑 + 数据**在 client + server 两处实现，违反"代码架构 6 大坏味道"中的**冗余**（redundancy）。

### 1.1 重复的资产

| 资产 | Server 实现 | Client 实现 | 物理位置 |
|---|---|---|---|
| 130 词数据 `RISK_KEYWORDS` | `src/domain/risk/risk-keywords.ts` | 烤进 `client-route.ts` 引用的 user-routing 链路 | `node_modules/.pnpm/...` 1 份 + client bundle 1 份 |
| `fullToHalf` 函数 | `src/domain/risk/classify-risk.ts:50` | 烤进 client bundle（同上链路）| client bundle 内联 |
| `normalize` 函数 | `src/domain/risk/classify-risk.ts:69` | 烤进 client bundle（同上链路）| client bundle 内联 |
| `classifyRiskByRules` 函数 | `src/domain/risk/classify-risk.ts:87` | 烤进 client bundle（同上链路）| client bundle 内联 |

### 1.2 行为漂移证据

- **client 兜底逻辑缺 `/tutorial` 分支**：`client-route.ts` 在 `/api/route` 失败时降级到 `routeToInput`，`routeToInput` 调 `buildRouteForInput`，`buildRouteForInput` 在 low/medium 风险**不**匹配 tutorial 时**只**跳 `/confirm`，**永远不**跳 `/tutorial`。
  - 实际后果：server 在 base 匹配到 tutorial 时跳 `/tutorial`；client 兜底时跳 `/confirm`。
  - 用户观察：用户截图跳 `/tutorial` 证明 `/api/route` 真的成功了，否则会跳 `/confirm`。
- **decoration 行为可能漂移**：client + server 两处实现，靠人工维护保持一致；一旦有人改 1 处忘改另 1 处，行为漂移。

### 1.3 触发条件

- **每次扩关键词库**（按 `docs/07` §11 三道闸）：理论上只动 1 处（`risk-keywords.ts`），但 client bundle 也会变（烤了同一份 130 词的引用），需要 Preview 部署验证 client bundle 也对。
- **每次改分类算法**（`fullToHalf` / `normalize` / `classifyRiskByRules`）：理论上 1 处，实际 client bundle 内联的副本可能跟 server 漂移。
- **新增 risk-level**（如增加 `info` 等级）：2 处都改。

### 1.4 实际代价

| 场景 | 浪费 |
|---|---|
| 加 1 条关键词 | 改 `risk-keywords.ts` 1 处，但需要在 Preview 验证 client bundle 仍正确 |
| 改 1 行归一化逻辑 | 改 `classify-risk.ts` 1 处，但 130 词的 client 副本需要人工确认没漂移 |
| 修 client 兜底缺 `/tutorial` 分支 | 改 `user-routing.ts` 1 处，但 client 兜底仍走同一逻辑 → 修了之后 client 反而跟着改了 |

---

## 2. 根因分析（Why）

### 2.1 演化路径

| 时间 | 决策 | 影响 |
|---|---|---|
| M1（2026-06-04） | `classify-risk.ts` 单一权威，server-side 调用 | 安全核心稳定（12 个 routing 测试 + 16 个 classifier 测试）|
| M2-M4 | 客户端零分类逻辑，pure UI | client bundle 干净 |
| M5 PR #1（2026-06-06） | AI 兜底接入：client 调用 `/api/route`，失败降级到 `routeToInput`（client-side 关键词兜底） | client 链路引入**全量** 130 词 + 3 函数，烤进 client bundle |
| M5 后续 | 没人把 client 端分类逻辑单独抽出来 | 重复实现形成 |

### 2.2 为什么不抽？

- 抽到 `src/domain/risk/` 是 server-side 命名约定，加 client-side 模块需要重新设计边界
- 130 词数据是"安全核心"——心理上不愿共享给 client（虽然**已经**共享了）
- 跨 server/client 共享的工程实践（`src/shared/` / `src/domain/shared/`）项目里没建立
- **优先级低**：M5 上线后用户没遇到实际 bug，"冗余"是潜在风险不是显性问题

### 2.3 现在为什么抽？

- **M5 形态 ① 落地后**，AI 兜底的真接验证暴露了 client 兜底跟 server 不一致（`/tutorial` 缺分支）
- **docs/04-advice.md §5.1 显式记录**了这个坏味道
- **docs/05-project-standards.md §8.1** 列入"本次会话识别的 4 个新坏味道"
- **P2 治理方向**已定（`docs/02-next-to-do.md` 下一轮冲刺目标 = 3 个 P2 治理项）
- **窗口期**：项目刚 demo 跑通，节奏适合做小步重构

---

## 3. 目标（Goal）

### 3.1 行为目标

- **数据单一真理源**：`SHARED_RISK_KEYWORDS` 在 `src/domain/risk/shared-classifier.ts`，client + server 共用同一份
- **算法单一真理源**：`classifyRiskByRulesShared` / `fullToHalfShared` / `normalizeShared` 同样在 shared 模块
- **行为不可能漂移**：client + server 引用同一函数，**不可能**两处实现不一致
- **零行为变更**：156 个测试必过；5 demo URL 必跑通；AI 兜底真接证据保持

### 3.2 工程目标

- **消除"改 1 处时需要改 2 处"的心智负担**——加关键词/改算法只动 1 处
- **建立跨 server/client 共享的工程模式**——`src/domain/risk/shared-*` 是这次建立的新边界，未来其他共享层（tutorial / help）可参考
- **client bundle 不增长**——130 词数据仍只 1 份（共享层 import），但**去除**之前 user-routing 把 server-only 模块烤进 client bundle 的隐患（如果 shared 是纯 TS，烤进 client bundle 的只是数据 + 函数，**没** server-only 副作用）
- **保持 12 个 routing 不变量测试 + 16 个 classifier 不变量测试**——"安全核心"语义不变

### 3.3 非目标

- **不**删 `classify-risk.ts` / `risk-keywords.ts`——保留 re-export 作为向后兼容层
- **不**改 6 个 import 站点——保持 `from '../risk/classify-risk.ts'`
- **不**扩 130 词库——这是 P2 §10 独立 PR
- **不**抽 `config.ts`（P2 §12）——独立 PR
- **不**收口 5 层 try/catch（P2 §13）——独立 PR

---

## 4. 范围（Scope）

### 4.1 涉及文件

| 文件 | 改动 | 风险 | 行数变化 |
|---|---|---|---|
| **新建** `src/domain/risk/shared-classifier.ts` | 装 130 词数据 + 3 函数 + 6 段文件说明书 | 无（新建）| 0 → ~440 |
| **改** `src/domain/risk/classify-risk.ts` | 实现迁出，改 re-export from shared | 中（安全核心文件）| 118 → ~15 |
| **改** `src/domain/risk/risk-keywords.ts` | 7 桶中间数组 + RISK_KEYWORDS 导出迁出，改 re-export from shared | 中（数据源文件）| 438 → ~15 |

**合计**：3 个文件（1 新建 + 2 改动），**0** 测试改动，**0** import 站点改动。

### 4.2 不涉及（向后兼容）

| 文件 | 原因 |
|---|---|
| `src/app/risk-alert/page.tsx` | 继续 `from '@/domain/risk/classify-risk'`（re-export 保留符号）|
| `src/domain/help/card-serialization.test.ts` | 同上 |
| `src/domain/help/help.test.ts` | 同上 |
| `src/domain/question/question.test.ts` | 同上 |
| `src/domain/risk/classify-risk.test.ts` | 同上 |
| `src/domain/routing/user-routing.ts` | 同上 |
| `src/lib/ai/risk-recheck.ts` | 注释里引用 classifyRiskByRules 但**不** import |
| `src/lib/ai/route-with-ai.ts` | 同上 |
| `src/lib/ai/fetch-route.ts` | 纯网络层，**不**涉及分类 |
| `src/lib/ai/client-route.ts` | 用 `routeToInput`（user-routing），**不**直接 import 分类 |

### 4.3 关联但不动

| 文件 | 关联 |
|---|---|
| `src/domain/risk/types.ts` | 导出 `RiskLevel` / `RiskKeyword` / `RiskClassification` / `RISK_RANK` / `shouldStopGuidance`——shared 复用 |
| `src/domain/risk/EasyPhone_AI_risk_README.md` | 文件夹 README，会自动反映新模块存在 |
| 16 个 `classify-risk.test.ts` 测试 | 锁住 `classifyRiskByRules` 行为，re-export 形式不变 → 测试零修改 |
| 12 个 `user-routing.test.ts` 测试 | 锁住 `buildRouteForInput` 行为，零修改 |
| 其他 128 个测试 | 跟风险分类无直接关系，零影响 |

---

## 5. 方案（Approach）

### 5.1 方案 A：re-export 向后兼容（**推荐** ✅）

**做法**：
- 新建 `shared-classifier.ts` 装所有数据 + 函数
- `classify-risk.ts` / `risk-keywords.ts` 改成薄 re-export 层（只导符号，逻辑在 shared）
- 6 个 import 站点**零修改**

**优点**：
- diff 最小（3 个文件：1 新建 + 2 改）
- 测试零修改
- 6 个 import 站点 0 风险
- "消冗余"目标 = "改 1 处时不需要改 2 处" 已达到（数据/逻辑只在 shared）

**缺点**：
- 仍有 re-export 间接层（1 层薄 facade）
- 未来要彻底消 re-export 需要"方案 B"独立 PR

**实施步骤**：

```bash
# 1. 新建 shared-classifier.ts
#    - 搬 130 词（重命名 SHARED_RISK_KEYWORDS）
#    - 搬 fullToHalf / normalize / classifyRiskByRules（重命名 Shared 后缀）
#    - 加 6 段 OpenPrd 文件说明书

# 2. 改 classify-risk.ts
#    - 删 3 函数实现
#    - 改成 export { classifyRiskByRulesShared as classifyRiskByRules } from './shared-classifier.ts'
#    - 保留 6 段文件说明书（更新"依赖"段指向 shared）

# 3. 改 risk-keywords.ts
#    - 删 7 桶中间数组 + RISK_KEYWORDS 导出
#    - 改成 export { SHARED_RISK_KEYWORDS as RISK_KEYWORDS } from './shared-classifier.ts'
#    - 保留 RiskKeyword / ScenarioTag 类型 re-export
#    - 保留 6 段文件说明书（更新"依赖"段）

# 4. 跑 pnpm test (156 case)
# 5. 跑 pnpm run lint:deps
# 6. 跑 openprd standards/quality/dev-check
# 7. 推分支 refactor/shared-classifier
# 8. 等 Vercel Preview 部署 Ready
# 9. Preview 验证 5 demo URL + AI 兜底
# 10. PR 描述 + 合并 main + Production 部署
```

### 5.2 方案 B：激进切流（**不推荐** ❌）

**做法**：
- 新建 `shared-classifier.ts` 同上
- `classify-risk.ts` / `risk-keywords.ts` 删完（不留 re-export）
- 6 个 import 站点**全部改** from shared

**优点**：
- 彻底消 re-export 中间层
- 单一物理文件

**缺点**：
- 改 6 个 import 站点（diff 大）
- 6 个站点都要在 commit 里改（每次改一个 commit 还是 6 个小 commit？）
- 任何 import 站点漏改 → 测试 fail / build fail
- "消冗余"目标已通过方案 A 达成，方案 B 是"过度工程化"

**结论**：方案 B 适合"方案 A 跑通且稳定"之后，**作为 P3 重构独立 PR**。

### 5.3 选定：方案 A

---

## 6. 验收标准（Acceptance）

### 6.1 自动化门禁

| 门禁 | 命令 | 通过条件 |
|---|---|---|
| 单元测试 | `pnpm test` | 156 case 必过，0 fail |
| 依赖守卫 | `pnpm run lint:deps` | `@tailwindcss+oxide-linux-x64-gnu@4.3.0` 存在 |
| 文件说明书 | `npx @openprd/cli standards . --verify` | 51/51 + 17/17 + 6/6（无回归，shared-classifier.ts 新文件 6 段齐全）|
| 质量评估 | `npx @openprd/cli quality . --verify` | `production-ready: 是` |
| 代码变更回顾 | `npx @openprd/cli dev-check . <touched files>` | 必过 |

### 6.2 Preview 部署验证

| 验证项 | 通过条件 |
|---|---|
| Vercel Preview build | `Ready` 状态，build 通过（无 Turbopack native binding 错）|
| 5 demo URL | 浏览器访问全 200：`/tutorial/demo?case=wechat`、`/tutorial/demo?case=font`、`/risk-alert/demo?case=medical-sms|public-security|screen-share` |
| AI 兜底真接 | 构造测试句触发 `/api/route`，DevTools 看 response `href` 不含 `/confirm?text=...` |
| deployment smoke test 日志 | `vercel inspect <preview-url> --logs` 搜 `[ai-recheck] { source: "ai", decision: "..." }` |

### 6.3 Production 部署验证（合并 main 后）

| 验证项 | 通过条件 |
|---|---|
| Vercel Production build | `Ready` 状态 |
| 正式域名 `https://easy-phone-ai.vercel.app` | 200，显示首页 |
| 5 demo URL | 同 6.2 |
| AI 兜底真接 | 同 6.2 |

### 6.4 行为等价性

| 维度 | 验证方法 |
|---|---|
| 130 词数据等价 | shared 模块导出 `SHARED_RISK_KEYWORDS.length === 130`，各桶计数与 `risk-keywords.ts` 原数据一致 |
| `fullToHalf` 等价 | shared 模块函数输入输出跟原 `classify-risk.ts` 函数完全一致（无修改）|
| `classifyRiskByRules` 等价 | 16 个 `classify-risk.test.ts` 验收用例必过 |
| `buildRouteForInput` 等价 | 12 个 `user-routing.test.ts` 不变量测试必过 |
| 5 demo URL 行为一致 | 4 个高风险 demo URL 跳 `/risk-alert?...&keywords=...`；2 个低风险 demo URL 跳 `/tutorial?text=...` |

---

## 7. 风险（Risks）

| ID | 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|---|
| R1 | 改 `classify-risk.ts` 破 16 个不变量测试 | 低 | 高（破坏安全核心）| 纯 re-export 形式，符号行为完全不变；`pnpm test` 必过；不过就 revert |
| R2 | 改 `risk-keywords.ts` 致 `RISK_KEYWORDS` 引用路径漂移 | 低 | 高 | re-export 保留符号；grep 验证所有 import 站点；测试覆盖 |
| R3 | `shared-classifier.ts` 引入 server-only 依赖（`node:fs` / `process.env` / Next.js API）| 低 | 中 | 刻意保持纯 TS；`pnpm dev` 启动看 client console；Preview 必跑 5 demo URL |
| R4 | 130 词数组 import 路径变了，client bundle 行为漂移 | 中 | 中 | Preview 部署必跑，5 demo URL 必通 + 浏览器观察关键词决策仍正确 |
| R5 | OpenPrd 文件说明书格式不对 | 低 | 低 | `standards --verify` 必过；模板在 `.openprd/standards/file-manual-template.md` |
| R6 | PR1 触发的 build 命中旧 cache | 中 | 中 | `vercel.json` 已强制 cold install；Preview 跑 `--force --no-wait` 验证 |
| R7 | 文件命名 `shared-classifier.ts` 跟项目 `src/domain/risk/` 现有命名不一致 | 低 | 低 | 现有命名 kebab-case；`shared-classifier` 符合；`shared-` 前缀表明"共享层"是新约定 |
| R8 | `shared-classifier.ts` 文件说明书 "维护规则"段把"加关键词"指向自身，但其他 import 站点通过 re-export 也指向它 | 低 | 低 | 维护规则段写"加关键词：只动本文件" + re-export 层保持兼容——清晰说明责任 |

### 7.1 缓解后残留风险

- **R4** 客户端兜底逻辑可能仍跟 server 有微差（虽然共享函数了，但调用方逻辑独立）——这超出 PR1 范围，留作 P2 范围独立任务"client 兜底 /tutorial 分支补齐"
- **R6** 即使强制 cold install，Vercel 团队 plan 在不同 region 可能有 cache 不可知差异——按 P0 修复经验，**Preview 部署** + **5 demo URL 实测**是唯一可信验证

---

## 8. 任务清单（Tasks）

### PR1-1: 新建 `shared-classifier.ts`

- [ ] 复制 `RISK_KEYWORDS` 数据（130 词从 `risk-keywords.ts:104-422` + `:430-438`）
- [ ] 复制 `fullToHalf` / `normalize` / `classifyRiskByRules`（从 `classify-risk.ts:50-118`）
- [ ] 重命名为 `SHARED_RISK_KEYWORDS` / `fullToHalfShared` / `normalizeShared` / `classifyRiskByRulesShared`
- [ ] 写 6 段 OpenPrd 文件说明书（核心功能 / 输入 / 输出 / 定位 / 依赖 / 维护规则）
- [ ] 引用 `./types.ts` 的 `RiskLevel` / `RiskKeyword` / `RiskClassification` / `RISK_RANK`
- [ ] 验证：纯 TS，0 外部依赖（不引 `node:fs` / `process.env` / Next.js API）

### PR1-2: 改 `classify-risk.ts` + `risk-keywords.ts` 改 re-export

- [ ] `classify-risk.ts` 删 3 函数实现，改成 `export { classifyRiskByRulesShared as classifyRiskByRules } from './shared-classifier.ts'`
- [ ] `classify-risk.ts` 6 段文件说明书更新"依赖"段指向 shared
- [ ] `risk-keywords.ts` 删 7 桶中间数组 + `RISK_KEYWORDS` 导出，改成 `export { SHARED_RISK_KEYWORDS as RISK_KEYWORDS } from './shared-classifier.ts'`
- [ ] `risk-keywords.ts` 保留 `RiskKeyword` / `ScenarioTag` 类型 re-export
- [ ] `risk-keywords.ts` 6 段文件说明书更新

### PR1-3: 跑测试 + 门禁

- [ ] `pnpm test` 156 case 必过
- [ ] `pnpm run lint:deps` 必过
- [ ] `openprd standards . --verify` 必过
- [ ] `openprd quality . --verify` 必过
- [ ] `openprd dev-check . src/domain/risk/` 必过

### PR1-4: Preview 部署 + 验证

- [ ] `git checkout -b refactor/shared-classifier`
- [ ] commit + push
- [ ] Vercel Preview 部署 Ready
- [ ] 5 demo URL 浏览器访问全 200
- [ ] AI 兜底真接（DevTools Network + smoke test 日志）
- [ ] PR 描述 + 合并 main + Production 部署 Ready

---

## 9. 设计细节

### 9.1 `shared-classifier.ts` 文件说明书草稿

```ts
/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * 关键词版风险分类(纯函数 + 纯数据),供 client + server 共用。
 * server 端 classify-risk.ts 与 client 端 user-routing.ts 链路上
 * (经 Next.js 编译 tree-shake) 都从此处 import,消除"130 词 + 决策算法"
 * 在两处维护的冗余(代码架构坏味道 #2 冗余)。
 *
 * ## 输入
 * - classifyRiskByRulesShared(text): 用户原始输入(已由调用方 trim)
 *
 * ## 输出
 * RiskClassification: { level, matchedKeywords[], reason }
 *
 * ## 定位
 * **共享层** —— client + server 都可以 import。
 * - server 端: classify-risk.ts re-export 保留向后兼容
 * - client 端: 通过 user-routing.ts 间接 import,Next.js 编译时烤进 client bundle
 * 安全不变量: 命中多个关键词时,level = MAX(level),**永远取最高** —— 这是安全保险丝。
 *
 * ## 依赖
 * - ./types.ts: RiskLevel, RiskKeyword, RiskClassification, RISK_RANK
 * - 无第三方依赖;无 server-only API(node:fs / process.env / Next.js API)
 *
 * ## 维护规则
 * - 加关键词: 只动本文件(SHARED_RISK_KEYWORDS 数组),server / client 自动同步
 * - 改算法(fullToHalf / normalize / MAX 行为): 只动本文件,client / server 自动同步
 * - 改 level: 同步更新 ./types.ts 的 RISK_RANK 联合
 * - 不能在本文件引入 server-only API(否则 client bundle build 失败)
 * - 改任何函数实现必过:
 *   - pnpm test (156 case)
 *   - pnpm run lint:deps
 *   - openprd standards . --verify
 *   - Preview 部署 + 5 demo URL 必跑通
 */
```

### 9.2 `classify-risk.ts` 改 re-export 草稿

```ts
/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * classifyRiskByRules 函数的旧入口(向后兼容),真实实现已在 ./shared-classifier.ts。
 * 16 个不变量测试仍从本文件 import → 保留符号;实现本身已迁出。
 *
 * ## 输入
 * - classifyRiskByRules(text): 用户原始输入
 *
 * ## 输出
 * RiskClassification: { level, matchedKeywords[], reason }
 *
 * ## 定位
 * **向后兼容层** —— 老 import 站点(6 个,详见 PR1 plan §4.2)继续从这里 import,
 * 不需要切流到 shared。PR1 目标是消"双份实现",不是消"re-export 中间层"。
 * 后续 PR 可选:把所有 import 站点切流到 shared,然后删本文件。
 *
 * ## 依赖
 * - ./shared-classifier.ts: 真实实现
 *
 * ## 维护规则
 * - 改算法 / MAX 行为: 只动 ./shared-classifier.ts,本文件**不**改
 * - 删本文件: 等所有 import 站点切流到 shared-classifier 后(下一 PR)
 */
export { classifyRiskByRulesShared as classifyRiskByRules } from './shared-classifier.ts'
```

### 9.3 `risk-keywords.ts` 改 re-export 草稿

```ts
/**
 * [OPENPRD 文件说明书]
 * ## 核心功能
 * RISK_KEYWORDS 数据的旧入口(向后兼容),真实数据在 ./shared-classifier.ts。
 * 老 import 站点(包括 risk-keywords 的 0 个直接 import 站点)继续从这里 import。
 *
 * ## 输入
 * - 无运行时输入;模块加载时构造一次。
 *
 * ## 输出
 * - RISK_KEYWORDS: readonly RiskKeyword[] (从 shared re-export)
 * - RiskKeyword / ScenarioTag: 类型导出
 *
 * ## 定位
 * **向后兼容层** —— 同 classify-risk.ts。
 *
 * ## 依赖
 * - ./shared-classifier.ts: 真实数据
 * - ./types.ts: RiskKeyword / ScenarioTag 类型
 *
 * ## 维护规则
 * - 加关键词: 只动 ./shared-classifier.ts,本文件**不**改
 * - 删本文件: 等所有 import 站点切流到 shared-classifier 后(下一 PR)
 */
export { SHARED_RISK_KEYWORDS as RISK_KEYWORDS } from './shared-classifier.ts'
export type { RiskKeyword, ScenarioTag } from './types.ts'
```

---

## 10. 状态变更（Changelog）

- **2026-06-08**：文档创建（基于 2026-06-08 会话诊断 + `docs/01-to-do.md` §11 + `docs/04-advice.md` §5.1）
- **待开始**：plan 已就绪（方案 A 选定，4 步任务清单 + 8 项风险评估 + 6 段验收标准）
- **下一步**：等用户说"go PR1"开始实施
