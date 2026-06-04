# 文件夹说明书

## 核心功能
语音输入 + 语音播报 + 语速档位的浏览器 API 适配层(typed 严格 + 跨浏览器兼容 + 中文错误文案 + 适老化降级)。

## 输入
- 浏览器 `window.SpeechRecognition` / `webkitSpeechRecognition`(recognition)
- 浏览器 `window.speechSynthesis`(synthesis)
- 浏览器 `window.localStorage`(语速持久化,key: `easyphone.speech.rate`)

## 输出
- `web-speech.ts` — `isSpeechRecognitionSupported()` / `defaultSpeechRecognitionFactory(lang)` / `explainSpeechError(code)` + 类型。
- `speech-synthesis.ts` — `isSpeechSynthesisSupported()` / `cancelSpeech()` / `speak(opts)` 返回 cancel 闭包。
- `use-speech-recognition.ts` — `useSpeechRecognition(opts)` React hook,状态机 idle/listening/ending + interim transcript + 中文错误 3s 自动清空。
- `voice-input-button.tsx` — `VoiceInputButton` 首页「按住说话」按钮,onFinal 走 `routeToInput`。
- `speak-button.tsx` — `SpeakButton` 「🔊 念给我听」按钮,unmount 与 text 变化时自动 cancel。
- `speech-rate.tsx` — `useSpeechRate()` hook + `<SpeechRateControl />` 3 档 radiogroup + `SPEECH_RATE_OPTIONS` 档位常量。

## 定位
浏览器语音能力的统一适配层 + 适老化 UI 组件库;底层 typed 封装,上层 React 组件;不被任何 domain 模块依赖(只被 `app/` 调用)。

## 依赖
- 浏览器 Web Speech API(全局),无外部 npm 包。
- `react` hooks、`next/navigation`(useRouter,仅 `voice-input-button`)、`@/domain/routing/user-routing`(仅 `voice-input-button`)。

## 维护规则
- 每次新增、删除、移动文件或调整职责后,必须检查并更新本 README。
- 文件夹职责影响项目基础文档时,必须同步更新 `docs/basic/`。
- 改默认 rate(适老化 0.85)要走 A/B 验证;改默认 lang 同步 review `docs/05 §2.1` 语音识别必须有文本兜底。
- 改 explain 文案要由 UX 走查(适老化:不甩锅、给下一步动作);改档位值要 e2e 跑 iOS Safari / 微信浏览器(SpeechSynthesis 行为差异);改 storage key 要做一次数据迁移。
- 复制失败时**隐藏** SpeakButton 按钮(`unsupported` 直接 return null),不显示无效控件。
