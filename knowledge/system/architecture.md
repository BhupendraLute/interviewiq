---
title: InterviewIQ Architecture
description: Complete technical architecture of InterviewIQ
topic: architecture
subtopic: system-design
related:
  - sessions.md
  - interview-flow.md
updated: 2026-07-17
---

# InterviewIQ Architecture

## Tech Stack

- **Frontend & Backend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS (single deployable unit)
- **AI Agents**: OpenAI Agents SDK (`@openai/agents`) — real agents with tool calling
- **Database**: Drizzle ORM + Neon Postgres (serverless HTTP driver)
- **Auth**: Anonymous UUID cookies — no login, no signup
- **Validation**: Zod (TypeScript-first schema validation)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  • Question picker (role / difficulty)                       │
│  • Live chat interface                                       │
│  • Feedback display                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                API Routes (Next.js)                          │
│  • POST /api/session/start                                  │
│  • POST /api/session/[id]/respond (message → agent loop)    │
│  • POST /api/session/[id]/finish (generate feedback)        │
│  • GET /api/test-* (debug endpoints)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
     ┌─────────────────┼─────────────────┐
     │                 │                  │
     ▼                 ▼                  ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  OpenAI      │ │ OpenRouter   │ │  Neon       │
│  (Primary)   │ │  (Fallback)  │ │  Postgres   │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Core Components

### 1. Session Management (`lib/session.ts`)

- **Anonymous Identity**: `getOrCreateAnonId()` creates a UUID cookie on first visit
- **Cookie**: `iq_session` (httpOnly, 1-year expiry, lax SameSite)
- **All interview data** tied to this UUID, no user table

### 2. Agent Layer (`lib/agents/`)

#### Interviewer Agent
- **Tool**: `flag_weakness(topic, note)` — logs specific gaps
- **Instructions**: "Respond with ONE sharp, specific follow-up grounded in what they actually wrote"
- **Behavior**: Reads candidate answer, flags weaknesses, asks real follow-ups
- **Lives in**: `lib/agents/interviewerAgent.ts`

#### Feedback Agent
- **Structured Output**: Zod schema for reliable JSON reports
- **Input**: Full interview transcript
- **Output**: Structured feedback with quotes and specific recommendations
- **Lives in**: `lib/agents/feedbackAgent.ts`

### 3. Fallback Strategy (`lib/agents/runWithFallback.ts`)

All AI calls wrapped in:
1. Try OpenAI first
2. On `400` → fail immediately (request error)
3. On `429` (rate limit, not quota) → one backoff retry, then fallback
4. On `401`, `403`, `429` (quota), or `5xx` → fallback to OpenRouter
5. Tag response with provider used

### 4. Database (`lib/db/`)

**Drizzle ORM schema** with tables:
- `sessions` — interview metadata (anonId, questionId, role, difficulty, createdAt, finishedAt)
- `transcript` — individual messages (sessionId, role, message, timestamp)
- `feedback` — final report (sessionId, report JSON, createdAt)

**Queries via serverless HTTP driver** (Neon) — no persistent connections needed.

## Request Flow: Start Interview

```
POST /api/session/start
│
├─> getOrCreateAnonId() → UUID cookie
├─> SELECT random question filtered by difficulty
├─> INSERT into sessions table
└─> Return question + sessionId
```

## Request Flow: Send Response

```
POST /api/session/[id]/respond
│
├─> Verify session exists & not finished
├─> Add user message to transcript
├─> Create InterviewerAgent instance
├─> Agent reads transcript, calls flag_weakness if needed
├─> Get agent response
├─> Add agent message to transcript
└─> Return agent response + any flagged weaknesses
```

## Request Flow: Finish Interview

```
POST /api/session/[id]/finish
│
├─> Verify session exists
├─> Create FeedbackAgent instance
├─> Agent reads full transcript
├─> Agent generates structured feedback (JSON)
├─> INSERT feedback into DB
├─> Mark session as finished
└─> Return feedback report
```

## Error Handling & Resilience

- **Rate Limiting**: One retry with backoff before fallback
- **Quota Exhausted**: Immediate fallback to OpenRouter
- **Invalid Request** (`400`): Fail immediately, don't mask bugs
- **Server Errors** (`5xx`): Fallback strategy kicks in
- **Network Issues**: Rely on Next.js timeout and retry mechanisms

## Deployment

- **Primary**: Deploy to Vercel (Next.js native)
- **Database**: Neon Postgres (serverless, HTTP-driven)
- **Environment**: `.env.local` with OpenAI and OpenRouter keys
- **Scaling**: Serverless by default, stateless API routes

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **OpenAI Agents SDK** | Real tool calling, not prompt engineering |
| **Fallback Strategy** | Free tier resilience against quota limits |
| **Serverless DB** | No connection pooling needed for short-lived routes |
| **Anonymous Sessions** | Zero friction before first interview |
| **Structured Feedback** | Zod ensures reliable JSON, no parsing hacks |
| **Next.js (not separate API)** | Simpler deployment, shorter latency |
