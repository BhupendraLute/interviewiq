---
title: InterviewIQ Knowledge Base
description: Open Knowledge Format (OKF) documentation for InterviewIQ, a free AI mock interview platform
version: 1.0.0
language: en
created: 2026-07-17
updated: 2026-07-17
topics:
  - ai-interviews
  - mock-interviews
  - dsa
  - technical-preparation
author: OpenAI × NamasteDev Codex Hackathon
source_url: https://github.com/yourusername/interviewiq
---

# InterviewIQ Knowledge Base

This is the Open Knowledge Format (OKF) knowledge base for **InterviewIQ**, a free, no-login AI mock interview platform for technical interview preparation.

## Quick Overview

InterviewIQ provides:
- **Free AI-powered mock interviews** — no signup, no paywall
- **Intelligent interviewer agent** — asks real follow-ups based on your actual answer, not generic scripts
- **Structured feedback reports** — quotes specific moments from your conversation instead of generic advice
- **Multiple roles and difficulties** — customize your interview experience
- **Anonymous sessions** — no user tracking, identity is a UUID cookie

## Knowledge Structure

### [System Documentation](system/)
Architecture, data models, authentication, and deployment details.

- [Architecture Overview](system/architecture.md) — tech stack, agent SDK, and deployment model
- [Session Model](system/sessions.md) — how interviews are stored and tracked
- [Interview Flow](system/interview-flow.md) — step-by-step breakdown of the interview process

### [Agent Documentation](agents/)
Details about the AI agents that power the interview.

- [Interviewer Agent](agents/interviewer-agent.md) — the real-time interviewer with the `flag_weakness` tool
- [Feedback Agent](agents/feedback-agent.md) — produces structured feedback reports from transcripts

### [Question Bank](questions/)
Complete database of interview questions by difficulty and topic.

- [Easy Questions](questions/easy-questions.md) — foundational DSA (Two Sum, Valid Parentheses, Reverse Linked List)
- [Medium Questions](questions/medium-questions.md) — intermediate challenges (Longest Substring, Binary Tree, Islands)
- [Hard Questions](questions/hard-questions.md) — expert-level problems (LIS, Trapping Rain Water 2D)

### [User Guides](guides/)
How InterviewIQ works from a user and developer perspective.

- [How to Take an Interview](guides/user-guide.md) — step-by-step for candidates
- [Developer Guide](guides/developer-guide.md) — setup, contributing, and extending
- [API Reference](guides/api-reference.md) — session and feedback endpoints

---

## Key Concepts

**Agent-First Architecture**: Every interview is two real agents working together:
1. **Interviewer Agent** — listens to your answer, calls `flag_weakness` when it spots a gap, asks sharp follow-ups
2. **Feedback Agent** — reads the full transcript, produces a structured report with specific feedback

**Fallback Model Architecture**: All AI calls are wrapped in a fallback strategy:
- Try OpenAI first
- Backoff + retry on rate limiting
- Automatic fallback to OpenRouter on quota exhausted or auth failures

**Anonymous-First**: No user table, no login. First visit gets a UUID cookie; all data is tied to that cookie.

---

## Quick Links

- **Live App**: [InterviewIQ](https://interviewiq.example.com)
- **GitHub**: [repo link]
- **OKF Spec**: [GitHub knowledge-catalog](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)
