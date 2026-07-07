# 文件夹说明书

## 核心功能
App 磁贴图标 —— 模拟手机桌面 App 图标的彩色圆角方块（微信/短信/WhatsApp/系统设置）。老人认 App 靠桌面图标的颜色块，磁贴提升「说的是哪个 App」的识别度。

## 输入
- `props.app`：`TutorialApp`（`'wechat' | 'sms' | 'whatsapp' | 'system'`，来自 `@/domain/tutorial/tutorial`）
- `props.size`：`'md'`（48px，列表项）| `'sm'`（36px，卡片标题旁），默认 `'md'`
- `props.className`：可选额外类名

## 输出
- `app-icon.tsx` — 导出 `AppIcon`，一个装饰性彩色磁贴 `span` + 内嵌白色 SVG 图形；无交互、无 state。`aria-hidden`，语义永远由旁边文字承载（适老铁律）。

## 定位
**纯展示组件**，永远作为文字标签的辅助出现。App 归属信息来自领域层 `Tutorial.app` 字段，不在 UI 层各自维护映射副本。被 `src/app/page.tsx`（快捷入口磁贴 + 高风险「!」角标）和 `src/app/tutorial/tutorial-client.tsx`（步骤标题旁磁贴）调用。

## 依赖
- `@/domain/tutorial/tutorial` 的 `TutorialApp` 类型
- 新增 App：先在 domain 的 `TutorialApp` 加字面量，再在本组件 `TILE_BG` + `AppGlyph` 补磁贴；两处不同步时 `tutorial.test.ts` 的 app 字段测试会卡住

## 已知权衡
- 微信/短信/WhatsApp 真实品牌色都是绿色，磁贴靠颜色块无法区分这三者，识别实际依赖内部白色 SVG 图形（22-28px）。Demo/比赛可接受；商用前需评估。
- 微信/WhatsApp 图形是仿制轮廓，**商用/上架前必须**换成官方 brand assets 或抽象化处理（商标风险）。集中在本组件，一键可换。
