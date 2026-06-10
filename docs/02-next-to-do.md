# Next To Do

> 用途：只放接下来一个开发冲刺要做的事。不要把所有想法塞进来。
> 当前目标：MVP 骨架 + Vercel 部署 100% 完成；本轮 sprint 期间被 L0 紧急插队 1 天（Fix #3/#8 + _rsc），下个 sprint 继续 P2 治理。
> 详细开发计划见：`docs/06-development-plan.md`。
> 任务池见：`docs/01-to-do.md`（P2 治理 + Fix #3/#8 测试覆盖洞都登记在那里）。

## 上轮冲刺结果（2026-06-04 → 2026-06-08）

- ✅ 本地 Web MVP 骨架（M0–M4）：首页、语音输入、问题确认、分步指导、风险提醒、家人求助卡
- ✅ 三个核心 demo 场景：微信没声音、字太小、医保异常短信
- ✅ AI 兜底真接（M5 形态 ①）：仅在 base.level=low 时跑 DeepSeek recheck，escalate 时跳 `/risk-alert?source=ai`
- ✅ Vercel 部署：`https://easy-phone-ai.vercel.app`（Production Ready 24s，5 demo URL 跑通）
  > **2026-06-10 备注**：README 重写（commit `476f024`）后 demo 入口为 **4 个**（移除 `public-security`），关键词库保留。
- ✅ OpenPrd 门禁：standards ✅ / quality ✅ / dev-check ✅

## L0 紧急插队（2026-06-09，1 天完成）

> 这一天本来在做 P2 治理 sprint 准备，被 `scripts/smoke.mjs` 的 2 个失败测例（Fix #3 / Fix #8）紧急打断。
> L0 安全不变量加固优先于 P2 治理,先做 L0 再回到 P2 sprint。

- ✅ **Fix #3** RSC payload 投毒加固（`src/app/risk-alert/page.tsx`）
  - URL `?reason=请立即把验证码报给客服` 不再渲染到 summary、不进 RSC payload
  - 实现：page 顶部 unknown-key redirect + 硬编码 `risk.reason` 安全默认
- ✅ **Fix #8** searchParams.text 归一化（`src/app/risk-alert/page.tsx`）
  - `?text[]=foo` 形态（Next.js 解析为字面 key `'text[]'`）现在能 200 渲染
  - 实现：`text?: string | string[]` + `'text[]'?: string | string[]` 双 key 匹配 + `firstParam` 收敛
- ✅ **自审发现 + 修复** `_rsc` 客户端 RSC 协议 query 白名单
  - 实测：Next.js 客户端 RSC prefetch 走 `?_rsc=xxx`，被 redirect 吞掉会破坏 `<Link>` 导航
  - 实现：`NEXT_INTERNAL_QUERY_KEYS = new Set(['_rsc'])` 单列白名单
- ✅ **落地**：PR #5 squash merged into main as `8240e7d`（含 2 个新 smoke 测例，total 21 → 23 passed）
- 🔧 **P2 测试覆盖洞**留 issue 跟踪（`docs/01-to-do.md` §14-16）：
  - `firstParam` helper 缺单测
  - unknown-key redirect 行为只 HTTP smoke 覆盖
  - `KNOWN_KEYS` / `NEXT_INTERNAL_QUERY_KEYS` 协议白名单 future-proof 机制

## 下一轮冲刺目标（2026-06-09 起，原 P2 治理 sprint 续）

P2 治理（按优先级）：

1. **扩关键词库**覆盖主谓换位变体（`docs/01-to-do.md` §10）
   - 真实漏报驱动：先在 `classify-risk.test.ts` 补 5 个口语化变体样例
   - 按 `docs/07` §11 三道闸：测试覆盖 → 老人测试 → 入库
2. **抽 `shared-classifier.ts`** 共享模块（`docs/01-to-do.md` §11）
   - client + server 关键词决策同源
   - 156 个测试必过，5 demo URL 必跑通
3. **抽 `config.ts`** 收敛 env 数据泥团（`docs/01-to-do.md` §12）
   - 7 个 env var → 1 个 `getAiConfig()` 入口
   - 上层模块（`deepseek-client` / `rate-limit`）改成注入式

> 候选：Fix #3/#8 留下的 3 个测试覆盖洞（`docs/01-to-do.md` §14-16）可单独拆一个小 PR，约 1 小时。
> 优先级低于 P2 治理 §10-12，因为现有 HTTP smoke 已覆盖主要回归风险，单元测试是补保险。

## 暂不做（保持）

- 不做真实微信发送。
- 不读短信。
- 不读通讯录。
- 不做远程控制。
- 不做开放社区。
- 不接支付、医保、金融真实操作。

## 冲刺完成标准

- P2 治理 §10/§11/§12 三项至少完成 §11（shared-classifier），这是 P2 范围里**最独立的可交付单元**。
- 156 个测试必过。
- 5 demo URL 必跑通。
- OpenPrd standards + quality + dev-check 必过。
- 至少 1 次 Production 部署在 Vercel 上成功。

## 冲刺完成时间预估

§11（shared-classifier）单 PR 约 25 分钟（实际部署 + 验证）。整个 P2 治理（§10–§13）按 3 个独立 PR 推，每个 PR 半天。
