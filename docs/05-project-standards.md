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

