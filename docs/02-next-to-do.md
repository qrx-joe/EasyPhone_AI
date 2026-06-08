# Next To Do

> 用途：只放接下来一个开发冲刺要做的事。不要把所有想法塞进来。
> 当前目标：上一轮冲刺（MVP 骨架 + Vercel 部署）已 100% 完成；下一冲刺聚焦 P2 治理。
> 详细开发计划见：`docs/06-development-plan.md`。
> 任务池见：`docs/01-to-do.md`（P2 治理项已新增到那里）。

## 上轮冲刺结果（2026-06-04 → 2026-06-08）

- ✅ 本地 Web MVP 骨架（M0–M4）：首页、语音输入、问题确认、分步指导、风险提醒、家人求助卡
- ✅ 三个核心 demo 场景：微信没声音、字太小、医保异常短信
- ✅ AI 兜底真接（M5 形态 ①）：仅在 base.level=low 时跑 DeepSeek recheck，escalate 时跳 `/risk-alert?source=ai`
- ✅ Vercel 部署：`https://easy-phone-ai.vercel.app`（Production Ready 24s，5 demo URL 跑通）
- ✅ OpenPrd 门禁：standards ✅ / quality ✅ / dev-check ✅

## 下一轮冲刺目标（2026-06-09 起）

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
