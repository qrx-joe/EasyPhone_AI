# 产品流程说明

> OpenPrd 基线文档
> 最近更新:2026-06-10（更新 M5/M6 状态、清除过期标注）

## 核心流程

```
┌─────────────┐
│  首页 /     │  老人输入(语音/文字/demo 按钮)
└──────┬──────┘
       │ 文本/语音转写
       ▼
┌─────────────────┐
│ buildRouteForInput│  src/domain/routing/user-routing.ts
│   安全核心分流    │
└──────┬──────────┘
       │
   ┌───┴────┐
   │ 分类    │
   │ low/med │  high/critical
   ▼         ▼
/confirm   /risk-alert
   │
   │ 老人点「是的,继续」
   ▼
/tutorial
   │
   │ 走完所有步骤
   ▼
✓ 完成页
```

## 用户路径

### 路径 1:低风险(主流程)

1. **首页**(`/`)— 看到 3 个入口(语音/文字/3 个 demo)
2. **输入** — 语音说"微信没有声音了" → `buildRouteForInput` 判定 `low`
3. **/confirm** — 显示"您是不是想问:微信没有声音了?" + 2 个按钮(是的,继续 / 不是,重新说)
4. **/tutorial** — 5 步分步指导,每步可「🔊 念给我听」、可「没看到这一步(显示替代表达)」、可「点错了(显示先停下来警告)」
5. **完成页** — ✓ + 回到首页

### 路径 2:高风险(关键路径)

1. **首页** — 语音说"短信让我输验证码" → `buildRouteForInput` 判定 `critical`
2. **直接跳 /risk-alert**(跳过 /confirm,避免教程化暗示)
3. **/risk-alert** — 红色"停"标识 + 命中关键词展示 + 行动建议 + 3 个按钮
4. **复制求助卡** — 调 `navigator.clipboard.writeText(serializeHelpCard(help))`,含「事件总结 + 家人该做什么 + 风险等级」
5. **模拟发送** — alert 占位（产品边界内**不**做真实发送；M5 接的是 LLM 风险复检，不是发送。详见 PRD"明确不做"）

### 路径 3:Demo 直链(给投资人/家人看)

- `/tutorial/demo?case=wechat` — server 端 `redirect` 到生产路径
- `/risk-alert/demo?case=medical-sms` — 同上
- 安全:白名单 case + 仍走 `buildRouteForInput` 防绕过

## 状态变化

| 路由 | 状态 |
|---|---|
| `/` | `mode: 'idle' \| 'text'` + `textInput: string` + 语音 hook(`idle/listening/ending`) |
| `/confirm` | server-only,无 client state |
| `/tutorial` | `currentStepIndex: 0..n` + `showAlternative: bool` + `showResetWarning: bool` + 语速档位(`localStorage`) |
| `/risk-alert` | `copyState: 'idle' \| 'success' \| 'error'`(剪贴板反馈) |

**异常状态**:
- 语音不支持 → 显示"您的浏览器不支持语音输入,用打字告诉我吧" + 引导到文字按钮
- 剪贴板写入失败 → 显示"自动复制失败,长按下面的卡片内容选中" + `<details>` 预览可手动复制
- 教程没找到 → `/tutorial` 显示"暂时没有教程"页 + 返回首页按钮
- URL text 为空 → 兜底 redirect 到 `/`

**恢复路径**:任何异常都不丢数据,用户可点"返回首页"重新开始。

## 维护规则

- 改了用户路径(加/减一步),必须更新本文档
- 加新页面必须更新顶部 ASCII 流程图
- 异常状态变更后,同步更新"异常状态"段落
- 跑 `openprd diagram . --type product-flow --open` 重新生成可视化流程图
