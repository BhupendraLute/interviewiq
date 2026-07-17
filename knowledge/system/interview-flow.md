---
title: Interview Flow & Agent Loop
description: Step-by-step breakdown of how an interview progresses
topic: process
subtopic: interview-loop
related:
  - architecture.md
  - ../agents/interviewer-agent.md
  - ../agents/feedback-agent.md
updated: 2026-07-17
---

# Interview Flow & Agent Loop

## Complete Interview Flow

### Phase 1: Interview Setup

```
User visits app
  │
  ├─> getOrCreateAnonId() → UUID cookie
  │
  ├─> User selects:
  │    • Role (backend, frontend, etc.)
  │    • Difficulty (easy, medium, hard)
  │
  ├─> POST /api/session/start
  │    ├─> SELECT random question (filtered by difficulty)
  │    ├─> INSERT into sessions table
  │    └─> Return: question + sessionId
  │
  └─> UI displays question, starts chat interface
```

### Phase 2: Live Interview (Loop)

```
User submits answer/code
  │
  ▼
POST /api/session/[id]/respond
  │
  ├─> Verify session exists & not finished
  │
  ├─> ADD user message to transcript
  │
  ├─> CREATE InterviewerAgent instance
  │    ├─> Load full transcript (context)
  │    ├─> Agent reads candidate's answer
  │    ├─> Agent calls flag_weakness if spots gap
  │    │   └─> Weakness logged to collected[] array
  │    ├─> Agent generates 2-4 sentence follow-up
  │    └─> Return agent response
  │
  ├─> ADD interviewer message + flagged weaknesses to transcript
  │
  ├─> Return to client:
  │    ├─ Agent response (follow-up question)
  │    ├─ Any flagged weaknesses
  │    └─ Provider used (openai | openrouter)
  │
  └─> UI displays response, waits for next user input
       [User can continue responding or end interview]
```

**Loop repeats** until user clicks "End Interview" or interview times out.

### Phase 3: Interview Finish & Feedback Generation

```
User clicks "End Interview" 
  or Interview times out (e.g., 30 min)
  │
  ▼
POST /api/session/[id]/finish
  │
  ├─> Verify session exists
  │
  ├─> Mark session as finished (finishedAt = now)
  │
  ├─> Fetch complete transcript
  │
  ├─> CREATE FeedbackAgent instance
  │    ├─> Agent reads full transcript
  │    ├─> Agent extracts strengths & weaknesses
  │    ├─> Agent matches flagged_weakness calls
  │    │   (weaknesses the interviewer caught in real-time)
  │    ├─> Agent generates structured report (Zod schema)
  │    └─> Return JSON report
  │
  ├─> INSERT feedback into feedback table
  │
  └─> Return report to client:
       ├─ Score (1-10)
       ├─ Strengths (with quotes from transcript)
       ├─ Weaknesses (from flagged moments + agent analysis)
       ├─ Recommendations (next steps)
       └─ Code quality & communication notes
```

### Phase 4: Feedback Display

```
User sees final report
  │
  ├─> Score badge
  ├─> Strengths section (quoted moments)
  ├─> Areas for improvement (with specific examples)
  ├─> Action items (what to practice next)
  └─> Option: Start new interview
```

---

## The Interviewer Agent Loop (Per Response)

### How the Interviewer Agent Works

```
1. INPUT: User's answer/code (most recent message in transcript)

2. CONTEXT: Full transcript history (for continuity)

3. INSTRUCTIONS:
   "You are an experienced technical interviewer.
    Respond with ONE sharp, specific follow-up grounded in 
    what they actually wrote — about time/space complexity, 
    a missed edge case, or an alternative approach."

4. TOOL AVAILABLE: flag_weakness(topic, note)
   └─> Called when agent notices a concrete gap

5. OUTPUT:
   ├─ Weakness flag (if applicable)
   └─ 2-4 sentence follow-up question
```

### Example: Interviewer Response

**Candidate's answer:**
```
"I'd use a hash map to store numbers I've seen, then iterate through the list 
and check if target - current_number is in the map."
```

**Interviewer agent thinks:**
- ✓ Correct approach
- ✓ Time complexity is O(n)
- ✗ No mention of space complexity
- ✗ Doesn't handle duplicate numbers

**Interviewer agent calls:**
```
flag_weakness(
  topic: "space complexity",
  note: "Didn't mention O(n) space for hash map"
)
```

**Interviewer agent responds:**
```
"Good, O(n) time with a hash map. 
But walk me through the space complexity — 
and what happens if the input list has duplicates?"
```

---

## The Feedback Agent (After Interview)

### How the Feedback Agent Works

```
1. INPUT: Full interview transcript + flagged weaknesses

2. CONTEXT: All messages in conversation order

3. TASK: Generate structured feedback report

4. ANALYSIS:
   ├─ Extract moments of strength
   │   └─ "Candidate explained trade-offs well"
   ├─ Extract moments of weakness
   │   ├─ From flagged_weakness calls
   │   └─ From broader transcript analysis
   ├─ Assign score (1-10)
   └─ Generate recommendations

5. OUTPUT: Structured JSON (Zod validated)
   ├─ score: number
   ├─ strengths: string[]
   ├─ weaknesses: string[]
   ├─ recommendations: string[]
   ├─ codeQuality: string
   └─ communicationQuality: string
```

### Example Feedback Report

```json
{
  "score": 7,
  "strengths": [
    "Quickly identified the hash map approach (message 3)",
    "Explained time complexity clearly",
    "Walked through an example before writing code"
  ],
  "weaknesses": [
    "Missed space complexity analysis",
    "Didn't consider edge case of empty array",
    "Code had off-by-one error in loop (message 7)"
  ],
  "recommendations": [
    "Always state both time AND space complexity",
    "Ask 'what are the edge cases?' before starting to code",
    "Test your solution on an empty input"
  ],
  "codeQuality": "Readable but rushed; could add comments",
  "communicationQuality": "Clear and confident, good pacing"
}
```

---

## Timing & Constraints

| Constraint | Value | Reason |
|-----------|-------|--------|
| Max interview duration | 30 minutes | Typical mock interview length |
| Max messages per interview | 30 | Prevent runaway conversations |
| Agent response timeout | 15 seconds | Keep UI responsive |
| Feedback generation timeout | 20 seconds | More complex analysis |

---

## Error Handling in Interview Flow

### During Interview (Phase 2)

| Error | Handling |
|-------|----------|
| Session not found | Return 404, prompt user to start new interview |
| Agent API error (`400`) | Return error to user, don't retry |
| Agent rate limited (`429`) | Automatic fallback to OpenRouter |
| Agent quota exhausted | Automatic fallback to OpenRouter |
| Agent server error (`5xx`) | Automatic fallback to OpenRouter |

### During Feedback (Phase 3)

| Error | Handling |
|-------|----------|
| Feedback agent fails | Return generic template + transcript |
| DB insert fails | Return partial feedback, log error |
| Timeout (> 20s) | Return partial feedback from agent |

---

## Fallback Strategy in Interview

All agent calls wrapped in `runWithFallback`:

```
try OpenAI {
  if (400) fail immediately  // Request bug, don't mask
  if (429 + not quota) retry with backoff
  if (429 + quota exhausted) → FALLBACK
  if (401 or 403) → FALLBACK
  if (5xx) → FALLBACK
} catch {
  → FALLBACK
}

FALLBACK {
  use OpenRouter with same prompt
  tag response with "openrouter"
}
```

This ensures interviews continue even if OpenAI quota is hit.
