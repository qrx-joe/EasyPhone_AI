# Google AI 使用证据说明

## 已核实的代码证据

- 模型：`gemini-3.5-flash`。
- 接口：服务端 REST `models/{model}:generateContent`。
- 鉴权：`x-goog-api-key`，密钥不下发浏览器。
- 结构化输出：`responseMimeType: application/json` 和 `responseSchema`。
- 接入点一：对本地规则判断为 LOW 的输入进行语义风险复检；Gemini 只能升级风险。
- 接入点二：把长者的模糊描述改写为家人可读的求助说明。
- 降级：超时、HTTP 错误、JSON 异常或业务校验失败时回到规则与固定模板。

Google 官方文档显示 `gemini-3.5-flash` 是稳定模型并支持结构化输出：

- <https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash>
- <https://ai.google.dev/gemini-api/docs/generate-content/structured-output>

## 真实联调状态

2026-07-15 已运行 Google 官方 Gemini CLI 0.50.0。CLI 能启动，但两次非交互审查均因未配置 CLI 认证方式而退出，错误码为 41。AI Studio 网页登录不能自动替代 CLI 认证。

因此当前只能声明“Gemini 接口代码已实现并通过模拟响应测试”，不能声明“真实 Gemini API 联调通过”。

## AI Studio 真实迭代提示词

把下面内容粘贴到已登录的 AI Studio。无需上传仓库或密钥，只需把这 4 个文件内容作为上下文：

- `src/lib/ai/gemini-client.ts`
- `src/lib/ai/risk-recheck.ts`
- `src/lib/ai/help-summary.ts`
- 相关测试文件

```text
你正在审查 EasyPhone AI 的海外华人长者手机安全分流。

请重点检查四类中英混合风险输入：
1. 英文银行短信要求点击链接；
2. 对方索要 OTP 或验证码；
3. WhatsApp 陌生人要求共享屏幕；
4. 冒充亲属要求紧急转账。

硬性边界：本地规则给出的风险只能保持或升级，Gemini 不能降级；模型超时、返回异常或业务校验失败时必须回到规则与模板。

请只输出：
A. 3 个当前可能漏掉的中英混合测试输入；
B. 每个输入的预期 action 与一句理由；
C. 最值得增加的一项测试；
D. 不要声称你运行过代码。
```

完成后保存 3 张截图：完整任务、Gemini 回复、采纳建议后的测试差异。截图中不要出现账号、项目编号或密钥。

## API 烟雾测试

设置环境变量后执行：

```powershell
$env:GEMINI_API_KEY='在 Google AI Studio 创建的 Key'
pnpm smoke:gemini
Remove-Item Env:GEMINI_API_KEY
```

命令只输出模型、端点、输入哈希、输入长度、结构化决策、延迟和时间；不会输出 Key 或测试原文。成功标准：

- 进程退出码为 0；
- `provider` 为 `Google Gemini API`；
- `action` 为 `escalate`；
- `apiKeyLogged` 和 `inputLogged` 都为 `false`。

把终端结果截图后立即清除环境变量。不要把 `.env.local`、终端历史中的 Key 或 AI Studio Key 页面放进素材。

