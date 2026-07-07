# EasyPhone AI — English Demo Video Script

> Target length: **2:30 – 3:00**. Screen recording of the live demo (<https://easy-phone-ai.vercel.app>), with English voiceover and on-screen captions. The UI is in Chinese by design (target users are Chinese-speaking seniors) — the captions translate what's on screen for the viewer.

---

## Scene 0 — Cold open (0:00 – 0:15)

**Visual**: Black screen → one line of text fades in:
*"Most AI assistants try to answer. This one knows when to stop."*
Cut to the home page.

**Voiceover**:
> "This is EasyPhone AI — a phone coach for elderly Chinese users living overseas. It teaches simple phone tasks step by step. But its real job is knowing when *not* to help."

---

## Scene 1 — The problem (0:15 – 0:40)

**Visual**: Quick montage (can be static mockups): an English "bank account frozen" SMS, a WhatsApp screen-share request, an OTP text message.

**Voiceover**:
> "For seniors in Singapore, Malaysia, or North America, the phone speaks English — but they don't. Scam texts, fake bank alerts, and screen-sharing fraud all look identical to real notifications. Their children live in another time zone. By the time family finds out, the money is gone."

**Caption**: *Limited English + remote family + English-language scams = the highest-risk demographic.*

---

## Scene 2 — The happy path: low risk (0:40 – 1:20)

**Visual**: Home page. Tap the microphone, speak (or type) **"微信没有声音"** (*"WeChat has no sound"*). Show the confirmation page, then the tutorial: one large-print step at a time, tap the "read aloud" button, advance a couple of steps.

**Voiceover**:
> "A senior doesn't type — they just say the problem. 'WeChat has no sound.' The system classifies this as low risk, confirms what they meant, and then teaches exactly one step at a time. Big text, short sentences, and every step can be read aloud. No walls of text, no jargon."

**Caption**: *Low risk → confirm → one step at a time, with voice.*

---

## Scene 3 — The core: high-risk interrupt (1:20 – 2:10)

**Visual**: Back to home. Enter **"银行短信让我共享屏幕输验证码"** (*"A bank text asks me to share my screen and enter a verification code"*). The tutorial never appears — the red **risk-alert page** loads instantly. Scroll to the **Family Help Card**, tap copy.

**Voiceover**:
> "Now the scenario that matters. A text claims to be from the bank, asking for screen sharing and a verification code. Watch what does *not* happen: no tutorial, no 'confirm' page — because even asking 'do you want to continue?' would suggest this is safe to continue. Instead: stop immediately. Don't transfer. Don't share your screen. Don't tell anyone the code. And one tap generates a Family Help Card — a summary the senior's children can understand at a glance, in the family group chat, seconds later."

**Caption**: *High risk → no tutorial, no confirm. Stop first, then bring in the family.*

---

## Scene 4 — Under the hood, in 30 seconds (2:10 – 2:40)

**Visual**: The architecture diagram from `README.en.md` (or an animated version). Highlight the orange "keyword safety fuse" node, then the yellow GMI node.

**Voiceover**:
> "Under the hood, rules come first. A keyword safety fuse takes the *maximum* risk across all matches — the AI is never allowed to downgrade it. The model, running on GMI Cloud's inference engine, does only two things: it re-checks 'low-risk' inputs for scams that keywords miss — like a fake daughter asking for money — and it rewrites the senior's words into a clear help note. If the AI ever fails, everything falls back to rules and templates. The demo runs end-to-end with no API key at all."

**Caption**: *Rules are the floor. AI can only escalate — never downgrade.*

---

## Scene 5 — Close (2:40 – 3:00)

**Visual**: Home page, then end card with the repo URL and demo URL.

**Voiceover**:
> "EasyPhone AI. Slower, shorter, safer — because for a seniors' product, an AI that helps recklessly is more dangerous than one that doesn't help at all. Try the live demo at easy-phone-ai.vercel.app."

**End card**:

```
EasyPhone AI  爸妈别急
Live demo : easy-phone-ai.vercel.app
GitHub    : github.com/qrx-joe/EasyPhone_AI
```

---

## Recording checklist

- [ ] Record at 1080p+, browser in mobile viewport (DevTools device mode) — this is a mobile-first product
- [ ] Turn on OS sound capture for the read-aloud demo in Scene 2
- [ ] Scene 3 must show the *speed* of the interrupt — do not cut away before the risk page renders
- [ ] Keep Chinese UI visible; rely on captions, never overlay-translate the UI itself
- [ ] If AI recheck is demoed live (Scene 4 alternative), use the audit-log case: "My daughter messaged me to wire 5,000 to her classmate" — 0 keyword hits, AI escalates
