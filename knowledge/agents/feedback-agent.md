---
title: Feedback Agent
description: Generates structured feedback reports from interview transcripts
topic: agents
subtopic: feedback
source_file: lib/agents/feedbackAgent.ts
related:
  - interviewer-agent.md
  - ../system/interview-flow.md
updated: 2026-07-17
---

# Feedback Agent

## Overview

The **Feedback Agent** runs once at the end of an interview. It reads the full transcript (including all `flag_weakness` calls) and generates a structured, JSON-based feedback report that quotes specific moments from the conversation.

## Architecture

```
Full Interview Transcript
  ├─ All user messages
  ├─ All interviewer responses
  └─ All flagged weaknesses
       │
       ▼
  FeedbackAgent (initialized once, at finish)
       │
       ├─> Analyzes conversation
       ├─> Extracts strength moments
       ├─> Correlates with flagged weaknesses
       ├─> Generates structured report (Zod validated)
       └─> Returns JSON
            │
            ├─ score (1-10)
            ├─ strengths (string[])
            ├─ weaknesses (string[])
            ├─ recommendations (string[])
            ├─ codeQuality (string)
            └─ communicationQuality (string)
```

## Instructions

```
You are an expert technical interviewer and mentor.
Review the entire interview transcript and generate 
a detailed, constructive feedback report for the candidate.

The report should:
1. Identify 2-3 concrete strengths with specific quotes
2. Identify 2-4 concrete weaknesses, especially matching 
   the flagged_weakness calls from the interview
3. Give 3-5 actionable recommendations
4. Comment on code quality and communication clarity

Be specific and reference actual moments from the transcript.
Tone: encouraging but honest. Avoid generic platitudes.
```

## Output Schema (Zod)

```typescript
const FeedbackSchema = z.object({
  score: z.number().min(1).max(10).describe("Overall score 1-10"),
  strengths: z.array(z.string()).describe("2-3 specific strength moments"),
  weaknesses: z.array(z.string()).describe("2-4 specific gaps or errors"),
  recommendations: z.array(z.string()).describe("3-5 actionable next steps"),
  codeQuality: z.string().describe("Brief comment on code quality"),
  communicationQuality: z.string().describe("Brief comment on communication")
});
```

### Example Output

```json
{
  "score": 7,
  "strengths": [
    "Quickly identified the hash map approach as optimal (message 3)",
    "Clearly explained the time complexity trade-off (message 5)",
    "Traced through an example on paper before coding (message 7)"
  ],
  "weaknesses": [
    "Missed space complexity analysis — no mention of O(n) space",
    "Didn't consider empty array edge case — no null check",
    "Off-by-one error in the loop condition (line 4)"
  ],
  "recommendations": [
    "Always state both time AND space complexity upfront",
    "Ask 'what are the edge cases?' before starting to code",
    "Practice dry-running code on edge cases (empty input, single element, duplicates)",
    "Use comments to explain non-obvious logic",
    "Review Big-O cheat sheet weekly to internalize common patterns"
  ],
  "codeQuality": "Readable syntax, but lacks comments and rushed edge case handling",
  "communicationQuality": "Clear and confident; good pacing. Could have paused to think before jumping to code."
}
```

## Input Analysis

The agent reads:

### 1. Conversation Flow
- When did the candidate propose a solution?
- How did they respond to follow-up questions?
- Did they defend their approach or pivot?

### 2. Flagged Weaknesses
- Every `flag_weakness` call in the transcript
- Topics and notes logged by the interviewer agent in real-time

### 3. Code Artifacts
- Any code snippets submitted
- Correctness and style

### 4. Communication
- Did they explain their thinking?
- Were they clear and organized?
- Did they ask clarifying questions?

## Integration with Interviewer

The feedback agent leverages the interviewer agent's work:

```
During interview:
  User submits answer
    │
    ▼
  InterviewerAgent reads answer
    │
    ├─> Spots gap: "Wrong complexity"
    ├─> Calls flag_weakness("time complexity", "Claimed O(n), wrote O(n²)")
    ├─> Agent response: "What's the actual complexity of your nested loop?"
    │
    └─> Weakness logged to transcript
         (saved as part of interviewer message)

At end:
  FeedbackAgent reads transcript
    │
    ├─> Sees flagged weakness: "time complexity"
    ├─> Finds the moment in conversation
    ├─> Includes in final report
    └─> "Weaknesses: Didn't correctly analyze complexity"
```

## Scoring Criteria

### Score Breakdown (1-10)

| Score | Interpretation |
|-------|-----------------|
| 1-3 | Fundamental misunderstanding; major gaps |
| 4-5 | Significant issues; needs mentoring |
| 6-7 | Solid core skills; room for improvement |
| 8-9 | Strong performance; minor issues only |
| 10 | Excellent — ready for real interview |

### Factors Considered

- **Correctness** (40%): Does the solution actually work?
- **Complexity** (25%): Did they identify optimal approach?
- **Edge Cases** (20%): Did they handle boundary conditions?
- **Communication** (10%): Did they explain clearly?
- **Code Quality** (5%): Is it readable and production-ready?

## Behavior Example

### Transcript Input

```
[Message 1] User: "For Two Sum, I'd use a hash map."
[Message 2] Interviewer: "Walk me through it."
[Message 3] User: "Iterate through the array, store each number in a map with its index. 
            Then check if target - current exists in the map."
[Message 4] Interviewer: [flagged "space complexity", "Didn't mention O(n) space"] 
            "Good. What about space complexity?"
[Message 5] User: "Oh, right. It's O(n) because we store up to n numbers."
[Message 6] Interviewer: "Got it. Now code it up."
[Message 7] User: 
            ```javascript
            const twoSum = (nums, target) => {
              const map = {};
              for (let i = 0; i < nums.length; i++) {
                const complement = target - nums[i];
                if (map[complement] !== undefined) {
                  return [map[complement], i];
                }
                map[nums[i]] = i;
              }
              return [];
            };
            ```
[Message 8] Interviewer: "Good. What about negative numbers or null input?"
[Message 9] User: "Hmm, I didn't think about that."
```

### Feedback Output

```json
{
  "score": 7,
  "strengths": [
    "Quickly identified hash map as the optimal O(n) approach",
    "Recognized and corrected space complexity gap when prompted",
    "Code implementation was correct and efficient"
  ],
  "weaknesses": [
    "Didn't proactively mention space complexity in initial explanation",
    "Missed edge case handling: null input, negative numbers, duplicates",
    "Didn't validate input or think about constraints upfront"
  ],
  "recommendations": [
    "When proposing a solution, always state BOTH time and space complexity",
    "Before coding, ask: 'What are the edge cases?' and list them explicitly",
    "Add input validation (null checks, constraints) as first line of code",
    "Practice Two Sum variant: return indices vs values, duplicates, etc."
  ],
  "codeQuality": "Clean, correct, and efficient. Could add comments for clarity.",
  "communicationQuality": "Clear initially, but hesitant when asked about edge cases. Practice thinking through constraints upfront."
}
```

---

## Key Principles

### 1. Specificity Over Generic

❌ Bad: "Work on edge cases"
✅ Good: "Your code doesn't handle null input or empty arrays. Add a guard clause at the start."

### 2. Quote Actual Moments

❌ Bad: "Didn't think through complexity well"
✅ Good: "When prompted about space, you initially said 'just a map' — it's actually O(n) because..."

### 3. Balance Encouragement & Honesty

❌ Bad: "Perfect! Nothing to improve." (not honest)
❌ Bad: "This is terrible. Start over." (discouraging)
✅ Good: "Strong approach. The logic is sound, and you communicated well. Two things to refine: edge cases and proactive complexity analysis."

### 4. Connect to Real Preparation

Recommendations should point to **actionable practice**, not vague platitudes.

---

## Performance & Cost

| Metric | Value |
|--------|-------|
| Input size | ~3–5 KB (transcript) |
| Model | OpenAI GPT-4 (or fallback) |
| Timeout | 20 seconds |
| Cost per report | ~$0.15–0.25 |

---

## Reliability: Structured Output

The feedback agent uses **Zod validation** to ensure reliable JSON output:

```typescript
const parsed = FeedbackSchema.parse(agentOutput);
```

Benefits:
- **No parsing hacks** (no regex string-scraping)
- **Type-safe** (TypeScript validates at runtime)
- **Fallback friendly** (if parse fails, return template)
- **Reproducible** (same schema every interview)

---

## Code Reference

**File**: [lib/agents/feedbackAgent.ts](../../lib/agents/feedbackAgent.ts)

Key functions:
- `makeFeedbackAgent(model)` — factory for agent instance
- `FeedbackSchema` — Zod schema for validation

Used by:
- [lib/agents/runWithFallback.ts](../../lib/agents/runWithFallback.ts) — wraps agent with fallback
- [app/api/session/[id]/finish/route.ts](../../app/api/session/%5Bid%5D/finish/route.ts) — calls at interview end
