---
title: Session Model & Data Storage
description: How InterviewIQ stores and manages interview sessions
topic: data-model
subtopic: database
related:
  - architecture.md
  - interview-flow.md
updated: 2026-07-17
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
│  • Session marked complete           │
└──────────────────────────────────────┘
```

## Database Schema

### `sessions` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Session ID (linked to transcript/feedback) |
| `anonId` | UUID (FK) | Anonymous user ID (from cookie) |
| `questionId` | String | Reference to question from question bank |
| `role` | String | e.g., "backend engineer", "frontend engineer" |
| `difficulty` | String | "easy" \| "medium" \| "hard" |
| `createdAt` | DateTime | Interview start time |
| `finishedAt` | DateTime \| Null | Interview end time (null if in progress) |
| `provider` | String | "openai" \| "openrouter" (which model served the interview) |

### `transcript` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Message ID |
| `sessionId` | UUID (FK) | Parent session |
| `role` | String | "user" \| "interviewer" |
| `message` | Text | The actual message content |
| `timestamp` | DateTime | When this message was sent |
| `flaggedWeaknesses` | JSON[] | Weaknesses flagged by agent on interviewer turn |

**Example flaggedWeaknesses**:
```json
[
  { "topic": "time complexity", "note": "Claimed O(n) but wrote O(n²)" },
  { "topic": "edge case: empty array", "note": "No null check before accessing [0]" }
]
```

### `feedback` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Feedback report ID |
| `sessionId` | UUID (FK) | Parent session |
| `report` | JSON | Structured feedback (Zod-validated schema) |
| `createdAt` | DateTime | When feedback was generated |

**Report Schema** (Zod structure):
```typescript
{
  score: number,                    // 1-10 overall score
  strengths: string[],              // Specific strong moments with quotes
  weaknesses: string[],             // Specific gaps from flagged_weakness calls
  recommendations: string[],        // Next steps for improvement
  codeQuality: string,              // Notes on submitted code
  communicationQuality: string      // How well they explained approach
}
```

## Session Queries

### 1. Create New Session

```sql
INSERT INTO sessions (id, anonId, questionId, role, difficulty, createdAt)
VALUES (uuid(), $anonId, $questionId, $role, $difficulty, now())
RETURNING *;
```

### 2. Get Session

```sql
SELECT * FROM sessions WHERE id = $sessionId;
```

### 3. Get Transcript for Session

```sql
SELECT * FROM transcript 
WHERE sessionId = $sessionId
ORDER BY timestamp ASC;
```

### 4. Add Message to Transcript

```sql
INSERT INTO transcript (id, sessionId, role, message, timestamp, flaggedWeaknesses)
VALUES (uuid(), $sessionId, $role, $message, now(), $flaggedWeaknesses);
```

### 5. Get Feedback for Session

```sql
SELECT * FROM feedback WHERE sessionId = $sessionId;
```

### 6. List All Sessions for Anonymous User

```sql
SELECT * FROM sessions 
WHERE anonId = $anonId
ORDER BY createdAt DESC;
```

## Anonymous Identity Model

### Cookie-Based Tracking

- **Cookie Name**: `iq_session`
- **Value**: UUID (128-bit random)
- **Expiry**: 1 year
- **HttpOnly**: True (not accessible to JavaScript)
- **SameSite**: Lax (CSRF protection)
- **Secure**: True in production

### First Visit Flow

```
GET / (no iq_session cookie)
  │
  ├─> getOrCreateAnonId() called
  ├─> Generate UUID
  ├─> Set httpOnly cookie
  ├─> INSERT into anon_users table (optional, for tracking)
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
- **GDPR Compliant**: Anonymous, no personal data to comply with

## Typical Session Sizes

| Metric | Typical Value |
|--------|---------------|
| Interview Duration | 15–30 minutes |
| Messages per Interview | 8–15 (4–7 user turns) |
| Transcript Size | 2–5 KB |
| Feedback Report | 1–2 KB |
| Total Session Storage | ~10 KB |

## Performance Considerations

- **Indexes**: On `sessionId`, `anonId`, `createdAt`
- **Query Patterns**: Mostly append-only (new messages, new sessions)
- **Latency**: Sub-100ms for session retrieval (Neon serverless HTTP)
- **Scalability**: No connection pooling needed; each request is stateless
