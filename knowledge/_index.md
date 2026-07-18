---
title: InterviewIQ Knowledge Base
description: Open Knowledge Format (OKF) documentation for InterviewIQ, a free AI mock interview platform
version: 1.2.0
language: en
created: 2026-07-17
updated: 2026-07-18
topics:
  - ai-interviews
  - mock-interviews
  - dsa
  - technical-preparation
  - behavioral-interviews
  - system-design
author: OpenAI × NamasteDev Codex Hackathon
source_url: https://github.com/BhupendraLute/interviewiq
---

# InterviewIQ Knowledge Base

This is the Open Knowledge Format (OKF) knowledge base for **InterviewIQ**, a free, no-login AI mock interview platform for technical interview preparation.

## Quick Overview

InterviewIQ provides:
- **Free AI-powered mock interviews** — no signup, no paywall
- **3 interview modes** — Coding (DSA), System Design, and Behavioral
- **Intelligent interviewer agent** — asks real follow-ups based on your actual answer, not generic scripts; adapts to all 3 modes
- **Structured feedback reports** — quotes specific moments from your conversation instead of generic advice
- **Pseudonymous sessions** — identity is a UUID cookie for session continuity; no name, email, or login required
- **CSV / JSON question import** — upload your own question bank
- **Fallback AI provider** — automatic OpenRouter fallback when OpenAI quota is exhausted

## Knowledge Structure

### [System Documentation](system/)
Architecture, data models, authentication, and deployment details.

- [Architecture Overview](system/architecture.md) — tech stack, agent SDK, and deployment model
- [Session Model](system/sessions.md) — how interviews are stored and tracked
- [Interview Flow](system/interview-flow.md) — step-by-step breakdown of the interview process

### [Agent Documentation](agents/)
Details about the AI agents that power the interview.

- [Interviewer Agent](agents/interviewer-agent.md) — the real-time interviewer with the `flag_weakness` tool; supports coding, system-design, and behavioral modes
- [Feedback Agent](agents/feedback-agent.md) — produces structured feedback reports from transcripts via Zod-validated structured output

### [Question Bank](questions/)
Complete database of interview questions by difficulty and topic.

- [Easy Questions](questions/easy-questions.md) — foundational DSA (Two Sum, Valid Parentheses, Reverse Linked List)
- [Medium Questions](questions/medium-questions.md) — intermediate challenges (Longest Substring, Binary Tree, Islands, Coin Change)
- [Hard Questions](questions/hard-questions.md) — expert-level problems (LIS, Merge K Sorted Lists, Word Ladder)

### [User Guides](guides/)
How InterviewIQ works from a user and developer perspective.

- [How to Take an Interview](guides/user-guide.md) — step-by-step for candidates
- [Developer Guide](guides/developer-guide.md) — setup, contributing, and extending
- [API Reference](guides/api-reference.md) — session and feedback endpoints

---

## Key Concepts

**Agent-First Architecture**: Every interview uses two real agents via the OpenAI Agents SDK:
1. **Interviewer Agent** — listens to your answer, calls `flag_weakness` when it spots a gap, asks sharp follow-ups; adapts its behavior to coding, system-design, or behavioral mode
2. **Feedback Agent** — reads the full transcript, produces a Zod-validated structured report with correctness, complexity, communication notes, quoted moments, and next steps

**Fallback Model Architecture**: All AI calls are wrapped in a three-tier fallback strategy:
- Try OpenAI first (`gpt-4o-mini`)
- Backoff + retry on rate limiting
- Automatic fallback to OpenRouter (`meta-llama/llama-3.1-8b-instruct:free`) on quota exhausted or auth failures
- Last resort fallback to OpenCode Zen (`big-pickle`, free)
- The `flagged` array is reset per provider attempt inside the factory callback

**Anonymous-First**: No user table, no login. First visit gets a UUID cookie; all data is tied to that cookie.

**Serverless Database**: Neon Postgres via Drizzle ORM with HTTP driver — no connection pooling, no persistent connections.

---

## Quick Links

- **Live App**: [InterviewIQ](https://interviewiq.example.com) <!-- not deployed currently -->
- **GitHub**: [InterviewIQ Repository](https://github.com/BhupendraLute/interviewiq)
- **OKF Spec**: [GitHub knowledge-catalog](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)
