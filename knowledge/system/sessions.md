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
│  • Feedback agent reads transcript   │
│  • Structured report generated       │
│  • Feedback report persisted to DB   │
│  • Session status → "completed"      │
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
| `overallScore` | Integer (0–100) | Weighted aggregate score for the full interview |
| `correctnessScore` | Integer (0–100) | Accuracy and completeness of solutions / answers |
| `complexityScore` | Integer (0–100) | Time & space complexity analysis depth |
| `communicationScore` | Integer (0–100) | Clarity, structure, and articulation quality |
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

### 6. Finish Session (Generate Feedback First, Then Mark Complete)

Feedback generation runs BEFORE the status update so a failure leaves the session in "in_progress" for retry.

```typescript
// 1. Generate and persist feedback report
const report = await runAgentWithFallback<FeedbackReport>(...);
await db.insert(feedbackReports).values({ sessionId, ...report });

// 2. Then mark session as completed
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
User submits /interview/create form (no iq_session cookie)
  │
  └─> POST /api/session/start
        │
        ├─> getOrCreateAnonId() called
        │     ├─> Generate UUID via crypto.randomUUID()
        │     └─> Set httpOnly cookie (iq_session)
        │
        ├─> Insert session row (sessions.sessionId = anonId)
        ├─> Pick question, insert initial transcript event
        └─> Return { sessionId, question } to client
```

### Subsequent Visits

```
GET / (iq_session cookie present)
  │
  ├─> getOrCreateAnonId() called
  ├─> Read existing UUID from cookie
  └─> Reuse for all subsequent queries
```

## Data Retention, Privacy & Legal

This section documents how InterviewIQ handles data. It does not constitute legal advice; operators should obtain independent legal review for their jurisdiction.

- **Collected Data**: A pseudonymous UUID cookie (`iq_session`, 1-year max-age, httpOnly, sameSite=lax) stored in the visitor's browser. The cookie UUID is stored in `sessions.sessionId`. Related transcripts (`transcript_events`) and feedback reports (`feedback_reports`) reference `sessions.id` via foreign key — they are reached by joining through the `sessions` table, not by matching the cookie UUID directly. No name, email, or direct identifier is collected.
- **Legal Classification**: The UUID cookie and linked session data may constitute **personal data** under regulations such as GDPR (Article 4(1)) or similar frameworks, because it distinguishes a specific browser/device over time. Pseudonymisation reduces but does not eliminate privacy obligations.
- **Cookie Lifetime**: 1 year; extends on each visit via `maxAge`. Visitors can clear it via browser settings, which breaks continuity but does not delete server-side data.
- **Retention**: Sessions and feedback are stored indefinitely (no auto-deletion). There is no user-facing data deletion mechanism.
- **Production Deployment Blocked**: This project MUST NOT be deployed to production serving real users until:
  - A data deletion / erasure endpoint is implemented
  - A data access / portability endpoint is implemented
  - A cookie consent banner is implemented (if governed by ePrivacy Directive / GDPR)
  - Automated purge of sessions older than a configurable retention window is implemented
  - An approved data retention and legal plan exists
- **Legal Review**: Operators should confirm:
  - Whether a Data Protection Impact Assessment (DPIA) is needed
  - Whether a lawful basis for processing exists (e.g. legitimate interests, consent)
  - Whether cookie consent is required under local ePrivacy rules
  - Whether international transfer safeguards apply (if operators or cloud providers are outside the visitor's jurisdiction)

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
