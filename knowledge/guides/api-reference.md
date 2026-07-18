---
title: API Reference
description: Complete API endpoint documentation
topic: guides
subtopic: api
audience: developers
updated: 2026-07-18
---

# API Reference

## Overview

InterviewIQ exposes a minimal set of REST API endpoints for starting, conducting, and finishing interviews. All responses include metadata about which AI provider handled the request.

**Base URL**: `https://interviewiq.example.com/api`

---

## Authentication

All requests are **automatically scoped** to the user's anonymous UUID cookie:

```
Cookie: iq_session=<uuid>
```

No explicit authentication headers needed. If the cookie doesn't exist, the server creates one via `getOrCreateAnonId()`.

---

## Endpoints

### 1. Start Interview

**POST** `/session/start`

Initiates a new interview session.

#### Request Body

```json
{
  "role": "backend_engineer",
  "difficulty": "medium",
  "questions": []        // optional: custom question bank (JSON array, CSV string, or object)
}
```

#### Response

```json
{
  "ok": true,
  "sessionId": "uuid-12345",
  "question": {
    "title": "Binary Tree Level Order Traversal",
    "prompt": "Given the root of a binary tree, how would you return the values level by level, left to right?",
    "difficulty": "medium"
  }
}
```

#### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Invalid role or difficulty |
| 500 | Server error |

#### Notes

- Accepts optional `questions` field for custom question bank import (CSV string, JSON array, or JSON object with `questions` key)
- The selected question prompt is inserted as the first `transcript_events` entry (role: "ai")
- Cookie is set/read automatically

#### Example

```bash
curl -X POST https://interviewiq.example.com/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"role":"backend_engineer","difficulty":"easy"}'
```

---

### 2. Submit Response

**POST** `/session/[id]/respond`

Submit a candidate's answer and get the interviewer's follow-up.

#### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Session ID from start response |

#### Request Body

```json
{
  "message": "I'd use a hash map to store seen numbers...",
  "mode": "coding"
}
```

#### Response

```json
{
  "ok": true,
  "reply": "Good approach. Walk me through the space complexity and edge cases.",
  "flagged": [
    {
      "topic": "space complexity",
      "note": "Didn't mention O(n) space trade-off"
    }
  ],
  "provider": "openai"
}
```

#### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Message is required |
| 500 | Server error or model failure |

#### Notes

- `mode` field: `"coding"` | `"system-design"` | `"behavioral"` (defaults to `"coding"`)
- `message` is inserted into `transcript_events` before the agent runs
- Agent reads full transcript history for context
- `flagged` array contains weaknesses the agent spotted this turn (in-memory only, not persisted to DB)
- `provider` is either `"openai"` or `"openrouter"` (fallback)

#### Example

```bash
curl -X POST https://interviewiq.example.com/api/session/uuid-12345/respond \
  -H "Content-Type: application/json" \
  -d '{"message":"I would use a hash map...", "mode":"coding"}'
```

---

### 3. Finish Interview / Get Report

The finish endpoint supports both **GET** (fetch existing report) and **POST** (generate new report).

#### 3a. Get Existing Report

**GET** `/session/[id]/finish`

Fetches an existing feedback report for a completed session.

##### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Session ID from start response |

##### Response

```json
{
  "ok": true,
  "report": {
    "correctnessNotes": "Correctly identified the hash map O(n) approach...",
    "complexityNotes": "Initial answer didn't mention space complexity...",
    "communicationNotes": "Clear and confident...",
    "quotedMoments": [
      {
        "speaker": "user",
        "quote": "I'd use a hash map...",
        "why": "Quickly identified optimal approach"
      }
    ],
    "nextSteps": "Practice proactively stating both time and space complexity..."
  }
}
```

##### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success — report found |
| 404 | Report not found (session may not be completed yet) |
| 500 | Server error |

##### Example

```bash
curl https://interviewiq.example.com/api/session/uuid-12345/finish
```

---

#### 3b. Generate Report

**POST** `/session/[id]/finish`

Ends the interview and generates a feedback report.

##### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | Session ID from start response |

##### Request Body

```json
{}
```

(Empty body)

##### Response

```json
{
  "ok": true,
  "report": {
    "correctnessNotes": "Correctly identified the hash map O(n) approach...",
    "complexityNotes": "Initial answer didn't mention space complexity...",
    "communicationNotes": "Clear and confident...",
    "quotedMoments": [
      {
        "speaker": "user",
        "quote": "I'd use a hash map...",
        "why": "Quickly identified optimal approach"
      }
    ],
    "nextSteps": "Practice proactively stating both time and space complexity..."
  },
  "provider": "openai"
}
```

##### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 500 | Feedback generation error |

##### Notes

- Updates session status to `"completed"`
- Formats transcript as `USER: ...\n\nAI: ...` text
- Feedback agent generates Zod-validated structured output
- Result saved to `feedback_reports` table
- Response includes `provider` field indicating which AI handled the request

##### Example

```bash
curl -X POST https://interviewiq.example.com/api/session/uuid-12345/finish \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Debug Endpoints

### Test Model

**GET** `/test-model`

Verify the full fallback chain (OpenAI → OpenRouter) works.

```json
{
  "ok": true,
  "provider": "openai",
  "model": "gpt-4o-mini",
  "content": "callModel is working."
}
```

### Test Session

**GET** `/test-session`

Create a test session row and verify DB connectivity.

```json
{
  "ok": true,
  "anonId": "uuid-...",
  "createdRow": { "id": "...", "sessionId": "...", ... },
  "totalSessionsForThisBrowser": 1
}
```

---

## Error Response Format

All errors follow the format:

```json
{
  "ok": false,
  "error": "Session not found"
}
```

Example: `400` on missing required fields, `500` on server/agent errors.

---

## Rate Limiting

- OpenAI: Free tier or paid plan limits apply
- OpenRouter: Per API key limits
- InterviewIQ: No hard rate limit on endpoint calls (fallback strategy handles backend limits)

---

## Webhook / Event Streaming

**Not currently supported**.

---

## Changelog

### v1.2.0 (Current)

- ✅ `/session/start` — create interview (with optional custom question import)
- ✅ `/session/[id]/respond` — submit answer with mode selection, get follow-up
- ✅ `/session/[id]/finish` (GET) — fetch existing feedback report
- ✅ `/session/[id]/finish` (POST) — end interview, generate structured feedback
- ✅ `/test-model` — verify fallback chain
- ✅ `/test-session` — verify DB connectivity
