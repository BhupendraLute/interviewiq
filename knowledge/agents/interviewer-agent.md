---
title: Interviewer Agent
description: Real-time interviewer agent that asks probing follow-up questions across 3 interview modes
topic: agents
subtopic: interviewer
source_file: lib/agents/interviewerAgent.ts
related:
  - feedback-agent.md
  - ../system/interview-flow.md
updated: 2026-07-18
---

# Interviewer Agent

## Overview

The **Interviewer Agent** is a real-time agent that reads the candidate's answer and generates sharp, specific follow-up questions. It's the active voice in the interview — it probes for weaknesses using the `flag_weakness` tool. The agent adapts its behavior to 3 interview modes: **coding**, **system-design**, and **behavioral**.

## Architecture

```
Transcript (full history) + Mode (coding | system-design | behavioral)
    │
    ▼
looksLikeCode(answer) → boolean (detects code in answer)
    │
    ▼
InterviewerAgent (initialized fresh each turn, mode-aware)
    │
    ├─> Reads candidate's latest answer
    ├─> Selects mode-specific instructions
    ├─> If code detected: probes implementation details
    ├─> Optionally calls flag_weakness()
    └─> Generates 2-4 sentence follow-up
        │
        └─> Response sent to user, flagged weaknesses collected in-memory
```

## Mode-Specific Instructions

The agent's instructions are dynamically built based on interview mode, role, and difficulty:

```
You are an experienced technical interviewer conducting a live ${mode}
mock interview for a **${role}** position.

Difficulty guidance for ${difficulty}:
  - easy:     Basic understanding expected, probe for edge cases and clarity
  - medium:   Expect solid approach, probe for optimization and tradeoffs
  - hard:     Candidate may need guidance, probe for process and breakdown

You have just seen the candidate's submitted approach or code for the
current question. Respond with ONE sharp, specific follow-up question
grounded in what they actually wrote. Never ask a generic canned question.

Coding mode (${role}):
  "Focus on correctness, algorithm choice, complexity, and edge cases.
   Tailor depth to seniority expected of a ${role}."

System Design mode (${role}):
  "Focus on architecture choices, components, tradeoffs, scaling,
   latency, resilience, and data flow. Align depth with ${role}."

Behavioral mode (${role}):
  "Focus on specific past experiences, ownership, collaboration,
   conflict resolution, impact. Probe for outcomes relevant to ${role}."

If code detected:
  "The candidate just shared code or pseudocode. Probe implementation
   details, edge cases, performance, or how the solution behaves on
   tricky inputs."
Otherwise:
  "Focus on the strongest concrete gap in their reasoning."

If you notice a specific, concrete weakness (not a vague concern),
call flag_weakness to log it before responding.

Keep your response to 2-4 sentences. Tone: professional, direct,
encouraging but honest — like a real interviewer, not a cheerleader.
```

## Code Detection: `looksLikeCode()`

```typescript
export function looksLikeCode(answer: string): boolean {
  const codeSignals = [
    "function ", "const ", "let ", "var ",
    "class ", "=>", "return ", "if (", "for (",
    "while (", "console.log", "{", "}", ";",
    "import ", "export ", "def ", "public static", "private",
  ];
  return codeSignals.some((signal) => answer.toLowerCase().includes(signal));
}
```

When code is detected, the agent shifts its follow-up to implementation-level details rather than high-level approach.

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

### How It Works

The tool is created via a factory that captures weaknesses into an in-memory array:

```typescript
export function makeFlagWeaknessTool(collected: { topic: string; note: string }[]) {
  return tool({
    name: "flag_weakness",
    description: "Log a specific weakness or gap...",
    parameters: z.object({
      topic: z.string().describe("Short label, e.g. 'time complexity'"),
      note: z.string().describe("One sentence on what was missed"),
    }),
    async execute({ topic, note }) {
      collected.push({ topic, note });
      return `Logged: ${topic}`;
    },
  });
}
```

### When to Call

- **Do call** when there's a **concrete, specific gap**:
  - Wrong complexity claim (said O(n), wrote O(n²))
  - Missed edge case (no null check, doesn't handle empty array)
  - Logical error (off-by-one in loop, wrong base case)
  - Incomplete solution (ignores part of problem statement)
  - Missing STAR structure (behavioral mode)
  - No tradeoff discussion (system design mode)

- **Don't call** for:
  - Vague concerns ("could be cleaner")
  - Minor style issues ("variable naming")
  - Things they're about to address

### Example Calls

```typescript
// Coding: Complexity mismatch
flag_weakness({ topic: "time complexity", note: "Claimed O(n) but nested loop is O(n²)" })

// Coding: Missing edge case
flag_weakness({ topic: "edge case: null input", note: "No check for null before accessing element" })

// System Design: Missing tradeoff
flag_weakness({ topic: "database choice", note: "SQL vs NoSQL tradeoff not discussed" })

// Behavioral: Missing STAR
flag_weakness({ topic: "STAR structure", note: "Answer lacks specific situation and measurable outcome" })
```

## Execution Context

### Input

The agent receives:
- **Full transcript** of all prior messages (context window)
- **Latest user message** (candidate's answer)
- **Mode** (`"coding" | "system-design" | "behavioral"`)
- **Code detection boolean** (whether answer looks like code)

### Output

The agent returns:
- **Weaknesses flagged** (0 or more calls to `flag_weakness()`)
- **Response text** (2-4 sentences, a follow-up question)

### Factory Pattern

The agent is created fresh per request using a factory. It now accepts `role` and `difficulty` to tailor questions:

```typescript
export function makeInterviewerAgent(
  model: ReturnType<typeof getOpenAIModel>,
  collected: { topic: string; note: string }[],
  mode: InterviewMode = "coding",
  isCodeAnswer = false,
  role = "Software Engineer",
  difficulty = "medium"
) {
  return new Agent({
    name: "InterviewIQ Interviewer",
    instructions: getInterviewerInstructions(mode, isCodeAnswer, role, difficulty),
    model,
    tools: [makeFlagWeaknessTool(collected)],
  });
}
```

This factory pattern is essential for the fallback strategy — a second agent is constructed bound to OpenRouter when OpenAI fails. The `flagged` array is reset (`flagged.length = 0`) inside the factory callback on each provider attempt, ensuring every fallback starts with a clean slate.

### Fallback & Retries

- If OpenAI quota exhausted → fallback to OpenRouter (rebuild agent with OpenRouter model)
- If response timeout (15s) → return error to user
- See `runAgentWithFallback()` in `lib/agents/runWithFallback.ts`

## Behavior Examples

### Example 1: Coding — Correct Approach, Missing Complexity

**User submits:**
```
"I'd use a hash map to store seen numbers, 
then iterate through and check if target - num exists."
```

**Agent calls:**
```
flag_weakness({ topic: "space complexity", note: "Didn't mention the O(n) space trade-off" })
```

**Agent responds:**
```
"Good hash map approach. 
Walk me through the space complexity — 
and how does it compare to a brute force solution?"
```

### Example 2: System Design — Missing Tradeoffs

**User submits:**
```
"I'd use PostgreSQL to store URLs and generate short IDs with a hash function."
```

**Agent thinks:**
- ✓ Core component identified
- ✗ What about read/write ratio?
- ✗ No mention of caching or CDN

**Agent calls:**
```
flag_weakness({ topic: "caching strategy", note: "No discussion of read-heavy vs write-heavy workload or cache layer" })
```

**Agent responds:**
```
"Good foundation. Let's talk about scale — if you're getting 10K writes/sec, 
would PostgreSQL alone handle that? Walk me through your caching strategy 
and how you'd handle hash collisions."
```

### Example 3: Behavioral — No STAR Structure

**User submits:**
```
"I led a project migration and it was successful."
```

**Agent thinks:**
- ✓ Good topic
- ✗ No situation or context
- ✗ No specific actions taken
- ✗ No measurable outcome

**Agent calls:**
```
flag_weakness({ topic: "STAR structure", note: "Answer lacks situation, specific actions, and measurable results" })
```

**Agent responds:**
```
"Great that it was successful. Can you give me the specifics — 
what was the situation, what was your role, what concrete actions 
did you take, and what was the measurable outcome?"
```

---

## Integration with Feedback Agent

The feedback agent receives:
- **Full transcript** (formatted as plain text with USER/AI labels)
- Flagged weaknesses are collected in-memory during the respond cycle but are NOT persisted to the database
- The feedback agent independently analyzes the transcript text

---

## Model Selection

- **Primary**: OpenAI `gpt-4o-mini` (configurable via OPENAI_MODEL env var)
- **Fallback**: OpenRouter `meta-llama/llama-3.1-8b-instruct:free` (configurable via OPENROUTER_MODEL)
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
- `makeFlagWeaknessTool(collected)` — creates the flag_weakness tool
- `looksLikeCode(answer)` — detects code in candidate answers
- `getInterviewerInstructions(mode, isCodeAnswer)` — builds mode-aware instructions
- `makeInterviewerAgent(model, collected, mode, isCodeAnswer)` — factory for agent instance

Used by:
- [lib/agents/runWithFallback.ts](../../lib/agents/runWithFallback.ts) — wraps agent with fallback logic
- [app/api/session/[id]/respond/route.ts](../../app/api/session/%5Bid%5D/respond/route.ts) — calls agent on each user message
