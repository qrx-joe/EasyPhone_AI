<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Project: 爸妈别急 / EasyPhone AI

> 老人手机教练。低风险一步一步教，高风险立刻停下来 + 家人求助卡。
> 完整 PRD：[docs/00-prd-cn-authoritative.md](docs/00-prd-cn-authoritative.md)

## 状态（最近更新 2026-06-05）

- **M0** 项目初始化 ✅
- **M1** 核心领域模型 ✅（risk / question / tutorial / help / routing）
- **M2** 首页与输入流程 ✅
- **M3** 低风险分步指导 ✅
- **M4** 高风险中断 + 家人求助卡 ✅
- **M5** AI 接入（待 API key，P2）
- **M6** Demo 打磨（README ✅，部署待账号）

详情见 [docs/06-development-plan.md](docs/06-development-plan.md)。

## 给 Agent 的硬性约束

### 安全不变量（PR 必过）

改这些文件时**必须保留不变量**，对应测试会卡住：

- `src/domain/routing/user-routing.ts` —
  `buildRouteForInput()` 是**唯一**做"高风险不走 /confirm"分流的地方。
  多个入口（首页文本 / 语音输入 / Demo 直链）共用同一份逻辑。
  → 12 个测试覆盖 4 个风险等级分支
- `src/domain/risk/classify-risk.ts` —
  多关键词命中**永远**取 `MAX(level)`，不平均、不取第一个。
  注释里叫"安全保险丝"。
  → 16 个验收用例
- `src/domain/help/help-templates.ts` —
  求助卡不教"把验证码发给我"等给出去模式。
  → "教给出去" lint 测试覆盖

### 行为守则

- 写代码前先 Read 完整文件（`limit` 只用于已知结构时跳读）—— 否则会基于片面信息误判 bug
- 不用 any；unknown 收敛后 narrow
- 不用 emoji 当 UI 主标签（适老化：emoji 老人识别度低，文字优先）
- 不接 AI API（除非显式要求）—— M5 才接
- 教程扩库按 [docs/07](docs/07-risk-keywords-library.md) §11 三道闸，不凭想象写关键词

## 命令速查

```bash
pnpm dev          # 开发 (localhost:3000)
pnpm build        # 生产构建
pnpm test         # 跑所有测试
```

## 目录速查

```
src/
  app/         # 页面 (App Router)
  domain/      # 纯领域逻辑（可单测）
  lib/speech/  # Web Speech API 封装
docs/          # PRD / 规范 / 决策
```

## 不在本项目范围内

- 真实微信/短信/通讯录读取
- 远程控制
- 支付/医保/金融真实操作
- Android 无障碍自动操作

详细见 [docs/06](docs/06-development-plan.md) §6 P3。
