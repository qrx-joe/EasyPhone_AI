# 前端开发规范

> OpenPrd 基线文档 · 项目级约定(细节见 docs/05-project-standards.md §5)
> 最近更新:2026-06-05

## 适用范围

本文档约束 **src/app/** 和 **src/lib/speech/** 下所有页面与组件的开发约定。
**src/domain/** 是纯逻辑(无 UI),不适用本文档。

## 界面结构

### 页面 = 路由

每个 URL 一个目录(server component) + 可选的 client component 后缀:

```
src/app/confirm/
  page.tsx              # server,读 ?text= + 渲染
  confirm-actions.tsx   # client,按钮交互
```

### 适老化设计原则(项目核心约束)

所有页面必须遵守:

| 项 | 要求 | 理由 |
|---|---|---|
| 主按钮 | `min-h ≥ 64px` | 老人手指粗,小按钮误触率高 |
| 字号 | `text-xl`(20px)起,标题 `text-3xl/4xl` | 老人视力下降 |
| 文字对比 | 用 `--color-foreground` vs `--color-muted`,**避免**浅灰 | 老人眼睛对低对比度敏感 |
| 单屏一动作 | 一次只显示 1-2 个主按钮 | 老人认知负担不能过载 |
| 错误提示 | **给下一步动作**,不用术语 | "麦克风没插好"而不是 "audio-capture error" |

### Design tokens(globals.css)

```
--color-primary        主操作(蓝)
--color-primary-hover
--color-primary-soft   浅蓝背景
--color-danger         危险(红)
--color-danger-soft    浅红背景
--color-soft           中性背景
--color-soft-hover
--color-foreground     主文字
--color-muted          副文字
--color-border         边框
```

## 交互规范

### 按钮状态

- 默认 → hover → active(scale 0.98/0.99)→ disabled(`bg-muted` + `cursor-not-allowed`)
- 关键按钮要文字反馈,不止颜色反馈(`color-blindness` 友好)
- 长操作要有 loading 反馈(本次 MVP 暂时无长操作,后续接 AI 时加)

### 适老化反馈

- **语音识别中**:按钮变红 + `animate-pulse` + 显示实时识别文本
- **复制成功**:按钮文字变 "✓ 已复制"(3 秒后回 idle)+ 下方提示"现在可以打开微信,长按输入框「粘贴」发给家人"
- **高风险**:大红色 "停" 标识 + 红色边框区块,**视觉上明显区别于低风险路径**
- **错误**:3 秒自动消失,不让老人看到错乱状态

### 空状态

- `/tutorial` 没匹配教程 → 显示"🤔 + 这个问题暂时没有教程 + 您的输入回显 + 建议换说法/问家人"
- 语音没听清 → "没听清您说什么,再试一次吧"(不用 alert,不用 toast 库,inline 显示)

### 路由约定

- 用户输入 → **统一走 `buildRouteForInput()`**(`src/domain/routing/user-routing.ts`)
- 这是**唯一**做"高风险不走 /confirm"分流的地方
- 新增入口(text / 语音 / demo / 未来 deep link)必须共用

## 维护规则

- 加新页面必须:
  1. 跑 `pnpm build` 确认 TS 通过
  2. 跑 `openprd dev-check . <new-page>`(OpenPrd 自带检查)
  3. 加对应的"文件说明书"在文件头部
- 改 design tokens 必须同步更新 `globals.css` + 本文件
- 加新交互模式(loading/skeleton/...)前先在本文档加章节,再写代码
- 跑 `openprd standards . --verify` 验证不变量
