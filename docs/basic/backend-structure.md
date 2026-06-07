# 后端架构设计

> OpenPrd 基线文档
> 最近更新:2026-06-05

## 适用范围

EasyPhone_AI MVP **没有独立后端服务**。所有业务逻辑(风险判断、教程匹配、求助卡生成)都在 **src/domain/** 下以纯函数形式跑在 Next.js Server Components 里。

本文档说明"为什么没有后端"和"未来什么时候需要后端"。

## 服务边界

**当前边界**:

```
[浏览器]
  │
  ├── / 首页(语音/文字输入)
  │      └─→ buildRouteForInput() 跑在 client (import 关键词库)
  │
  ├── /confirm     Server Component(读 ?text=)
  ├── /tutorial    Server Component(读 ?text= → findTutorial)
  ├── /risk-alert  Server Component(读 ?text= → 重新跑分类 → buildHelpRequest)
  │
  └── /tutorial/demo, /risk-alert/demo  Server Component(白名单 case + redirect)
```

**没有的服务**:
- ❌ 用户账号系统(MVP 匿名)
- ❌ 持久化存储(localStorage 仅前端,且 MVP 不用)
- ❌ 消息队列
- ❌ 外部 API 调用(M5 之前)

## CLI 接入面

**当前**:**不适用**。

`@openprd/cli` 本身是开发工具(本项目用 `.openprd/init` 装了),不是给最终用户用的 CLI。

`android-apk/build-apk.ps1` 是开发/发布辅助脚本,只用于生成 Android TWA APK 外壳；它不是终端用户 CLI,也不承载业务逻辑。

**未来**:
- 如果要做"老人端家长控制"(家人端给老人预置教程),可能需要 CLI 工具
- 当前不在 MVP 范围

## API 接入面

**当前**:**不适用**。

没有 HTTP / RPC / WebSocket 接口。所有处理都在 Next.js Server Component 内。

Android APK 方案采用 TWA 包装已部署的 HTTPS Web App,不新增 Android 原生 API 接入面,不新增短信、通讯录、定位、无障碍、支付或远程控制权限。

**未来(M5)**:
- 接 LLM API 做更准的分类/求助卡生成
- 接入面:`/api/classify`(POST text → RiskClassification + HelpRequest)
- 见 `.openprd/specs/m5-ai-integration.md`(待 freeze)

## 数据流

**当前 MVP 数据流**(`buildRouteForInput` 是唯一分流点):

```
[用户输入: text / voice 转写 / demo 预设]
   │
   ▼
buildRouteForInput(text)               ← 纯函数,跑在 client (首页) 或 server (demo)
   │
   ├─ 空文本 → redirect '/'
   │
   ├─ high/critical (shouldStopGuidance true)
   │     │
   │     ▼
   │   /risk-alert?text=&level=&keywords=&reason=
   │     │
   │     ├─ server 端再次跑 classifyRiskByRules(text) 防 URL 篡改
   │     │   (URL 里的 level/keywords/reason 只是 hint,实际以 server 端为准)
   │     ├─ createQuestion(text, 'text', risk)
   │     ├─ buildHelpRequest(question)         ← 模板按 level 选 suggestions
   │     └─ <RiskAlertClient help={help}>     ← 渲染 + 复制 + 模拟发送
   │
   └─ low/medium
         │
         ▼
       /confirm?text=...
         │
         │ 老人点「是的,继续」或 demo 直链
         ▼
       /tutorial?text=...
         │
         └─ findTutorial(text) → 匹配 TUTORIALS 库
                                (找不到 → NoTutorialFound 兜底页)
```

**关键数据约束**(同 docs/05 §3.4 数据最小化):
- **不保存**:原始语音、验证码、银行卡号、身份证号、支付密码、通讯录、短信、定位
- **不传输到外部**:M5 之前所有处理都在本机,M5 接 LLM 时只传 question.text(不含个人信息)
- **不跨会话记忆**:每次进首页都是新会话(MVP 没账号)

## 维护规则

- 加任何"看起来像后端"的代码,先回答:**真的需要吗?** 80% 情况下不需要
- 接外部 API 之前,先:
  1. 写 spec 到 `.openprd/specs/`
  2. 跑 `openprd freeze`
  3. 评估安全/隐私影响(见 docs/05 §3.4 数据最小化)
- 加 server-side 持久化前,先评估 localStorage 是否够用
- 跑 `openprd run . --verify` 确认架构决策与代码一致
