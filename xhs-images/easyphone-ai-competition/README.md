# EasyPhone AI 小红书参赛图片包

生成时间：2026-07-16

## 可直接使用的图卡

位置：`cards/`

- `01-xhs-card.png`：封面，项目定位与赛道
- `02-xhs-card.png`：海外华人家庭真实痛点
- `03-xhs-card.png`：产品闭环与低风险教学路径
- `04-xhs-card.png`：Google AI 证据现状
- `05-xhs-card.png`：安全设计边界
- `06-xhs-card.png`：当前可运行成果
- `07-xhs-card.png`：提交材料与链接

## 原始截图

位置：`raw-screenshots/`

- `01-home.png`：线上 Preview 首页截图
- `02-tutorial-wechat.png`：390 宽教学页截图，存在横向裁切，仅作过程留档
- `02-tutorial-wechat-wide.png`：教学页宽版截图，已用于图卡
- `03-risk-bank.png`：银行风险拦截图
- `04-risk-whatsapp.png`：WhatsApp 风险拦截图
- `05-ai-studio-internal-error.png`：AI Studio 真实审查尝试失败截图，已裁掉左侧账号导航

## 不能夸大的地方

- AI Studio 已提交审查 prompt，但两次返回 `An internal error has occurred.`，不能写成 Gemini 已成功给出建议。
- Gemini API 接入代码已完成，但最终提交前还需要配置 `GEMINI_API_KEY` 后运行 `pnpm smoke:gemini`，拿到真实成功输出。
- 不要声称已在新加坡落地、已有用户规模、已有准确率数据或 100% 防诈骗。

## 发布前最后补齐

1. 跑通 `pnpm smoke:gemini` 并保存脱敏终端截图。
2. 将第 4 张图卡和小红书正文中的“待补齐”改为真实成功结果。
3. 在小红书发布后，把笔记链接填进报名表。
4. 确认 2026-07-15 截止后报名表是否仍接受补交。
