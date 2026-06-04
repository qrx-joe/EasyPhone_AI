# EasyPhone AI PRD

> Chinese Subtitle: 爸妈别急  
> Version: v1.0  
> Project Type: AI Voice Phone Coach for Low-Literacy Seniors  
> Target Event: UCWS Singapore 2026 Hackathon  
> Recommended Track: Agent / Application  

---

## 1. Product Overview

### 1.1 Product Name

**EasyPhone AI**

Chinese subtitle:

**爸妈别急**

### 1.2 One-Line Pitch

**EasyPhone AI is an AI voice phone coach for low-literacy seniors. It guides safe phone tasks step by step, and stops risky actions such as verification codes, transfers, unknown links, and screen sharing before scams happen.**

中文一句话：

**EasyPhone AI / 爸妈别急，是一个给低识字中老年人的 AI 语音手机教练：普通问题一步一步教，遇到验证码、转账、陌生链接和屏幕共享，先停下来，找家人确认。**

### 1.3 Product Positioning

EasyPhone AI is not a general chatbot, not a tutorial app, and not a remote-control tool.

It is a **voice-first, safety-aware AI assistant** designed for elderly users who struggle with smartphone usage.

It helps seniors:

- ask phone-related questions by voice;
- understand what is happening on their phone;
- follow one simple step at a time;
- stop before risky actions;
- ask family members for help when needed.

### 1.4 Core Product Belief

Most AI assistants try to answer everything.

**EasyPhone AI is different: it knows when not to continue.**

For low-risk tasks, it teaches slowly.

For high-risk tasks, it stops immediately and asks the user to confirm with family.

---

## 2. Problem Background

Smartphones have become the entrance to daily life: messaging, payment, healthcare, travel, banking alerts, video calls, government services, and family communication.

However, for low-literacy or digitally inexperienced seniors, smartphones are often stressful and risky.

They may not know:

- how to type or search;
- how to describe a phone problem;
- what pop-ups mean;
- which buttons are safe;
- whether a message is real or fraudulent;
- whether they should enter a verification code;
- whether screen sharing or remote control is dangerous.

At the same time, adult children often become the family’s remote tech support. But phone calls are inefficient because seniors may say things like:

> “My phone is broken again.”  
> “It keeps asking me to click something.”  
> “Someone told me to give them a code.”

The child often cannot understand the exact problem, and the senior may already be in a risky situation.

---

## 3. Target Users

### 3.1 Primary User: Low-Literacy Seniors

| Attribute | Description |
|---|---|
| Age | 55+, especially 60+ |
| Digital Ability | Can make calls, use WeChat voice, watch short videos, but struggles with settings and pop-ups |
| Literacy Level | Low literacy, no literacy, or uncomfortable reading long text |
| Input Preference | Voice-first, not typing |
| Typical Problems | WeChat has no sound, font too small, phone storage full, suspicious SMS, verification code requests |
| Core Need | Someone to explain slowly, step by step, and stop them before dangerous actions |

### 3.2 Secondary User: Adult Children

| Attribute | Description |
|---|---|
| Age | 25–45 |
| Role | Remote family tech support |
| Pain Point | Parents cannot clearly describe phone problems |
| Core Need | Quickly understand what happened and intervene in high-risk cases |

### 3.3 Potential Institutional Users

- Community service centers;
- elderly education programs;
- anti-fraud education campaigns;
- public welfare digital literacy programs;
- telecom or smartphone service providers.

---

## 4. Core User Problems

### 4.1 Seniors Cannot Ask Questions Clearly

They may not know technical terms such as:

- notification settings;
- auto-renewal;
- permissions;
- storage cleanup;
- scam link;
- screen sharing.

They describe problems in daily language:

> “It does not ring anymore.”  
> “It says I won a prize.”  
> “It asks me to put in a number.”

### 4.2 Seniors Cannot Follow Long Tutorials

Traditional tutorials are usually text-heavy, visually complex, and full of technical terms.

Low-literacy seniors need:

- large text;
- spoken instructions;
- one step at a time;
- repeated explanations;
- non-technical wording.

### 4.3 Seniors Are Vulnerable to Phone Scams

High-risk scenarios include:

- verification codes;
- bank cards;
- money transfers;
- unknown links;
- fake medical insurance messages;
- fake customer service;
- screen sharing;
- remote control;
- investment or refund scams.

### 4.4 Adult Children Cannot Help Efficiently

Children often cannot see the screen and cannot understand what parents are describing. They need a clear summary, risk level, and recommended action.

---

## 5. Product Goals

### 5.1 User Goals

EasyPhone AI should help seniors:

1. ask phone problems by voice;
2. understand whether the problem is safe or risky;
3. complete low-risk phone tasks step by step;
4. stop before high-risk actions;
5. generate a clear help request for family members.

### 5.2 Hackathon Goals

The hackathon MVP should demonstrate a complete AI Agent flow:

```text
Voice Input
→ Problem Understanding
→ Risk Classification
→ Safe Step-by-Step Guidance
→ Risk Interruption
→ Family Help Request
```

### 5.3 Non-Goals

The MVP will not:

- control the phone remotely;
- read SMS automatically;
- read contacts;
- request location;
- store sensitive screenshots;
- guide users to transfer money;
- guide users to enter verification codes;
- guide users to download unknown apps;
- make financial, medical, or legal decisions;
- create an open community for seniors.

---

## 6. MVP Scope

### 6.1 Must-Have Features

The first MVP includes five core features:

1. **Voice Question Input**  
   Seniors press a large button and describe their phone problem by voice.

2. **Problem Understanding and Classification**  
   AI identifies the user’s intent and classifies the issue.

3. **Risk Detection**  
   AI checks whether the issue contains risky elements such as verification codes, transfers, screen sharing, or unknown links.

4. **Step-by-Step Voice Guidance**  
   For low-risk tasks, AI gives one simple step at a time with large text and voice playback.

5. **Family Help Request**  
   For high-risk or unclear situations, AI generates a clear message for the user’s family.

### 6.2 Nice-to-Have Features

If time allows:

- screenshot upload with sensitive information warning;
- tutorial library for common phone tasks;
- simulated family-side dashboard;
- voice speed control;
- dialect-friendly prompt interface;
- copy/share help request card;
- browser TTS replay button.

### 6.3 Out of Scope for MVP

- real WeChat integration;
- real SMS reading;
- real contact import;
- Android accessibility automation;
- payment or banking operations;
- open community answers;
- remote control;
- long-term account system.

---

## 7. Core User Flow

### 7.1 Low-Risk Flow

Example: “WeChat has no sound.”

```text
Senior opens EasyPhone AI
→ taps “Speak Now”
→ says: “WeChat has no sound.”
→ AI transcribes and confirms the problem
→ AI classifies it as low-risk
→ AI gives Step 1 with voice
→ senior says or taps “Done”
→ AI gives Step 2
→ task completed
```

### 7.2 High-Risk Flow

Example: “A message says my medical insurance card is blocked and asks me to enter a verification code.”

```text
Senior opens EasyPhone AI
→ taps “Speak Now”
→ describes suspicious message
→ AI detects high-risk keywords
→ AI stops normal guidance
→ AI says: “Do not click the link. Do not enter the code.”
→ AI generates a family help request
→ senior copies or shares the message
```

---

## 8. Core Features

## 8.1 Feature 1: Voice Question Input

### Description

The senior can ask a phone-related question using voice instead of typing.

### Entry Copy

English:

> Tell me what happened. I will guide you slowly.

Chinese:

> 慢慢说，哪里不会，我一步一步教你。

### User Examples

- “WeChat has no sound.”
- “The words are too small.”
- “My phone says storage is full.”
- “Someone asked me to give them a verification code.”
- “A message says my medical insurance card is blocked.”
- “They asked me to open screen sharing.”

### Acceptance Criteria

- User can start voice input from the homepage;
- system shows the transcribed text;
- user can confirm or retry;
- low-risk tasks enter step guidance;
- high-risk tasks enter risk interruption.

---

## 8.2 Feature 2: Problem Confirmation

### Description

Before giving instructions, AI confirms whether it understood the problem correctly.

### Example

> Are you trying to fix: WeChat has no sound?

Chinese:

> 你是不是想解决：微信没有声音？

Buttons:

- Yes;
- Say again;
- Ask family.

### Design Rationale

Low-literacy seniors may describe problems vaguely, and speech recognition may be imperfect. Confirmation reduces wrong instructions.

---

## 8.3 Feature 3: Step-by-Step Voice Guidance

### Description

For low-risk tasks, AI provides one step at a time.

### Example: WeChat Has No Sound

Step 1:

> Open WeChat first. After opening it, tap “Done”.

Chinese:

> 先打开微信。打开以后，点“好了”。

If the user taps “I can’t find it”:

> WeChat is the green icon with two white chat bubbles.

Chinese:

> 微信是绿色图标，里面有两个白色小气泡。

### User Feedback Options

| User Feedback | System Response |
|---|---|
| Done | Go to next step |
| I can’t find it | Explain in another way |
| Repeat | Replay current step |
| I tapped wrong | Give recovery instruction |
| Ask family | Generate help request |

### Acceptance Criteria

- Only one step is shown at a time;
- each step is short and easy to read;
- each step can be played as voice;
- user can proceed, repeat, or ask family;
- no high-risk operation is included in normal guidance.

---

## 8.4 Feature 4: Risk Detection and Interruption

### Description

When AI detects a high-risk scenario, it stops normal guidance immediately.

### High-Risk Keywords

- verification code;
- bank card;
- transfer;
- remittance;
- unknown link;
- QR code;
- screen sharing;
- remote control;
- customer service refund;
- medical insurance abnormality;
- social security abnormality;
- loan;
- investment;
- prize winning;
- ID card;
- payment password.

### Risk Levels

| Risk Level | Description | System Action |
|---|---|---|
| Low | Normal settings or usage issue | Step-by-step guidance |
| Medium | May involve permissions, fees, or account settings | Give caution before guidance |
| High | Involves money, codes, links, account safety | Stop guidance and ask family |
| Critical | Transfer, screen sharing, remote control, payment password | Strong stop message only |

### High-Risk Warning Copy

English:

> Stop for a moment. This may be risky.  
> Do not transfer money.  
> Do not tell anyone your verification code.  
> Do not click unknown links.  
> Do not open screen sharing.  
> I can help you ask your family first.

Chinese:

> 先别急，这个可能有风险。  
> 不要转账。  
> 不要告诉别人验证码。  
> 不要点陌生链接。  
> 不要打开屏幕共享。  
> 我可以帮你发给家人看看。

### Acceptance Criteria

- High-risk keywords are detected reliably;
- high-risk cases do not enter normal guidance;
- system gives clear stop instructions;
- user can generate a family help request.

---

## 8.5 Feature 5: Family Help Request

### Description

AI turns the senior’s unclear or risky description into a concise message that family members can understand.

### Example

Senior says:

> “A message says my medical insurance card is blocked and asks me to click a link.”

Generated message:

> Mom/Dad received a suspicious medical insurance message. The message asks them to click a link and may require personal information or verification codes.  
> Risk Level: High.  
> Suggested Action: Please ask them not to click the link, not to enter any ID number, bank card number, or verification code, and help verify through the official channel.

Chinese version:

> 爸爸/妈妈收到一条疑似医保异常短信，短信中要求点击链接处理。  
> 风险等级：高。  
> 建议先不要点击链接，不要输入身份证号、银行卡号或验证码。请你帮忙确认是否为官方医保渠道通知。

### MVP Implementation

No real messaging API is required in the first version. The MVP only needs:

- copy button;
- save as card;
- simulated send button;
- optional family-side preview.

---

## 9. Built-In Demo Scenarios

The hackathon demo should focus on three scenarios.

### 9.1 Scenario 1: WeChat Has No Sound

Goal:

Show low-risk voice guidance.

Flow:

```text
Voice question
→ AI confirmation
→ Low-risk classification
→ Step-by-step guide
→ User completes one or two steps
```

### 9.2 Scenario 2: Font Is Too Small

Goal:

Show accessibility and elderly-friendly interaction.

Flow:

```text
Voice question
→ AI confirms “make phone text bigger”
→ step-by-step large-text guidance
→ voice playback
```

### 9.3 Scenario 3: Medical Insurance Scam / Verification Code

Goal:

Show the strongest product value: risk interruption.

Flow:

```text
Voice question
→ AI detects high risk
→ stops normal instructions
→ warning page
→ family help request
```

This should be the key moment of the demo.

---

## 10. Information Architecture

### 10.1 Senior Side

```text
Home
├── Speak Now
│   ├── Voice Input
│   ├── Problem Confirmation
│   ├── Low Risk: Step Guide
│   └── High Risk: Risk Warning
├── Teach Me
│   ├── Common Task List
│   └── Step Guide
└── Ask Family
    ├── Help Request Generator
    └── Copy / Save / Simulate Send
```

### 10.2 Admin / Demo Side

```text
Demo Console
├── Question Records
├── Risk Classification Result
├── Tutorial Library
├── AI Output JSON
└── Family Message Preview
```

---

## 11. Page Design Requirements

## 11.1 Homepage

### Goal

The senior should understand within 10 seconds:

> “If I don’t know how to use my phone, I can press here and speak.”

### Elements

- product name: EasyPhone AI;
- Chinese subtitle: 爸妈别急;
- large microphone button;
- secondary button: Ask Family;
- voice explanation button;
- no feed, no ads, no complex icons.

### Main Copy

> Don’t worry. Speak slowly. I will guide you step by step.

Chinese:

> 别着急，慢慢说，我一步一步教你。

---

## 11.2 Problem Confirmation Page

### Goal

Confirm the AI understanding before giving instructions.

### Example

> Are you trying to fix: WeChat has no sound?

Buttons:

- Yes;
- Say again;
- Ask family.

---

## 11.3 Step Guide Page

### Goal

Let the senior focus on one action at a time.

### Elements

- step number;
- large step text;
- voice playback button;
- Done button;
- I can’t find it button;
- I tapped wrong button;
- Ask family button.

---

## 11.4 Risk Warning Page

### Goal

Stop dangerous behavior immediately.

### Elements

- large warning title;
- short safety instructions;
- voice playback;
- Ask family button;
- Return home button.

Tone:

Calm, firm, not frightening.

---

## 11.5 Family Help Request Page

### Goal

Convert unclear senior speech into a clear family-readable message.

### Elements

- issue summary;
- risk level;
- recommended family action;
- copy button;
- save card button;
- simulated send button.

---

## 12. AI Agent Design

### 12.1 Agent Role

The AI acts as a safety-aware phone coach for low-literacy seniors.

It must:

- use simple words;
- use short sentences;
- give one step at a time;
- avoid technical terms;
- confirm before guiding;
- stop high-risk actions;
- never guide transfers, verification codes, screen sharing, or unknown downloads.

### 12.2 AI Input

```json
{
  "transcript": "老人语音转写文本",
  "current_step": "当前步骤，可为空",
  "user_feedback": "done / cannot_find / tapped_wrong / repeat / ask_family",
  "scenario_source": "voice / tutorial_library / family_help"
}
```

### 12.3 AI Output

```json
{
  "category": "wechat_notification",
  "risk_level": "low",
  "confirmed_question": "你是不是想解决：微信没有声音？",
  "should_stop": false,
  "reason": "普通手机设置问题，不涉及钱、验证码或陌生链接",
  "steps": [
    {
      "step_index": 1,
      "step_text": "先打开微信。打开以后，点“好了”。",
      "fallback_text": "微信是绿色图标，里面有两个白色小气泡。",
      "voice_text": "先打开微信。打开以后，点好了。"
    }
  ],
  "risk_warning": "",
  "family_message": ""
}
```

### 12.4 System Prompt Draft

```text
You are EasyPhone AI, a safety-aware voice phone coach for low-literacy seniors.

Your user may not be able to type, search, or read complex instructions. You must use short sentences, simple words, and step-by-step guidance.

Rules:
1. Always explain one step at a time.
2. Keep each instruction under 20 Chinese characters when possible.
3. Avoid technical terms.
4. If the user says they cannot find something, explain it visually and simply.
5. If the user says they tapped the wrong thing, help them safely go back.
6. If the issue involves verification codes, bank cards, transfers, unknown links, QR codes, screen sharing, remote control, refunds, loans, investment, medical insurance abnormality, social security abnormality, ID cards, or payment passwords, stop immediately.
7. Never instruct the user to transfer money, enter a verification code, share their screen, provide a payment password, download an unknown app, or click an unknown link.
8. For high-risk cases, generate a calm warning and a family help request.
9. Do not provide financial, medical, or legal decisions.
10. When uncertain, choose safety and ask the user to contact family or official channels.

Return structured JSON only.
```

---

## 13. Safety and Privacy Design

### 13.1 Privacy Principles

The MVP follows data minimization.

It does not:

- require phone number registration by default;
- read contacts;
- read SMS;
- request location;
- store sensitive screenshots;
- store raw audio by default;
- display external links;
- expose user content to a public community.

### 13.2 Sensitive Information Reminder

Before voice input:

> Please do not say verification codes, bank card numbers, ID numbers, or payment passwords.

Chinese:

> 请不要说验证码、银行卡号、身份证号、支付密码。

Before screenshot upload, if implemented:

> Please cover phone numbers, ID numbers, bank cards, verification codes, and addresses.

Chinese:

> 请遮住手机号、身份证号、银行卡号、验证码和住址。

### 13.3 High-Risk Handling

When high-risk content is detected:

1. stop tutorial generation;
2. show risk warning;
3. play warning via voice;
4. generate family help request;
5. do not store raw sensitive information;
6. do not continue into normal guidance.

---

## 14. Technical Solution

### 14.1 Recommended Tech Stack

| Module | Recommended Option |
|---|---|
| Frontend | React / Vue / Next.js |
| Backend | Node.js / NestJS / Express |
| Database | Supabase / PostgreSQL / LocalStorage for MVP |
| AI Model | OpenAI / Claude / DeepSeek / Qwen compatible API |
| Speech-to-Text | Browser Web Speech API / Whisper API |
| Text-to-Speech | Browser TTS / cloud TTS |
| Deployment | Vercel / Cloudflare Pages / Render |

### 14.2 Fastest Hackathon Implementation

For hackathon speed:

```text
Frontend pages
+ browser Web Speech API
+ browser TTS
+ local JSON tutorial library
+ AI API for classification and help request
+ rule-based high-risk keyword fallback
+ localStorage for demo data
+ Vercel deployment
```

### 14.3 Hybrid Safety Architecture

Use both rule-based and LLM-based detection.

```text
User Transcript
→ Rule-based keyword scan
→ LLM classification
→ If either says high-risk, stop guidance
→ Generate warning + family help request
```

Principle:

> High-risk detection should prefer false positives over false negatives.

---

## 15. Data Structure

### 15.1 QuestionRecord

```ts
type QuestionRecord = {
  id: string;
  rawText: string;
  category: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  confirmedQuestion: string;
  shouldStop: boolean;
  summary: string;
  createdAt: string;
};
```

### 15.2 TutorialStep

```ts
type TutorialStep = {
  id: string;
  questionId: string;
  stepIndex: number;
  stepText: string;
  voiceText: string;
  fallbackText: string;
};
```

### 15.3 HelpRequest

```ts
type HelpRequest = {
  id: string;
  questionId: string;
  familyMessage: string;
  riskLevel: "medium" | "high" | "critical";
  suggestedAction: string;
  status: "generated" | "copied" | "simulated_sent";
  createdAt: string;
};
```

---

## 16. Success Metrics

### 16.1 Demo Metrics

| Metric | Target |
|---|---|
| User understands homepage within 10 seconds | ≥ 80% |
| Voice question successfully recognized | ≥ 80% |
| High-risk recall | ≥ 90% |
| Average step length | ≤ 20 Chinese characters when possible |
| User completes at least one tutorial step | ≥ 60% |
| Adult child understands help request | ≥ 80% |

### 16.2 Key Success Principle

For the MVP, safety matters more than completeness.

The project is successful if:

1. seniors know how to start;
2. AI does not over-guide;
3. instructions are short and understandable;
4. risky cases are stopped;
5. family members receive a clear help request.

---

## 17. Development Plan

### Day 1: Product and UX Setup

- finalize 3 demo scenarios;
- write risk keyword list;
- create low-fidelity wireframes;
- define JSON output format;
- prepare AI prompt.

### Day 2: Frontend MVP

- homepage;
- voice input page;
- problem confirmation page;
- step guide page;
- risk warning page;
- family help request page.

### Day 3: AI and Safety Logic

- speech-to-text integration;
- AI classification API;
- rule-based high-risk detection;
- step generation;
- family help request generation.

### Day 4: Demo Polish

- voice playback;
- large-text UI;
- 3 scenario presets;
- README;
- demo script;
- deployment.

---

## 18. Hackathon Demo Script

### 18.1 Opening

Many seniors can use smartphones for simple tasks, but they cannot type, search, or understand complex pop-ups. When they face verification codes, unknown links, or screen sharing requests, they may panic and make risky decisions.

EasyPhone AI is a voice-first phone coach for low-literacy seniors. It teaches safe tasks step by step, and more importantly, it stops dangerous actions before scams happen.

### 18.2 Demo 1: Safe Guidance

Senior says:

> “WeChat has no sound.”

AI confirms the problem, classifies it as low-risk, and gives one instruction at a time.

### 18.3 Demo 2: Accessibility

Senior says:

> “The words on my phone are too small.”

AI provides large-text, voice-guided steps.

### 18.4 Demo 3: Risk Interruption

Senior says:

> “A message says my medical insurance card is blocked. It asks me to click a link and enter a verification code.”

AI stops immediately:

> “Do not click the link. Do not enter the code. I can help you ask your family first.”

Then AI generates a family help request.

### 18.5 Closing

EasyPhone AI does not replace family support. It helps seniors use phones more safely and helps families intervene before small confusion becomes real harm.

---

## 19. Competitive Differentiation

| Common Product | What It Does | EasyPhone AI Difference |
|---|---|---|
| Tutorial App | Provides fixed text tutorials | Voice-first, one step at a time |
| General Chatbot | Answers user questions | Safety-aware interruption for risky scenarios |
| Remote Control Tool | Lets family control the phone | Does not control the phone; preserves autonomy |
| Anti-Fraud App | Warns about scams | Combines real-time phone coaching with family help request |
| Elderly Community | Peer support and content | No open community in MVP to avoid scam and moderation risk |

---

## 20. Future Roadmap

### V1.1 Family Side

- family account binding;
- receive help requests;
- reply in simple language;
- high-risk notification.

### V1.2 Tutorial Library Expansion

- WeChat;
- Alipay;
- phone settings;
- storage cleanup;
- video calls;
- photo album;
- medical insurance app basics;
- anti-fraud scenarios.

### V1.3 Verified Knowledge Base

- community volunteer contribution;
- admin review;
- AI rewrite into elderly-friendly steps;
- verified tutorial library.

### V2.0 Device-Level Assistance

- screenshot understanding;
- Android accessibility support;
- desktop shortcut entry;
- dialect ASR;
- telecom or community service integration.

---

## 21. Final MVP Recommendation

The hackathon version should stay focused:

> **EasyPhone AI is an AI voice phone coach for low-literacy seniors. It guides safe phone tasks step by step, and stops risky actions before scams happen.**

Do not expand into:

- a general elderly super app;
- a public community;
- a remote-control tool;
- a medical or financial assistant;
- a full family monitoring system.

The strongest demo message is:

> **AI should not only know how to answer. It should also know when to stop.**

---

## Appendix A: Short Application Description

### English Version

EasyPhone AI is an AI voice phone coach for low-literacy seniors. Many elderly users cannot type, search, or understand complex phone pop-ups. When they face verification codes, unknown links, screen sharing requests, or fake medical insurance messages, they may panic and make risky decisions.

EasyPhone AI lets seniors simply speak their problem. The AI classifies the issue, checks the risk level, and either guides safe tasks step by step with large text and voice, or stops risky actions and generates a clear help request for family members.

The goal is not to replace family support, but to reduce the digital divide and prevent scam-related mistakes before they happen.

### Chinese Version

EasyPhone AI / 爸妈别急，是一个面向低识字中老年人的 AI 语音手机教练。很多老人不会打字、不会搜索，也看不懂复杂手机弹窗，遇到验证码、陌生链接、屏幕共享、医保异常短信时容易慌张甚至被骗。

这个产品让老人直接开口说问题，AI 会先判断问题类型和风险等级：低风险场景一步一步语音引导，高风险场景立即停止操作指导，并生成家人能看懂的求助单。项目目标不是替代家人，而是降低数字使用门槛，并在诈骗风险前帮老人停下来。


