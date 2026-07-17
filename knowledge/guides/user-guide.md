---
title: User Guide for InterviewIQ
description: Step-by-step guide for candidates taking interviews
topic: guides
subtopic: user-guide
audience: candidates
updated: 2026-07-17
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

### 2. Select Your Interview Parameters

You'll see a form with:

- **Role**: Backend Engineer, Frontend Engineer, etc.
- **Difficulty**: Easy, Medium, or Hard

**Recommendation**: Start with Easy if you're new. Build to Medium/Hard as you get stronger.

### 3. Click "Start Interview"

You'll see:
- The question prompt
- A chat interface below
- A timer (typically 30 minutes max)

---

## During the Interview

### The Interview Flow

```
1. You see a DSA question
2. You think through your approach (2-3 min)
3. You type your answer in the chat
4. The interviewer asks a follow-up question
5. You respond
6. Repeat 4-5 until the interviewer seems satisfied
   OR you feel confident to move to code
7. You share code when ready
8. Follow-ups on complexity, edge cases, etc.
9. When done, click "End Interview"
```

### Tips for Strong Performance

#### Before You Answer

- **Don't rush**: Take 30 seconds to think through the problem.
- **Clarify constraints**: "Are there duplicates?" "Can input be negative?" (the interviewer may prompt you.)
- **State complexity goals**: "I'm aiming for O(n) time, O(1) space."

#### When Answering

- **Be specific**: Don't say "use a data structure" — say "hash map" or "stack".
- **Explain your thinking**: Walk through a simple example by hand first.
- **Then code**: Only write code after you've explained the logic.

#### When Code is Ready

- **Paste clearly**: Use code blocks or plain text, not screenshots.
- **Mention edge cases**: "I'm handling empty input with an early return."
- **Don't over-comment**: Code should speak for itself; use comments only for non-obvious logic.

#### If the Interviewer Challenges You

- **Don't get defensive**: They're testing your flexibility, not attacking your intelligence.
- **Think out loud**: "You're right, let me reconsider..." shows humility and adaptability.
- **Pivot if wrong**: "My first approach was O(n²) — I should use a hash map instead."

---

## What the Interviewer is Looking For

### Real Interviewer Behavior

The interviewer on InterviewIQ is **not scripted**. It reads your actual answer and asks **real follow-ups** based on what you wrote:

- ✓ "You said O(n) — walk me through why your loop is O(n) and not O(n²)."
- ✓ "What happens if the input is an empty array?"
- ✗ "Tell me about your favorite data structure." (too generic)

### The `flag_weakness` Tool

Behind the scenes, when the interviewer spots a **concrete gap**, it flags it:

- "Time complexity" — you claimed O(n) but wrote O(n²)
- "Edge case: null input" — no null check before accessing array
- "Off-by-one error" — loop condition is wrong

These flags feed into your final feedback report.

---

## After the Interview: Feedback

When you click "End Interview":

1. The system processes your full transcript
2. A feedback agent generates a structured report
3. You see:

   - **Score** (1-10)
   - **Strengths** (with quotes from your actual words)
   - **Weaknesses** (flagged gaps + analysis)
   - **Recommendations** (what to practice next)

### Reading Your Report

```json
{
  "score": 7,
  "strengths": [
    "Quickly identified the hash map approach",
    "Explained time complexity clearly"
  ],
  "weaknesses": [
    "Missed space complexity analysis",
    "No edge case for null input"
  ],
  "recommendations": [
    "Always state both time AND space complexity upfront",
    "Before coding, ask 'what are the edge cases?'",
    "Add null checks and bounds validation as a habit"
  ]
}
```

### What This Means

- **Score 1-3**: Major gaps; review fundamentals
- **Score 4-5**: Solid approach; needs refinement
- **Score 6-7**: Good work; close to interview-ready
- **Score 8-9**: Strong; ready for real interviews
- **Score 10**: Excellent; no concerns

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
- Take it as a learning moment (real interviewers make mistakes too!)
- Politely clarify: "I think I explained that already. Let me restate..."
- Move forward; your final feedback report will be more accurate

### "My code didn't paste correctly"

- Use plain text, not rich text
- Try copying directly from your editor
- If still broken, describe it in words instead

### "I ran out of time"

- Interviews have a max duration (default 30 min)
- You can always start a new interview with a different question
- No penalty for incomplete interviews

### "I want to retake the same question"

Yes! You can pick the same question, role, and difficulty again. Your new session is tracked separately, so you can see your improvement.

---

## Best Practices for Improvement

### After Each Interview

1. Read your feedback carefully
2. Pick ONE recommendation to focus on
3. Research that topic (leetcode, system design resources)
4. Retake a similar question in a week

### Questions to Track

- Easy: 3-5 perfect scores before moving up
- Medium: 6-7 scores consistently
- Hard: Only after strong medium performance

### Build a Habit

- Interview 1-2x per week
- Mix difficulties (don't only do easy)
- Focus on communication, not just code

---

## Still Have Questions?

- **GitHub Issues**: [repo link]
- **Email**: support@interviewiq.example.com
