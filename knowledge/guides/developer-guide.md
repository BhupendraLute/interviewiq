---
title: Developer Guide for InterviewIQ
description: Setup, development, and contribution guide for developers
topic: guides
subtopic: developer-guide
audience: developers
updated: 2026-07-18
---

# Developer Guide: InterviewIQ

## Quick Start

### Prerequisites

- Node.js 18+
- Postgres database (Neon recommended)
- OpenAI, OpenRouter, and OpenCode Zen API keys

### Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/interviewiq.git
cd interviewiq

# Install dependencies
npm install

# Environment variables
cp .env.local.example .env.local

# Fill in .env.local with your keys:
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...
OPENCODEZEN_API_KEY=sk-...
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
├── app/                             # Next.js App Router
│   ├── layout.tsx                   # Root layout with Header + Geist font
│   ├── page.tsx                     # Landing page (hero, features, testimonials, CTA)
│   ├── globals.css                  # Tailwind v4 + custom theme
│   ├── styles/
│   │   ├── globals.css              # shadcn-style theme vars
│   │   └── tokens.css               # Design tokens (colors, spacing, etc.)
│   ├── interview/
│   │   ├── create/page.tsx          # Interview config form (role, difficulty, mode)
│   │   └── [id]/
│   │       ├── page.tsx             # Live interview chat (pure UI, logic in hook)
│   │       └── report/page.tsx      # Feedback report (API-driven, structured output)
│   └── api/
│       ├── session/
│       │   ├── start/route.ts       # POST /api/session/start
│       │   └── [id]/
│       │       ├── respond/route.ts # POST /api/session/[id]/respond
│       │       └── finish/route.ts  # GET (fetch report) + POST (generate report)
│       ├── test-model/route.ts      # GET /api/test-model
│       └── test-session/route.ts    # GET /api/test-session
│
├── components/                      # UI components
│   ├── layout/
│   │   └── Header.tsx               # App header with brand + CTA
│   ├── chat/                        # AI conversation UI
│   │   ├── conversation.tsx         # Scrollable conversation container
│   │   ├── message.tsx              # Chat message with role styling
│   │   ├── prompt-input.tsx         # Text input with submit
│   │   ├── suggestion.tsx           # Clickable suggestion chips
│   │   └── shimmer.tsx              # Loading animation
│   ├── interview/
│   │   ├── CodeEditor.tsx           # CodeMirror-based code editor
│   │   └── Whiteboard.tsx           # Drawing whiteboard for system design
│   ├── feedback/
│   │   └── Toast.tsx                # Auto-dismiss notification
│   ├── charts/
│   │   ├── BarChart.tsx             # Chart.js bar chart
│   │   └── RadarChart.tsx           # Chart.js radar chart
│   ├── theme/
│   │   ├── ThemeProvider.tsx        # Next.js themes provider
│   │   └── ThemeToggle.tsx          # Dark/light mode toggle
│   └── ui/                          # shadcn/ui components (25+)
│       ├── button.tsx, card.tsx, input.tsx, select.tsx
│       ├── dialog.tsx, tabs.tsx, badge.tsx, tooltip.tsx
│       └── ... (base-nova style via shadcn CLI)
│
├── hooks/                           # Custom React hooks
│   ├── useInterviewSession.ts       # Interview logic (messages, speech, submission, state)
│   └── useSpeech.ts                 # Speech-to-text & TTS via Web Speech API
│
├── lib/                             # Core logic
│   ├── interview/
│   │   └── types.ts                 # ChatMessage, PanelTab, MobileView, helpers
│   ├── questions.ts                 # Question bank (10 built-in) + CSV/JSON import
│   ├── session.ts                   # Anonymous session management (UUID cookie)
│   ├── callModel.ts                 # Raw OpenAI/OpenRouter/OpenCode Zen chat completions
│   ├── api.ts                       # Client-side API helpers (createSession, respond, finishSession, getReport)
│   ├── hints.ts                     # 3-level progressive hints
│   ├── interviewScoring.ts          # Real-time answer scoring
│   ├── timedMode.ts                 # Timer presets (3/10/20 min)
│   ├── utils.ts                     # cn() utility (clsx + tailwind-merge)
│   ├── db/
│   │   ├── index.ts                 # Lazy Drizzle/Neon init
│   │   └── schema.ts                # Drizzle schema (sessions, transcript_events, feedback_reports)
│   └── agents/
│       ├── interviewerAgent.ts      # Interviewer agent factory + flag_weakness tool
│       ├── feedbackAgent.ts         # Feedback agent factory + structured output
│       ├── providers.ts             # Lazy model initialization (OpenAI, OpenRouter, OpenCode Zen)
│       └── runWithFallback.ts       # Agent-based fallback strategy
│
├── knowledge/                       # OKF knowledge base (this directory)
├── public/                          # Static assets (hero-image.png, SVGs)
├── package.json
├── tsconfig.json
├── next.config.ts
├── drizzle.config.ts
├── eslint.config.mjs
├── postcss.config.mjs
├── components.json                  # shadcn/ui config (base-nova style)
├── .env.local.example
├── AGENTS.md
└── CLAUDE.md
```

---

## Core Concepts for Development

### 1. Anonymous Sessions

Sessions are tied to a UUID cookie, not a user ID.

```typescript
// lib/session.ts
const anonId = await getOrCreateAnonId();
// Sets httpOnly cookie "iq_session" with 1-year expiry
// No auth provider, no user table
```

### 2. Agent-First Architecture

Every interview uses real agents with tool calling:

```typescript
// Interviewer Agent (real-time, mode + role + difficulty aware)
const { finalOutput, provider } = await runAgentWithFallback(
  (model) => {
    flagged.length = 0; // Reset per provider attempt
    return makeInterviewerAgent(model, flagged, mode, isCodeAnswer, role, difficulty);
  },
  transcript
);

// Feedback Agent (at end, role + difficulty + mode aware)
const { finalOutput, provider } = await runAgentWithFallback<FeedbackReport>(
  (model) => makeFeedbackAgent(model, role, difficulty, interviewMode),
  formattedTranscript
);
```

### 3. Fallback Strategy

Two parallel implementations:
- `runAgentWithFallback()` for Agents SDK agents (respond, finish)
- `callModel()` for raw chat completions (test-model)

Both follow the same rules:
- Try OpenAI first
- 400 → fail immediately
- 429 (rate limit) → retry with backoff, then fallback
- 401/403/quota 429/5xx → fallback to OpenRouter
- If OpenRouter also fails → fallback to OpenCode Zen (big-pickle, free)

### 4. Provider Architecture

```typescript
// lib/agents/providers.ts — lazy singleton models
const openaiModel = getOpenAIModel();           // OpenAI client (gpt-4o-mini)
const openrouterModel = getOpenRouterModel();    // OpenRouter via baseURL swap
const openCodeZenModel = getOpenCodeZenModel(); // OpenCode Zen (big-pickle, free)

// Agents are rebuilt per-call with the selected model
// No global setDefaultOpenAIClient()
```

### 5. Database: Lazy Initialization

```typescript
// lib/db/index.ts — NOT constructed at module load time
// Next.js evaluates modules during build step — eager init would crash
export function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}
```

---

## Key Files to Know

### Adding a New Question

**File**: `lib/questions.ts`

```typescript
export const QUESTION_BANK: Question[] = [
  {
    id: "q_new",
    title: "My New Question",
    difficulty: "medium",
    topic: "arrays",
    prompt: "The question prompt here...",
  },
];
```

Or import questions via CSV/JSON at runtime:

```typescript
const imported = normalizeImportedQuestions(csvString);
// Supports: CSV, JSON array, JSON object with "questions" key
```

Then document it in `knowledge/questions/`.

### Modifying the Interviewer Agent

**File**: `lib/agents/interviewerAgent.ts`

Key functions:
- `getInterviewerInstructions(mode, isCodeAnswer)` — builds mode-aware prompt
- `looksLikeCode(answer)` — auto-detects code in candidate answer
- `makeFlagWeaknessTool(collected)` — creates the flag tool
- `makeInterviewerAgent(model, collected, mode, isCodeAnswer)` — factory

### Modifying Feedback Schema

**File**: `lib/agents/feedbackAgent.ts`

```typescript
const feedbackReportSchema = z.object({
  correctnessNotes: z.string(),
  complexityNotes: z.string(),
  communicationNotes: z.string(),
  quotedMoments: z.array(z.object({
    speaker: z.enum(["user", "ai"]),
    quote: z.string(),
    why: z.string(),
  })).min(2).max(4),
  nextSteps: z.string(),
});
```

### Adding API Routes

Next.js App Router auto-maps `app/api/[path]/route.ts` to `/api/[path]`.

```typescript
export async function POST(request: NextRequest) { ... }
export async function GET() { ... }
```

### UI Components

All in `components/`:
- **Header** (`layout/`) — navigation bar with brand link and "New Interview" CTA
- **Chat** (`chat/`) — `Conversation`, `Message`, `PromptInput`, `Suggestion`, `Shimmer` for the interview chat UI
- **Tools** (`interview/`) — `CodeEditor` (CodeMirror), `Whiteboard` (drawing for system design)
- **shadcn/ui** (`ui/`) — 25+ base components (Button, Card, Input, Select, Dialog, Tabs, Badge, Tooltip, etc.) in base-nova style
- **Theme** (`theme/`) — `ThemeProvider`, `ThemeToggle` for dark/light mode
- **Charts** (`charts/`) — `BarChart`, `RadarChart` for feedback display

### Custom Hooks

All in `hooks/`:
- `useInterviewSession.ts` — encapsulates all interview logic (messages, speech integration, submission, keyboard shortcuts, session persistence). Returns state + handlers for the page component.
- `useSpeech.ts` — Web Speech API hook for speech-to-text and text-to-speech.

---

## Development Workflow

### 1. Local Development

```bash
npm run dev    # Starts Next.js dev server on localhost:3000
npm run lint   # ESLint
npm run build  # Type-check + production build
```

### 2. Database Migrations

After modifying `lib/db/schema.ts`:

```bash
npm run db:generate   # Creates migration files in drizzle/
npm run db:push       # Applies to Neon database
```

### 3. Testing Endpoints

```bash
# Verify model fallback chain
curl http://localhost:3000/api/test-model

# Verify DB connectivity
curl http://localhost:3000/api/test-session
```

### 4. End-to-End Flow

```bash
# Start interview
curl -X POST http://localhost:3000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"role":"Frontend Developer","difficulty":"easy"}'

# Get sessionId from response, then:
curl -X POST http://localhost:3000/api/session/<id>/respond \
  -H "Content-Type: application/json" \
  -d '{"message":"I would use a hash map...","mode":"coding"}'

curl -X POST http://localhost:3000/api/session/<id>/finish \
  -H "Content-Type: application/json" -d '{}'
```

---

## Deployment

### Vercel (Recommended)

```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys from main
# Set env vars in Vercel dashboard:
```

### Environment Variables (Production)

```
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...
OPENCODEZEN_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
OPENCODEZEN_MODEL=big-pickle
DATABASE_URL=postgresql://...
APP_URL=https://interviewiq.vercel.app
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

1. Create branch: `git checkout -b fix/bug-name`
2. Reproduce bug
3. Fix and test
4. Push PR

---

## Code Style

- **TypeScript**: Strict mode, no `any`
- **Naming**: camelCase for functions, PascalCase for types
- **Path aliases**: `@/` maps to project root

---

## Architecture Decisions

See `knowledge/system/architecture.md` for detailed rationale.

---

## Support & Questions

- **Issues**: [GitHub Issues](https://github.com/BhupendraLute/interviewiq)
