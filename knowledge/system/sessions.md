---
title: Session Model & Data Storage
description: How InterviewIQ stores and manages interview sessions
topic: data-model
subtopic: database
related:
  - architecture.md
  - interview-flow.md
updated: 2026-07-18
---

# Session Model & Data Storage

## Overview

A **session** in InterviewIQ represents one complete mock interview from start to finish. All interview data is stored in a relational database (Neon Postgres via Drizzle ORM) and tied to an anonymous UUID cookie.

## Session Lifecycle

```
┌─────────────┐
│   START     │
│  Interview  │
│  (new UUID) │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  INTERVIEW IN PROGRESS              │
│  • User answers questions           │
│  • Interviewer asks follow-ups      │
│  • Weaknesses flagged by agent      │
│  • All messages stored in DB        │
└──────┬──────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  FINISH INTERVIEW                    │
│  • Session status → "completed"      │
│  • Feedback agent reads transcript   │
│  • Structured report generated       │
│  • Session marked complete           │
└──────────────────────────────────────┘
```

## Database Schema

### `sessions` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated session ID |
| `sessionId` | Text | Anonymous user UUID from client cookie (not a FK — plain text) |
| `role` | Text | e.g., "SDE-2 Backend", "Frontend Engineer" |
| `difficulty` | Text | "easy" \| "medium" \| "hard" |
| `status` | Text | "in_progress" \| "completed" |
| `createdAt` | DateTime (tz) | Interview start time (auto-default now) |

### `transcript_events` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated event ID |
| `sessionId` | UUID (FK → sessions.id) | Parent session (cascade delete) |
| `role` | Text | "ai" \| "user" |
| `content` | Text | The actual message content |
| `createdAt` | DateTime (tz) | When this event was created (auto-default now) |

Note: flagged weaknesses are NOT stored in the database. They are collected in-memory during the respond request lifecycle and returned to the client, but not persisted between requests. The feedback agent receives only the transcript text without explicit weakness flags.

### `feedback_reports` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated report ID |
| `sessionId` | UUID (FK → sessions.id) | Parent session (cascade delete) |
| `correctnessNotes` | Text | Assessment of solution correctness |
| `complexityNotes` | Text | Assessment of time/space complexity awareness |
| `communicationNotes` | Text | Assessment of communication clarity |
| `quotedMoments` | JSONB | Array of `{speaker, quote, why}` objects (2-4 moments) |
| `nextSteps` | Text | Actionable next steps for the candidate |
| `createdAt` | DateTime (tz) | When feedback was generated (auto-default now) |

**Example quotedMoments**:
```json
[
  { "speaker": "user", "quote": "I'd use a hash map to store seen numbers", "why": "Correctly identified optimal data structure" },
  { "speaker": "ai", "quote": "What about space complexity?", "why": "Interviewer prompted for missing analysis" }
]
```

## Session Queries

### 1. Create New Session

```typescript
await db.insert(sessions).values({ sessionId: anonId, role, difficulty }).returning();
// Also inserts the initial question prompt as a transcript event:
await db.insert(transcriptEvents).values({ sessionId, role: "ai", content: question.prompt });
```

### 2. Get Session

```typescript
await db.select().from(sessions).where(eq(sessions.id, sessionId));
```

### 3. Get Transcript for Session

```typescript
await db.select()
  .from(transcriptEvents)
  .where(eq(transcriptEvents.sessionId, sessionId))
  .orderBy(asc(transcriptEvents.createdAt));
```

### 4. Add Message to Transcript

```typescript
await db.insert(transcriptEvents).values({ sessionId, role: "user", content: message });
```

### 5. Get Feedback for Session

```typescript
await db.select().from(feedbackReports).where(eq(feedbackReports.sessionId, sessionId));
```

### 6. Mark Session as Completed

```typescript
await db.update(sessions).set({ status: "completed" }).where(eq(sessions.id, sessionId));
```

### 7. List All Sessions for Anonymous User

```typescript
await db.select().from(sessions).where(eq(sessions.sessionId, anonId)).orderBy(desc(sessions.createdAt));
```

## Anonymous Identity Model

### Cookie-Based Tracking

- **Cookie Name**: `iq_session`
- **Value**: UUID (128-bit random)
- **Expiry**: 1 year
- **HttpOnly**: True (not accessible to JavaScript)
- **SameSite**: Lax (CSRF protection)
- **Secure**: True in production
- **Path**: /

### First Visit Flow

```
GET / (no iq_session cookie)
  │
  ├─> getOrCreateAnonId() called
  ├─> Generate UUID via crypto.randomUUID()
  ├─> Set httpOnly cookie
  └─> Return to user with cookie set
```

### Subsequent Visits

```
GET / (iq_session cookie present)
  │
  ├─> getOrCreateAnonId() called
  ├─> Read existing UUID from cookie
  └─> Reuse for all subsequent queries
```

## Data Retention & Privacy

- **No Personal Data**: No names, emails, or identifying information collected
- **No Tracking**: Cookie is the only tracking mechanism
- **Session Lifetime**: Sessions stored indefinitely (no auto-deletion)
- **Cookie Lifetime**: 1 year, then refreshes on next visit
- **GDPR Compliant**: Anonymous, no personal data to collect

## Typical Session Sizes

| Metric | Typical Value |
|--------|---------------|
| Interview Duration | 3–30 minutes (varies by timer preset) |
| Messages per Interview | 6–20 (3–10 user turns) |
| Transcript Size | 2–5 KB |
| Feedback Report | 1–2 KB |
| Total Session Storage | ~10 KB |

## Performance Considerations

- **Indexes**: On `sessions.sessionId`, `transcriptEvents.sessionId`, `feedbackReports.sessionId`
- **Query Patterns**: Mostly append-only (new events, new sessions)
- **Latency**: Sub-100ms for session retrieval (Neon serverless HTTP)
- **Scalability**: No connection pooling needed; each request is stateless
- **Lazy DB initialization**: `getDb()` is called at request time, not module load time, to avoid crash on `next build` before DATABASE_URL is set
