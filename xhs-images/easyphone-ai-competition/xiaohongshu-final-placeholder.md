# 小红书发布材料（无 API Key 占位版）

> 这版可以直接发。注意：因为现在没有可用 Gemini API Key，文案里只写“Gemini 接入代码和设计已完成”，不写“Gemini 已成功给出建议”。

## 标题

我做了个 AI 手机助手：不只教爸妈操作，还会先劝他们停一下

## 图文顺序

1. `cards/01-xhs-card.png`
2. `cards/02-xhs-card.png`
3. `cards/03-xhs-card.png`
4. `cards/04-xhs-card.png`
5. `cards/05-xhs-card.png`
6. `cards/06-xhs-card.png`
7. `cards/07-xhs-card.png`

## 正文

这次参赛，我没做“什么都能聊”的助手，只盯着一个场景：海外华人爸妈遇到手机问题时，常常只问一句：“这个能不能点？”“验证码要不要发？”“微信怎么没声音了？”

银行短信、政府服务、WhatsApp 提醒常是英文，家里沟通又是中文。普通设置问题和诈骗风险混在一起，子女也不一定随时在旁边。

所以我做了 EasyPhone AI。它不会替爸妈操作手机，而是先判断这件事能不能继续。普通问题，比如微信没声音，就用大字、短句、一次一步慢慢教；一旦碰到转账、OTP、验证码、陌生链接、屏幕共享、远程控制，就停止指导，提醒找家人或官方渠道确认，并生成家人求助卡。

参赛版里，Google Gemini 的位置是：复检本地关键词可能漏掉的中英混合风险表达；把长者说得有点乱的问题整理成家人能看懂的求助说明。但本地规则永远优先，Gemini 只能升级风险，不能降级；超时或格式异常就退回固定规则。

目前原型已跑通文字/语音入口、分步教程、风险拦截、家人求助卡、Gemini API 接入代码和降级逻辑。测试 211 项，210 通过，0 失败，1 项 WCAG AAA 颜色目标跳过；生产构建通过。

也说清楚：我现在没有可用 Gemini API Key，真实成功输出先占位。AI Studio 提示需要设置结算，所以不能写成“Gemini 已给建议”。这点宁愿写笨，也别写虚。

GitHub：  
https://github.com/qrx-joe/EasyPhone_AI/tree/contest/google-ai-vibeathon-2026

在线 Demo：  
https://easy-phone-ai-git-contest-google-ai-vi-c361ce-qrx-joes-projects.vercel.app

#GDG出海创想赛 #Google开发者大会 #GoogleAI #VibeCoding #科技向善 #适老化 #出海产品

## 报名表填写提醒

- 赛道：善 · 守护需要守护的人
- 项目名称：EasyPhone AI
- 项目简介：面向海外华人长者的手机安全助手。普通问题一步一步教，高风险场景先停下，并生成家人求助卡。
- Google AI 使用说明：已完成 Gemini API 接入代码、结构化输出设计和失败降级逻辑；因暂无可用 API Key，真实 API 成功输出暂未补齐，目前以 AI Studio 尝试截图和代码证据占位。
- 作品链接：填写 GitHub 分支和在线 Demo。
- 小红书链接：发布后再填。

## 发布前别踩坑

- 不要写“Gemini 已成功给出建议并被采纳”。
- 不要写“已在新加坡落地”。
- 不要写“已有用户规模/准确率/100% 防诈骗”。
- 不要展示 API Key、账号、手机号、真实短信或真实联系人信息。
- 需要确认报名表在 2026-07-15 截止后是否仍可提交。
