---
title: InterviewIQ Architecture
description: Complete technical architecture of InterviewIQ
topic: architecture
subtopic: system-design
related:
  - sessions.md
  - interview-flow.md
updated: 2026-07-18
---

# InterviewIQ Architecture

## Tech Stack

- **Frontend & Backend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 (single deployable unit)
- **AI Agents**: OpenAI Agents SDK (`@openai/agents`) — real agents with tool calling and structured outputs
- **Database**: Drizzle ORM + Neon Postgres (serverless HTTP driver)
- **Auth**: Anonymous UUID cookies — no login, no signup
- **UI Components**: shadcn/ui (base-nova style) + Radix UI primitives + Lucide icons
- **Validation**: Zod (TypeScript-first schema validation)
- **Charts**: Chart.js + react-chartjs-2 (BarChart, RadarChart)
- **Motion**: Framer Motion (`motion` package)
- **Streaming**: `streamdown` + plugins (code, math, mermaid, CJK)
- **CSS**: Tailwind CSS v4 with custom design tokens + `tw-animate-css`

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  • Landing / configuration page                              │
│  • Interview create form (mode / role / difficulty / timer)  │
│  • Live interview chat with hints & scoring                  │
│  • Feedback display with charts                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                API Routes (Next.js)                          │
│  • POST /api/session/start                                  │
│  • POST /api/session/[id]/respond (message → agent loop)    │
│  • POST /api/session/[id]/finish (generate feedback)        │
│  • GET /api/test-model (sanity check)                       │
│  • GET /api/test-session (DB connection test)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
     ┌─────────────────┼─────────────────┐
     │                 │                  │
     ▼                 ▼                  ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  OpenAI      │ │ OpenRouter   │ │  Neon       │
│  (Primary)   │ │  (Fallback)  │ │  Postgres   │
└──────────────┘ └──────────────┘ └──────────────┘
                       │
                       ▼
               ┌──────────────┐
               │ OpenCode Zen │
               │  (Fallback)  │
               └──────────────┘
```

## Core Components

### 1. Session Management (`lib/session.ts`)

- **Anonymous Identity**: `getOrCreateAnonId()` creates a UUID cookie on first visit
- **Cookie**: `iq_session` (httpOnly, 1-year expiry, lax SameSite)
- **All interview data** tied to this UUID, no user table

### 2. Question Bank (`lib/questions.ts`)

- 10 built-in DSA questions (3 easy, 4 medium, 3 hard)
- CSV / JSON import for custom question banks
- `pickQuestion()` filters by difficulty and picks randomly
- `normalizeImportedQuestions()` handles CSV, JSON array, or JSON object with `questions` key

### 3. Answer Scoring (`lib/interviewScoring.ts`)

- Real-time heuristic scoring of candidate answers
- Checks: length, structure signals, complexity mentions, edge cases, examples, communication clarity
- Mode-aware: different signals for coding, system-design, behavioral
- Returns score (0-100), strength tier (weak/medium/strong), focus areas, summary

### 4. Progressive Hints (`lib/hints.ts`)

- 3-level hint system per interview mode
- Signal-aware hints based on question topic (linked-list, tree, graph, string, array, parentheses)
- Adaptive: tailors hint text based on what the candidate already wrote

### 5. Timed Mode (`lib/timedMode.ts`)

- 3 presets: short (3 min), medium (10 min), long (20 min)
- `formatTime()` for MM:SS display

### 6. Agent Layer (`lib/agents/`)

#### Interviewer Agent
- **Tool**: `flag_weakness(topic, note)` — logs specific gaps
- **Mode-aware instructions**: adapts dynamically for coding, system-design, or behavioral
- **Code detection**: `looksLikeCode()` detects code snippets in answers to tailor follow-ups
- **Behavior**: Reads candidate answer, flags weaknesses, asks real follow-ups
- **Lives in**: `lib/agents/interviewerAgent.ts`

#### Feedback Agent
- **Structured Output**: Zod schema (`feedbackReportSchema`) for reliable JSON reports
- **Input**: Full interview transcript
- **Output**: Structured report with correctnessNotes, complexityNotes, communicationNotes, quotedMoments (2-4), nextSteps
- **Lives in**: `lib/agents/feedbackAgent.ts`

### 7. Fallback Strategy (`lib/agents/runWithFallback.ts` + `lib/callModel.ts`)

Two parallel implementations:
- `callModel()` — used for raw chat completions (test endpoint)
- `runAgentWithFallback()` — used for agent-based calls (respond, finish)

All AI calls wrapped in:
1. Try OpenAI first
2. On `400` → fail immediately (request error)
3. On `429` (rate limit, not quota) → one backoff retry, then fallback
4. On `401`, `403`, `429` (quota), or `5xx` → fallback to OpenRouter
5. If OpenRouter also fails → fallback to OpenCode Zen (big-pickle, free)
6. Tag response with provider used

### 8. Providers (`lib/agents/providers.ts`)

- Lazy-initialized `OpenAIChatCompletionsModel` instances
- OpenAI client for primary, OpenRouter client (pointed at openrouter.ai baseURL) for first fallback
- OpenCode Zen client (pointed at opencode.ai/zen/v1 baseURL) for second fallback
- No global `setDefaultOpenAIClient()` — per-call provider switching

### 9. Database (`lib/db/`)

**Drizzle ORM schema** with tables:
- `sessions` — interview metadata (id, sessionId, role, difficulty, status, createdAt)
- `transcript_events` — individual messages (id, sessionId, role, content, createdAt)
- `feedback_reports` — final report (id, sessionId, correctnessNotes, complexityNotes, communicationNotes, quotedMoments, nextSteps, createdAt)

**Queries via serverless HTTP driver** (Neon) — no persistent connections needed.

## Request Flow: Start Interview

```
POST /api/session/start
│
├─> getOrCreateAnonId() → UUID cookie
├─> INSERT into sessions table
├─> INSERT question prompt as first transcript_event
└─> Return sessionId + question
```

## Request Flow: Send Response

```
POST /api/session/[id]/respond
│
├─> Insert user message into transcript_events
├─> Load full transcript (all history)
├─> Detect if answer contains code (looksLikeCode)
├─> Create InterviewerAgent instance (mode-aware)
├─> Agent reads transcript, calls flag_weakness if needed
├─> Insert agent reply into transcript_events
└─> Return agent response + any flagged weaknesses + provider
```

## Request Flow: Finish Interview

```
POST /api/session/[id]/finish
│
├─> Mark session as completed (status = "completed")
├─> Load full transcript
├─> Create FeedbackAgent instance
├─> Agent reads full transcript via structured output
├─> INSERT feedback_reports into DB
└─> Return report + provider
```

## Error Handling & Resilience

- **Rate Limiting**: One retry with backoff before fallback
- **Quota Exhausted**: Immediate fallback to OpenRouter, then OpenCode Zen
- **Invalid Request** (`400`): Fail immediately, don't mask bugs
- **Server Errors** (`5xx`): Fallback strategy kicks in
- **Network Issues**: Rely on Next.js timeout and retry mechanisms

## UI Component Architecture

```
components/
├── navigation/
│   └── Header.tsx              — App header with brand + "New Interview" CTA
├── ai-elements/                — AI conversation UI components
│   ├── conversation.tsx        — Scrollable conversation container
│   ├── message.tsx             — Chat message with role-based styling
│   ├── prompt-input.tsx        — Text input with submit button
│   ├── suggestion.tsx          — Clickable suggestion chips
│   └── shimmer.tsx             — Loading shimmer animation
├── feedback/
│   └── Toast.tsx               — Auto-dismiss notification (success/error/info)
├── charts/
│   ├── BarChart.tsx            — Chart.js bar chart for skill breakdown
│   └── RadarChart.tsx          — Chart.js radar chart for performance overview
└── ui/                         — shadcn/ui base components (25+ components)
    ├── accordion.tsx, alert.tsx, avatar.tsx, badge.tsx
    ├── button.tsx, button-group.tsx, card.tsx, carousel.tsx
    ├── collapsible.tsx, command.tsx, dialog.tsx, dropdown-menu.tsx
    ├── hover-card.tsx, input.tsx, input-group.tsx, popover.tsx
    ├── progress.tsx, scroll-area.tsx, select.tsx, separator.tsx
    ├── spinner.tsx, switch.tsx, tabs.tsx, textarea.tsx, tooltip.tsx
    └── ... (base-nova style via shadcn CLI)
```

## Deployment

- **Primary**: Deploy to Vercel (Next.js native)
- **Database**: Neon Postgres (serverless, HTTP-driven)
- **Environment**: `.env.local` with OpenAI, OpenRouter, and OpenCode Zen keys
- **Scaling**: Serverless by default, stateless API routes

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **OpenAI Agents SDK** | Real tool calling, not prompt engineering |
| **Three-Tier Fallback** | Free tier resilience against quota limits (OpenAI → OpenRouter → OpenCode Zen) |
| **Serverless DB** | No connection pooling needed for short-lived routes |
| **Anonymous Sessions** | Zero friction before first interview |
| **Structured Feedback** | Zod ensures reliable JSON, no parsing hacks |
| **Next.js (not separate API)** | Simpler deployment, shorter latency |
| **Multi-mode interviews** | Single app serves coding, system-design, behavioral |
| **CSV/JSON import** | Users can practice on their own question banks |
