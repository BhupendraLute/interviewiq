---
title: Developer Guide for InterviewIQ
description: Setup, development, and contribution guide for developers
topic: guides
subtopic: developer-guide
audience: developers
updated: 2026-07-17
---

# Developer Guide: InterviewIQ

## Quick Start

### Prerequisites

- Node.js 18+
- Postgres database (Neon recommended)
- OpenAI and OpenRouter API keys

### Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/interviewiq.git
cd interviewiq

# Install dependencies
npm install

# Environment variables
cp .env.example .env.local

# Add to .env.local:
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-...
DATABASE_URL=postgresql://...

# Generate Drizzle client
npm run db:generate

# Push schema to database
npm run db:push

# Start development server
npm run dev
```

Visit `http://localhost:3000`.

---

## Project Structure

```
interviewiq/
├── knowledge/                    # OKF knowledge base
│   ├── _index.md
│   ├── system/
│   │   ├── architecture.md
│   │   ├── sessions.md
│   │   └── interview-flow.md
│   ├── agents/
│   │   ├── interviewer-agent.md
│   │   └── feedback-agent.md
│   ├── questions/
│   │   ├── easy-questions.md
│   │   ├── medium-questions.md
│   │   └── hard-questions.md
│   └── guides/
│       ├── user-guide.md
│       ├── developer-guide.md
│       └── api-reference.md
│
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home / question selector
│   ├── globals.css
│   └── api/
│       ├── session/
│       │   ├── start/route.ts    # POST /api/session/start
│       │   └── [id]/
│       │       ├── respond/route.ts
│       │       └── finish/route.ts
│       ├── test-model/route.ts
│       └── test-session/route.ts
│
├── lib/                         # Core logic
│   ├── questions.ts             # Question bank (QUESTION_BANK array)
│   ├── session.ts               # Anonymous session management
│   ├── callModel.ts             # Raw API call wrapper
│   ├── db/
│   │   ├── index.ts             # Database queries (drizzle orm)
│   │   └── schema.ts            # Drizzle schema (sessions, transcript, feedback)
│   └── agents/
│       ├── interviewerAgent.ts   # Interviewer agent factory + flag_weakness tool
│       ├── feedbackAgent.ts      # Feedback agent factory + structured output
│       ├── providers.ts          # Model initialization (OpenAI, OpenRouter)
│       └── runWithFallback.ts    # Fallback strategy wrapper
│
├── public/                      # Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
├── drizzle.config.ts
└── knowledge/                   # This file you're reading
```

---

## Core Concepts for Development

### 1. Anonymous Sessions

Sessions are tied to a UUID cookie, not a user ID.

```typescript
// Get or create anon ID (lib/session.ts)
const anonId = await getOrCreateAnonId();

// All subsequent calls use this ID
// No auth provider, no user table
```

### 2. Agent-First Architecture

Every interview is real agents working together:

```typescript
// Interviewer Agent (real-time)
const agent = makeInterviewerAgent(model, collected);
const response = await agent.run(transcript);

// Feedback Agent (at end)
const feedbackAgent = makeFeedbackAgent(model);
const report = await feedbackAgent.run(transcript);
```

### 3. Fallback Strategy

All AI calls wrapped for resilience:

```typescript
// lib/agents/runWithFallback.ts
const result = await runWithFallback({
  openaiCall: () => callOpenAI(prompt),
  openrouterCall: () => callOpenRouter(prompt),
  onFallback: () => logFallback(),
});
```

### 4. Zod Validation

Structured output for reliability:

```typescript
const FeedbackSchema = z.object({
  score: z.number().min(1).max(10),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  // ...
});

const parsed = FeedbackSchema.parse(agentOutput);
```

---

## Key Files to Know

### Adding a New Question

**File**: `lib/questions.ts`

```typescript
export const QUESTION_BANK: Question[] = [
  // existing questions...
  {
    id: "q_new",
    title: "My New Question",
    difficulty: "medium",
    topic: "arrays",
    prompt: "The question prompt here...",
  },
];
```

Then document it in `knowledge/questions/medium-questions.md`.

### Modifying the Interviewer Agent

**File**: `lib/agents/interviewerAgent.ts`

```typescript
const INTERVIEWER_INSTRUCTIONS = `
Your new instructions here...
`;

// Tool remains the same
export function makeFlagWeaknessTool(collected: ...) { ... }
```

### Modifying Feedback Schema

**File**: `lib/agents/feedbackAgent.ts`

```typescript
const FeedbackSchema = z.object({
  // Add new fields here
  newField: z.string(),
  // ...
});
```

### Adding API Routes

**File**: `app/api/[path]/route.ts`

```typescript
export async function POST(request: Request) {
  // Handler logic
}
```

Next.js automatically maps to `/api/[path]`.

---

## Development Workflow

### 1. Local Development

```bash
npm run dev
```

Starts Next.js dev server on `localhost:3000` with hot reload.

### 2. Database Migrations

After modifying `lib/db/schema.ts`:

```bash
npm run db:generate   # Creates migration files
npm run db:push       # Applies to DB
```

### 3. Testing Endpoints

Use the debug endpoints:

```bash
curl http://localhost:3000/api/test-model
curl http://localhost:3000/api/test-session
```

Or manually start an interview in the UI.

### 4. Debugging

```typescript
// Use console.log for server-side logs
console.log("Debug info:", data);

// Use browser DevTools for client-side
// Network tab for API calls
// React DevTools for component state
```

---

## Deployment

### Vercel (Recommended)

```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys from main
# Set env vars in Vercel dashboard
```

### Environment Variables (Production)

```
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-...
DATABASE_URL=postgresql://...
NODE_ENV=production
```

### Database

Neon Postgres is serverless-friendly:
- No connection pooling needed
- HTTP API driver
- Auto-scales with load

---

## Common Tasks

### Add a New Feature

1. Create branch: `git checkout -b feature/my-feature`
2. Implement code
3. Update OKF docs in `knowledge/`
4. Test locally
5. Push and create PR

### Fix a Bug

1. Create issue if not exists
2. Create branch: `git checkout -b fix/bug-name`
3. Reproduce bug
4. Fix and test
5. Push PR with "Fixes #123"

### Performance Optimization

- Profile with DevTools
- Check slow API routes (agent timeouts)
- Optimize DB queries (add indexes)
- Review fallback strategy effectiveness

### Monitoring in Production

```bash
# Logs (Vercel)
vercel logs

# Database (Neon)
# Check admin console at console.neon.tech

# Model usage
# Track API costs from OpenAI/OpenRouter dashboards
```

---

## Testing

### Manual Testing

Visit the app, take an interview end-to-end:
1. Start interview (easy)
2. Submit answer
3. Respond to follow-ups
4. Finish interview
5. Review feedback

### Unit Testing

```bash
npm test
```

(Not yet implemented; add Jest config if needed.)

### E2E Testing

```bash
npm run e2e
```

(Not yet implemented; Playwright would be good.)

---

## Troubleshooting

### "OpenAI quota exhausted"

Fallback to OpenRouter should kick in automatically. Check logs:
```bash
vercel logs | grep openrouter
```

### "Database connection error"

```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Restart dev server
npm run dev
```

### "Agent response is empty"

- Check model is initialized correctly
- Verify API keys are set
- Check fallback logic in `runWithFallback.ts`

### "Session ID not found"

- Verify cookie is being set (Chrome DevTools → Cookies)
- Check DB has the session record
- Verify session ID is being passed correctly

---

## Contributing

We welcome contributions! Please:

1. Fork the repo
2. Create a feature branch
3. Make changes
4. Update OKF documentation
5. Test thoroughly
6. Submit PR with description

---

## Code Style

- **TypeScript**: Strict mode, no `any`
- **Naming**: camelCase for functions, PascalCase for types/classes
- **Comments**: Explain *why*, not *what*
- **OKF Docs**: Keep knowledge base up-to-date

---

## Architecture Decisions

See `knowledge/system/architecture.md` for detailed rationale on:
- Why OpenAI Agents SDK
- Why serverless DB
- Why anonymous sessions
- Why fallback strategy

---

## Support & Questions

- **Issues**: [GitHub Issues](https://github.com)
- **Discussions**: [GitHub Discussions](https://github.com)
- **Email**: dev@interviewiq.example.com
