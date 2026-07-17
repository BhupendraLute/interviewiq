---
title: Interview Flow & Agent Loop
description: Step-by-step breakdown of how an interview progresses
topic: process
subtopic: interview-loop
related:
  - architecture.md
  - ../agents/interviewer-agent.md
  - ../agents/feedback-agent.md
updated: 2026-07-18
---

# Interview Flow & Agent Loop

## Complete Interview Flow

### Phase 1: Interview Setup

```
User visits app → sees landing page with features
  │
  ├─> Click "Start Free Interview" → /interview/create
  │
  ├─> User fills create form:
  │    • Job Role: (free text, e.g. "Frontend Developer")
  │    • Difficulty: easy | medium | hard
  │    • Interview Mode: coding | system-design | behavioral
  │
  ├─> POST /api/session/start
  │    ├─> getOrCreateAnonId() → UUID cookie
  │    ├─> INSERT into sessions table
  │    ├─> INSERT question prompt as first transcript event
  │    └─> Return: sessionId + question (title, prompt, difficulty)
  │
  └─> UI navigates to /interview/[id], displays chat interface
```

### Phase 2: Live Interview (Loop)

```
User types answer/code and submits
  │
  ▼
POST /api/session/[id]/respond  { message, mode: "coding" | "system-design" | "behavioral" }
  │
  ├─> INSERT user message into transcript_events
  │
  ├─> LOAD full transcript history (ordered by createdAt)
  │
  ├─> DETECT if message contains code via looksLikeCode()
  │
  ├─> CREATE InterviewerAgent instance (mode-aware instructions)
  │    ├─> Agent runs against full transcript
  │    ├─> Agent may call flag_weakness(topic, note) for concrete gaps
  │    │   └─> Weakness pushed to in-memory collected[] array
  │    ├─> Agent generates 2-4 sentence follow-up
  │    └─> Return: agent reply + provider tag
  │
  ├─> INSERT agent reply into transcript_events
  │
  ├─> Return to client:
  │    ├─ reply (follow-up question)
  │    ├─ flagged[] (weaknesses logged in this turn)
  │    └─ provider ("openai" | "openrouter" | "opencodezen")
  │
  └─> UI displays response, user can continue or end interview
       [Client-side timer runs based on duration selected]
       [Hints available via lib/hints.ts — 3-level progressive hints]
       [Real-time scoring via lib/interviewScoring.ts (optional)]
```

**Loop repeats** until user clicks "End Interview" or timer expires.

### Phase 3: Interview Finish & Feedback Generation

```
User clicks "End Interview" or timer expires
  │
  ▼
POST /api/session/[id]/finish
  │
  ├─> UPDATE sessions SET status = "completed"
  │
  ├─> LOAD full transcript (all events ordered by createdAt)
  │
  ├─> FORMAT transcript as plain text:
  │    "USER: ...\n\nAI: ...\n\nUSER: ..."
  │
  ├─> CREATE FeedbackAgent instance
  │    ├─> Agent reads formatted transcript
  │    ├─> Agent generates Zod-validated structured output
  │    └─> Return: { correctnessNotes, complexityNotes, communicationNotes, quotedMoments, nextSteps }
  │
  ├─> INSERT feedback_reports into DB
  │
  └─> Return report to client:
       ├─ correctnessNotes
       ├─ complexityNotes
       ├─ communicationNotes
       ├─ quotedMoments[] (2-4 items with speaker, quote, why)
       └─ nextSteps
```

### Phase 4: Feedback Display (API-Driven)

```
User navigates to /interview/[id]/report
  │
  ├─> GET /api/session/[id]/finish (fetches existing report)
  │
  ├─> Displays structured report:
  │    ├─ Correctness & Problem Solving (correctnessNotes)
  │    ├─ Complexity & Depth (complexityNotes)
  │    ├─ Communication & Clarity (communicationNotes)
  │    ├─ Key Moments (quotedMoments — 2-4 attributed quotes)
  │    └─ Next Steps (nextSteps)
  │
  └─> Options: New Interview | Back to Home
```

The report page fetches the generated feedback via `GET /api/session/[id]/finish` and renders the structured Zod-validated output from the Feedback Agent.

---

## The Interviewer Agent Loop (Per Response)

### How the Interviewer Agent Works

```
1. INPUT: User's latest answer/code + full transcript history

2. MODE SELECTION: Instructions adapt based on interview mode:
   - coding:     "Focus on correctness, algorithm choice, complexity, edge cases"
   - system-design: "Focus on architecture choices, components, tradeoffs, scaling"
   - behavioral: "Focus on specific examples, ownership, collaboration, impact"

3. CODE DETECTION: If answer looks like code → probe implementation details

4. TOOL AVAILABLE: flag_weakness(topic, note)
   └─> Called when agent notices a concrete gap

5. OUTPUT:
   ├─ Weakness flag (if applicable)
   └─ 2-4 sentence follow-up question
```

### Example: Coding Mode — Interviewer Response

**Candidate's answer:**
```
"I'd use a hash map to store numbers I've seen, then iterate through the list 
and check if target - current_number is in the map."
```

**Interviewer agent thinks:**
- ✓ Correct approach
- ✓ Time complexity is O(n)
- ✗ No mention of space complexity

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

### Example: System Design Mode

**Candidate's answer:**
```
"I'd use a microservice for URL shortening with a database 
that stores the mapping."
```

**Interviewer agent thinks:**
- ✓ Identified core component
- ✗ No data flow discussion
- ✗ No mention of hash function / collision handling

**Agent calls:**
```
flag_weakness(
  topic: "hash function design",
  note: "Didn't explain how short URLs are generated or collisions handled"
)
```

**Agent responds:**
```
"Good start with the microservice approach. 
Walk me through how you'd generate the short URLs — 
what's your hash function, and how do you handle collisions?"
```

### Example: Behavioral Mode

**Candidate's answer:**
```
"I led a team migration to a new tech stack. It went well."
```

**Interviewer agent thinks:**
- ✓ Team leadership
- ✗ No STAR structure (Situation, Task, Action, Result)
- ✗ No specific details

**Agent calls:**
```
flag_weakness(
  topic: "STAR structure",
  note: "Answer lacks specific situation, task, action, and result details"
)
```

**Agent responds:**
```
"Thanks. Can you walk me through that with more detail? 
What was the specific situation, what was your role, 
and what measurable outcome came from the migration?"
```

---

## The Feedback Agent (After Interview)

### How the Feedback Agent Works

```
1. INPUT: Full interview transcript (formatted as plain text)

2. CONTEXT: All messages in conversation order

3. TASK: Generate structured feedback report

4. OUTPUT: Zod-validated structured object
   ├─ correctnessNotes: string
   ├─ complexityNotes: string
   ├─ communicationNotes: string
   ├─ quotedMoments: { speaker, quote, why }[] (2-4 items)
   └─ nextSteps: string
```

### Example Feedback Report

```json
{
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
      "why": "Interviewer spotted missing analysis and prompted"
    }
  ],
  "nextSteps": "Practice proactively stating both time and space complexity. Study edge cases (empty input, duplicates, negative numbers)."
}
```

---

## Timing & Constraints

| Constraint | Value | Reason |
|-----------|-------|--------|
| Timer presets | 3 / 10 / 20 minutes | Short/medium/long via lib/timedMode.ts |
| Agent response timeout | 15 seconds | Keep UI responsive |
| Feedback generation timeout | 20 seconds | More complex analysis |
| Max transcript length | ~5 KB | Typical interview size |

---

## Utility Systems

### Answer Scoring (`lib/interviewScoring.ts`)

Real-time heuristic scoring on every answer:
- **50%** structure & communication (length, transition words, reasoning)
- **20%** complexity awareness (big-O, tradeoffs, scaling)
- **15%** edge cases (null, empty, duplicates, boundaries)
- **15%** examples & clarity
- Mode-aware: extra signals for coding (data structures), system-design (services/databases), behavioral (STAR)

Returns: `{ score: 0-100, strength: "weak"|"medium"|"strong", focusAreas: string[], summary: string }`

### Progressive Hints (`lib/hints.ts`)

3-level hint system invoked when a candidate is stuck:
- **Level 1**: Broad direction ("Start by naming the core idea")
- **Level 2**: Specific guidance ("Think about edge cases")
- **Level 3**: Concrete implementation path ("Explain runtime and implementation")
- Question-topic-aware: tailored hints for linked-list, tree, graph, string, array, parentheses problems
- Mode-aware: different hint templates for coding, system-design, behavioral

### Question Import (`lib/questions.ts`)

Supports custom question banks via:
- CSV files (title + prompt + difficulty + topic columns)
- JSON arrays of question objects
- JSON objects with `questions` array
- Validates required fields and difficulty values

---

## Error Handling in Interview Flow

### During Interview (Phase 2)

| Error | Handling |
|-------|----------|
| Missing message | Return 400 — message required |
| Agent API error (`400`) | Return error to client, don't retry |
| Agent rate limited (`429`) | Automatic fallback to OpenRouter, then OpenCode Zen |
| Agent quota exhausted | Automatic fallback to OpenRouter, then OpenCode Zen |
| Agent server error (`5xx`) | Automatic fallback to OpenRouter, then OpenCode Zen |

### During Feedback (Phase 3)

| Error | Handling |
|-------|----------|
| Feedback agent fails | Return error with status 500 |
| DB insert fails | Return error, log server-side |
| Timeout | Depend on Next.js request timeout |

---

## Fallback Strategy in Interview

All agent calls wrapped in `runAgentWithFallback` (for agents) or `callModel` (for raw completions):

```
Agent Factory Pattern:
  makeAgent(model) → builds fresh Agent instance bound to specific model

try OpenAI {
  if (400) fail immediately  // Request bug, don't mask
  if (429 + not quota) retry with backoff
  if (429 + quota exhausted) → rebuild agent with OpenRouter model
  if (401 or 403) → rebuild agent with OpenRouter model
  if (5xx) → rebuild agent with OpenRouter model
} catch {
  → rebuild agent with OpenRouter model
}

FALLBACK (OpenRouter) {
  build fresh agent with OpenRouter model
  run with same input
  if (fails) → rebuild agent with OpenCode Zen model
  tag response with provider
}

FALLBACK (OpenCode Zen) {
  build fresh agent with OpenCode Zen model (big-pickle, free)
  run with same input
  tag response with "opencodezen"
}
```

This ensures interviews continue even if OpenAI or OpenRouter quota is hit. The Agent SDK's model is fixed at construction time, so fallback requires constructing a new agent instance bound to the next provider.
