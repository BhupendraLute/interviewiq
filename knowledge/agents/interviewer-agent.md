---
title: Interviewer Agent
description: Real-time interviewer agent that asks probing follow-up questions
topic: agents
subtopic: interviewer
source_file: lib/agents/interviewerAgent.ts
related:
  - feedback-agent.md
  - ../system/interview-flow.md
updated: 2026-07-17
---

# Interviewer Agent

## Overview

The **Interviewer Agent** is a real-time agent that reads the candidate's answer and generates sharp, specific follow-up questions. It's the active voice in the interview — it probes for weaknesses using the `flag_weakness` tool.

## Architecture

```
Transcript (full history)
    │
    ▼
InterviewerAgent (initialized fresh each turn)
    │
    ├─> Reads candidate's latest answer
    ├─> Analyzes for gaps
    ├─> Optionally calls flag_weakness()
    └─> Generates 2-4 sentence follow-up
        │
        └─> Response sent to user, flagged weaknesses saved
```

## Instructions

```
You are an experienced technical interviewer conducting a live DSA mock interview.

You have just seen the candidate's submitted approach or code for the 
current question. Respond with ONE sharp, specific follow-up question 
grounded in what they actually wrote — about time/space complexity, 
a missed edge case, or an alternative approach. Never ask a generic 
canned question.

If you notice a specific, concrete weakness (not a vague concern), 
call flag_weakness to log it before responding.

Keep your response to 2-4 sentences. Tone: professional, direct, 
encouraging but honest — like a real interviewer, not a cheerleader.
```

## The `flag_weakness` Tool

### Definition

```typescript
flag_weakness(
  topic: string,
  note: string
)
```

### Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `topic` | string | Short label for the weakness | "time complexity" |
| `note` | string | One sentence on what was missed | "Claimed O(n) but wrote O(n²)" |

### When to Call

- **Do call** when there's a **concrete, specific gap**:
  - Wrong complexity claim (said O(n), wrote O(n²))
  - Missed edge case (no null check, doesn't handle empty array)
  - Logical error (off-by-one in loop, wrong base case)
  - Incomplete solution (ignores part of problem statement)

- **Don't call** for:
  - Vague concerns ("could be cleaner")
  - Minor style issues ("variable naming")
  - Things they're about to address ("you'll need to think about edge cases")

### Example Calls

```typescript
// Gap: Complexity mismatch
flag_weakness(
  topic: "time complexity",
  note: "Claimed O(n) but nested loop is O(n²)"
)

// Gap: Missing edge case
flag_weakness(
  topic: "edge case: null input",
  note: "No check for null before accessing element"
)

// Gap: Wrong data structure
flag_weakness(
  topic: "data structure choice",
  note: "Array lookup is O(n), should use hash map for O(1)"
)

// Gap: Incorrect algorithm
flag_weakness(
  topic: "algorithm: recursion depth",
  note: "Recursive solution will hit stack overflow for large inputs"
)
```

## Execution Context

### Input

The agent receives:
- **Full transcript** of all prior messages (context window)
- **Latest user message** (candidate's answer)
- **Question details** (title, prompt, difficulty)

### Output

The agent returns:
- **Weaknesses flagged** (0 or more calls to `flag_weakness()`)
- **Response text** (2-4 sentences, a follow-up question)

### Fallback & Retries

- If OpenAI quota exhausted → fallback to OpenRouter
- If response timeout (15s) → return error to user
- If invalid schema → validate and retry once

## Behavior Examples

### Example 1: Correct Approach, Missing Complexity

**User submits:**
```
"I'd use a hash map to store seen numbers, 
then iterate through and check if target - num exists."
```

**Agent thinks:**
- ✓ Correct approach
- ✗ No mention of space complexity

**Agent calls:**
```
flag_weakness(
  topic: "space complexity",
  note: "Didn't mention the O(n) space trade-off"
)
```

**Agent responds:**
```
"Good hash map approach. 
Walk me through the space complexity — 
and how does it compare to a brute force solution?"
```

---

### Example 2: Logical Error in Code

**User submits:**
```javascript
for (let i = 0; i < arr.length; i++) {
  if (arr[i] === target) return i;
}
return -1;
```

**User also says:**
```
"This searches for the target and returns -1 if not found. 
Handles all cases."
```

**Agent thinks:**
- Wait, the user said "handles all cases" but...
- Empty array: loop doesn't run, returns -1 ✓
- Target not found: returns -1 ✓
- But what if target is first element? Returns 0 ✓
- Actually, this looks correct...
- Hmm, let me ask about what they'd do with duplicates.

**Agent responds:**
```
"Looks right for single occurrence. 
What if the target appears multiple times? 
Would your current approach handle that differently, 
or would you need to modify it?"
```

(No flag called — no concrete gap yet, just probing.)

---

### Example 3: Edge Case Not Considered

**User submits:**
```
"For a linked list reversal, I'd iterate through 
and swap pointers."
```

**Agent thinks:**
- ✓ Correct high-level approach
- ✗ But what about empty list? Null pointer?

**Agent calls:**
```
flag_weakness(
  topic: "edge case: empty list",
  note: "No mention of handling null or empty input"
)
```

**Agent responds:**
```
"Good. Before you code, 
what are the edge cases you need to handle? 
Start with: what if the list is empty or has one node?"
```

---

## Integration with Feedback Agent

The feedback agent reads:
- Full transcript
- All `flag_weakness` calls logged in transcript
- Uses flagged weaknesses as **concrete evidence** in the report

Example feedback:
```
"Weaknesses identified:
 1. Time complexity — flagged: 'Claimed O(n) but wrote O(n²)'
 2. Edge cases — flagged: 'No null check before accessing [0]'
```

---

## Model Selection

- **Primary**: OpenAI (GPT-4 or similar)
- **Fallback**: OpenRouter (same model family)
- **Cost**: ~$0.10–0.30 per interview (typical 6–10 agent calls)

---

## Performance & Latency

| Metric | Target |
|--------|--------|
| P50 latency | 3–5 seconds |
| P95 latency | 8–12 seconds |
| Timeout | 15 seconds |
| Tool call success | >99% (fallback handles failures) |

---

## Code Reference

**File**: [lib/agents/interviewerAgent.ts](../../lib/agents/interviewerAgent.ts)

Key functions:
- `makeFlagWeaknessTool(collected)` — creates the tool
- `makeInterviewerAgent(model, collected)` — factory for agent instance

Used by:
- [lib/agents/runWithFallback.ts](../../lib/agents/runWithFallback.ts) — wraps agent call with fallback logic
- [app/api/session/[id]/respond/route.ts](../../app/api/session/%5Bid%5D/respond/route.ts) — calls agent on each user message
