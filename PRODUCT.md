# Product

## Register

product

## Users

- **Primary:** Software engineering job candidates (students, career-switchers, and working engineers) preparing for technical interviews across coding, system design, and behavioral rounds.
- **Context:** Practicing alone, often under time pressure, on a laptop, in a quiet room. They want realistic, low-stakes reps before a real interview. Many are non-native English speakers and may prefer to speak rather than type.
- **Job to be done:** Run a believable mock interview, get asked probing follow-ups, show their work (code + diagrams), and leave with an honest, structured assessment of where they stand.

## Product Purpose

InterviewIQ is a free, no-login AI mock-interview platform. It spins up a conversational AI interviewer for a chosen role, difficulty, and mode, then produces a detailed feedback report. Success looks like: a candidate completes a session feeling it was realistic, sees clear strengths and gaps, and knows what to study next — without signing up or paying.

## Brand Personality

- Encouraging but rigorous — it builds confidence without lowering the bar.
- Credible and focused — reads like a senior interviewer, not a chatbot.
- Calm and tool-assisted — the workspace stays out of the way so the candidate can think.

Three words: **focused, honest, supportive.**

## Anti-references

- Not a gamified quiz app with points, streaks, or leaderboards.
- Not an enterprise ATS / recruiting dashboard.
- Not a generic floating AI chat widget pasted onto a marketing site.
- Not a "everything is a card with a gradient" SaaS template.

## Design Principles

1. **Practice over polish.** The interface should feel like a real interview room, not a demo. Reduce chrome; maximize thinking space.
2. **Show, don't tell.** Candidates prove their thinking with code and diagrams; the UI makes sharing work effortless (editor + whiteboard + voice).
3. **Honest feedback is the product.** The report and in-session flags must be specific and actionable, never vague praise.
4. **Calm by default, expressive on demand.** Quiet neutral surfaces; motion and voice are opt-in, not mandatory.
5. **Accessible from first load.** No login wall, clear contrast, keyboard-operable controls, and graceful degradation when a browser lacks a feature (e.g. speech input).

## Accessibility & Inclusion

- Target WCAG 2.1 AA: body text contrast ≥ 4.5:1, large text ≥ 3:1.
- Respect `prefers-reduced-motion` for all animation.
- Voice features are progressive enhancements: speech input/ output must degrade gracefully (feature-detected, disabled with a tooltip) since support varies by browser.
- Controls are keyboard reachable; the canvas editor and whiteboard support pointer + keyboard where feasible.
- Avoid relying on color alone to convey state (e.g. flagged weaknesses also use a label).
