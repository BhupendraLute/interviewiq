---
title: User Guide for InterviewIQ
description: Step-by-step guide for candidates taking interviews
topic: guides
subtopic: user-guide
audience: candidates
updated: 2026-07-18
---

# User Guide: Taking an Interview on InterviewIQ

## Getting Started

### 1. Open InterviewIQ

No signup needed. Just visit the app and you're ready to go.

```
interviewiq.example.com
  ↓
First visit? You get a UUID cookie automatically.
This tracks your progress & sessions. No personal data collected.
```

### 2. Choose Your Interview Type

You'll see a landing page with features. Click **"Start Free Interview"** to begin.

On the **Create Interview** page, you select:

- **Job Role**: Free text (e.g., "Frontend Developer", "SDE-2 Backend")
- **Difficulty**: Easy | Medium | Hard
- **Interview Mode**: Coding / Technical | System Design | Behavioral

**Recommendation**: Start with Coding / Easy if you're new to DSA. Build to Medium/Hard as you get stronger.

### 3. Click "Start Interview"

You'll navigate to the interview page with:
- A question prompt
- A text area for your response
- A timer (countdown based on your chosen duration)
- Navigation between questions

---

## During the Interview

### The Interview Flow (Technical / DSA)

```
1. You see a DSA question
2. You think through your approach (2-3 min)
3. You type your answer in the chat
4. The interviewer asks a follow-up question
5. You respond
6. Repeat 4-5
7. When done, click "End Interview"
```

### Behavioral Interview Tips

- Use the **STAR method**: Situation, Task, Action, Result
- Be specific: name the project, your role, the outcome
- The interviewer will probe for concrete details

### System Design Interview Tips

- Start with requirements and constraints
- Identify core components and data flow
- Discuss tradeoffs: consistency vs availability, latency vs throughput
- The interviewer will ask about scaling and bottlenecks

### Tips for Strong Performance

#### Before You Answer

- **Don't rush**: Take 30 seconds to think through the problem.
- **Clarify constraints**: "Are there duplicates?" "Can input be negative?"
- **State complexity goals** (for DSA): "I'm aiming for O(n) time, O(1) space."

#### When Answering

- **Be specific**: Don't say "use a data structure" — say "hash map" or "stack".
- **Explain your thinking**: Walk through a simple example by hand first.
- **Then code**: Only write code after you've explained the logic.

#### When Code is Ready

- **Paste clearly**: Use code blocks or plain text.
- **Mention edge cases**: "I'm handling empty input with an early return."
- **The agent auto-detects code** and shifts its follow-ups accordingly

#### If the Interviewer Challenges You

- **Don't get defensive**: They're testing your flexibility.
- **Think out loud**: "You're right, let me reconsider..."
- **Pivot if wrong**: "My first approach was O(n²) — I should use a hash map instead."

---

## What the Interviewer is Looking For

The interviewer on InterviewIQ is **not scripted**. It reads your actual answer and asks **real follow-ups**:

- Coding: "You said O(n) — walk me through your loop complexity."
- System Design: "How would that cache layer handle a 10x traffic spike?"
- Behavioral: "What was the measurable outcome of that decision?"

The agent uses the `flag_weakness` tool to log concrete gaps it spots. These are collected in-memory during the interview but currently not persisted to the final report.

---

## After the Interview: Feedback

When you click "End Interview", you navigate to the **Report** page showing:

- **Correctness & Problem Solving** — assessment of your solution's correctness
- **Complexity & Depth** — analysis of your time/space complexity awareness
- **Communication & Clarity** — how well you explained your thinking
- **Key Moments** — 2-4 quoted moments from the conversation with attribution
- **Next Steps** — concrete, actionable recommendations

---

## Privacy & Data

### What We Collect

- Your UUID (anonymous ID)
- Interview questions and your answers
- Final feedback reports

### What We DON'T Collect

- Your name, email, or any personal data
- Your location, device info, or browsing history
- Any data beyond your interview sessions

### How Long We Keep It

- Sessions stored indefinitely
- You can retake the same question anytime
- Compare your progress across interviews

---

## Troubleshooting

### "The interviewer's response seems wrong"

The interviewer is an AI. It makes mistakes sometimes. If the follow-up doesn't make sense:
- Politely clarify: "I think I explained that already. Let me restate..."
- Move forward; your final feedback report will be more accurate

### "My code didn't paste correctly"

- Use plain text, not rich text
- Try copying directly from your editor
- If still broken, describe it in words instead

### "I ran out of time"

- The timer depends on your chosen duration
- You can always start a new interview
- No penalty for incomplete interviews

### "I want to retake the same question"

Yes! You can pick the same question, role, and difficulty again. Your new session is tracked separately.

---

## Best Practices for Improvement

### After Each Interview

1. Review your feedback carefully
2. Pick ONE area to focus on
3. Practice that topic
4. Retake a similar interview in a week

### Build a Habit

- Interview 1-2x per week
- Mix interview types (coding, system design, behavioral)
- Focus on communication, not just getting the right answer

---

## Still Have Questions?

- **GitHub Issues**: [repo link]
