---
title: Feedback Agent
description: Generates structured feedback reports from interview transcripts
topic: agents
subtopic: feedback
source_file: lib/agents/feedbackAgent.ts
related:
  - interviewer-agent.md
  - ../system/interview-flow.md
updated: 2026-07-18
---

# Feedback Agent

## Overview

The **Feedback Agent** runs once at the end of an interview. It reads the full transcript (formatted as plain text) and generates a structured, Zod-validated feedback report that quotes specific moments from the conversation.

## Architecture

```
Full Interview Transcript
  ├─ All user messages
  ├─ All AI responses
       │
       ▼
  Transcript formatted as:
    "USER: ...\n\nAI: ...\n\nUSER: ..."
       │
       ▼
  FeedbackAgent (initialized once, at finish)
       │
       ├─> Agent receives formatted transcript as input string
       ├─> Agent analyzes conversation
       ├─> Agent generates structured output (Zod schema)
       └─> Returns validated JSON
            │
            ├─ correctnessNotes (string)
            ├─ complexityNotes (string)
            ├─ communicationNotes (string)
            ├─ quotedMoments[] ({speaker, quote, why}, 2-4 items)
            └─ nextSteps (string)
```

## Instructions

The feedback agent now receives role, difficulty, and mode context:

```
You are analyzing a completed ${mode} mock interview for a **${role}**
position at **${difficulty}** difficulty.

Score each dimension relative to what would be expected for a ${role}
at this difficulty level. Be honest — a score in the 40-70 range is
typical for a practice interview. Reserve 85+ for genuinely excellent.

- overallScore: weighted aggregate reflecting the full interview
- correctnessScore: how accurate and complete for a ${role} at ${difficulty}
- complexityScore: complexity analysis depth (coding) or architecture
  tradeoffs (system design)
- communicationScore: clarity, structure, how they walked through thinking

Produce structured text notes for each dimension. quotedMoments MUST
reference things actually said in the transcript — never invent
examples. Include 2-4 quoted moments, each with why it mattered.
nextSteps should be actionable for someone aiming for a ${role} role.

If a list of flagged weaknesses is included, make sure each is
reflected somewhere in your notes or quoted moments.
```

## Output Schema (Zod)

```typescript
export const feedbackReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  correctnessScore: z.number().min(0).max(100),
  complexityScore: z.number().min(0).max(100),
  communicationScore: z.number().min(0).max(100),
  correctnessNotes: z.string(),
  complexityNotes: z.string(),
  communicationNotes: z.string(),
  quotedMoments: z
    .array(
      z.object({
        speaker: z.enum(["user", "ai"]),
        quote: z.string(),
        why: z.string(),
      })
    )
    .min(2)
    .max(4),
  nextSteps: z.string(),
});

export type FeedbackReport = z.infer<typeof feedbackReportSchema>;
```

### Example Output

```json
{
  "overallScore": 68,
  "correctnessScore": 75,
  "complexityScore": 55,
  "communicationScore": 70,
  "correctnessNotes": "Correctly identified the hash map O(n) approach. Code implementation was clean and handled the single-occurrence case well.",
  "complexityNotes": "Initial answer didn't mention space complexity. When prompted, correctly identified O(n) space for the hash map.",
  "communicationNotes": "Clear and confident. Walked through an example before coding. Could have been more proactive about edge cases.",
  "quotedMoments": [
    {
      "speaker": "user",
      "quote": "I'd use a hash map to store numbers I've seen, then iterate through",
      "why": "Quickly identified optimal approach"
    },
    {
      "speaker": "ai",
      "quote": "What about space complexity?",
      "why": "Interviewer spotted missing analysis and prompted candidate to address it"
    }
  ],
  "nextSteps": "Practice proactively stating both time and space complexity. Study edge cases (empty input, duplicates, negative numbers). Always ask 'what could break?' before starting to code."
}
```

## Input Analysis

The agent receives the transcript as a single formatted string:

```
USER: For Two Sum, I'd use a hash map.

AI: Walk me through it.

USER: Iterate through the array, store each number in a map with its index. Then check if target - current exists in the map.

AI: Good. What about space complexity?

USER: Oh, right. It's O(n) because we store up to n numbers.
```

The agent analyzes:
1. **Conversation Flow** — When did the candidate propose a solution? How did they respond to follow-ups?
2. **Correctness** — Is the solution actually correct?
3. **Complexity Awareness** — Did they proactively analyze time and space?
4. **Communication** — Did they explain their thinking clearly?
5. **Quoted Moments** — The agent selects 2-4 specific moments with attribution

Note: Flagged weaknesses from the interviewer agent are NOT persisted to the database in the current implementation. The feedback agent independently analyzes the transcript text.

## Input Format

The finish API route formats the transcript before passing to the agent:

```typescript
const transcriptText = history
  .map((row) => `${row.role.toUpperCase()}: ${row.content}`)
  .join("\n\n");
```

## Structured Output via Zod

The feedback agent uses the Agents SDK's `outputType` parameter for structured outputs:

```typescript
export function makeFeedbackAgent(
  model: ReturnType<typeof getOpenAIModel>,
  role = "Software Engineer",
  difficulty = "medium",
  mode = "coding"
) {
  return new Agent({
    name: "InterviewIQ Feedback Analyst",
    instructions: getFeedbackInstructions(role, difficulty, mode),
    model,
    outputType: feedbackReportSchema,
  });
}
```

Benefits:
- **No parsing hacks** (no regex string-scraping)
- **Type-safe** (TypeScript validates at runtime)
- **Automatic retry** (Agents SDK retries on schema violation)
- **Reproducible** (same schema every interview)

---

## Key Principles

### 1. Specificity Over Generic

❌ Bad: "Work on edge cases"
✅ Good: "Your code doesn't handle null input or empty arrays."

### 2. Quote Actual Moments

❌ Bad: "Didn't think through complexity well"
✅ Good: "When prompted about space, you said 'just a map' — the correct analysis is O(n)."

### 3. Balance Encouragement & Honesty

❌ Bad: "Perfect! Nothing to improve."
❌ Bad: "This is terrible. Start over."
✅ Good: "Strong approach. The logic is sound. Two things to refine: edge cases and proactive complexity analysis."

### 4. Connect to Real Preparation

Recommendations should point to **actionable practice**, not vague platitudes.

---

## Performance & Cost

| Metric | Value |
|--------|-------|
| Input size | ~3–5 KB (transcript) |
| Model | OpenAI `gpt-4o-mini` (or fallback) |
| Timeout | 20 seconds |
| Cost per report | ~$0.10–0.20 |

---

## Code Reference

**File**: [lib/agents/feedbackAgent.ts](../../lib/agents/feedbackAgent.ts)

Key exports:
- `feedbackReportSchema` — Zod schema for structured output
- `FeedbackReport` — TypeScript type inferred from schema
- `makeFeedbackAgent(model)` — factory for agent instance
- `FEEDBACK_INSTRUCTIONS` — system prompt for the agent

Used by:
- [lib/agents/runWithFallback.ts](../../lib/agents/runWithFallback.ts) — wraps agent with fallback
- [app/api/session/[id]/finish/route.ts](../../app/api/session/%5Bid%5D/finish/route.ts) — calls at interview end
