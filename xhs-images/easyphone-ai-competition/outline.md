# 7 页图卡大纲

## Page 1 — cover

- 标题：会教手机，也会劝你先停下
- 副标题：EasyPhone AI × Google Gemini
- 素材：`01-home.png`
- 构图：手机截图占左侧 58%，标题在右上，底部一行价值说明。

## Page 2 — pain

- 标题：爸妈只问“这个能不能点？”
- 要点：英文银行短信 / OTP / WhatsApp 共享屏幕 / 亲属紧急转账
- 素材：四个简洁文字气泡；注明“代表性测试场景”。

## Page 3 — flow

- 标题：先判断该不该继续
- 流程：说出问题 → 规则分流 → 一次一步 / 停止指导 → 家人求助
- 素材：`02-tutorial.png` 与 `03-risk-bank.png`

## Page 4 — gemini

- 标题：Gemini 做两件核心的事
- 要点：语义风险复检；求助说明改写；只能升不能降
- 素材：`04-gemini-process.png` 与代码局部截图

## Page 5 — safety

- 标题：安全不能全交给模型
- 要点：规则优先 / 严格 JSON / 超时降级 / 日志不存原文
- 素材：结构化 Schema 与 fail-open 代码局部截图

## Page 6 — result

- 标题：一条教程，一次拦截
- 素材：`02-tutorial.png`、`03-risk-bank.png`、`05-help-card.png`、`06-tests.png`
- 数据：211 项；210 通过；0 失败；1 跳过

## Page 7 — boundary

- 标题：先把文字安全链路跑稳
- 已完成：文字/语音、分步教程、风险拦截、家人求助卡
- 下一步：截图识别与更完整的新加坡本地化验证
- 素材：GitHub、Preview 短链接或二维码

## 必须采集的真实截图

| 文件名 | 页面或来源 |
|---|---|
| `01-home.png` | Preview 首页，390 × 844 移动端 |
| `02-tutorial.png` | `/tutorial/demo?case=wechat` |
| `03-risk-bank.png` | `/risk-alert/demo?case=overseas-bank` |
| `04-gemini-process.png` | AI Studio 任务与回复，账号信息遮盖 |
| `05-help-card.png` | 高风险页中的家人求助卡 |
| `06-tests.png` | 测试汇总末尾与生产构建成功 |

