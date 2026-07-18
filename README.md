# InterviewIQ

**Free, no-login AI mock interview platform** — practice coding (DSA), system design, and behavioral interviews with a real AI interviewer that asks sharp follow-ups based on your actual answers.

Built for the **NamasteDev Codex Hackathon** with Next.js 16, React 19, OpenAI Agents SDK, Drizzle ORM, and Neon Postgres.

## Quick Start

```bash
npm install
# Copy .env.local.example → .env.local, fill in your keys
npm run db:push
npm run dev
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui (base-nova) |
| AI Agents | OpenAI Agents SDK (`@openai/agents`) |
| Database | Drizzle ORM + Neon Postgres (serverless HTTP) |
| Auth | Anonymous UUID cookie (no login) |
| Validation | Zod |
| Charts | Chart.js + react-chartjs-2 |
| Streaming | streamdown |
| Motion | motion (Framer Motion) |

---

## High-Level Design

```mermaid
graph TB
    subgraph Client["Client (Browser)"]
        L["Landing Page<br/>(/)"]
        CF["Create Form<br/>(/interview/create)"]
        IP["Interview Page<br/>(/interview/[id])"]
        RP["Report Page<br/>(/interview/[id]/report)"]
    end

    subgraph Server["Next.js Server"]
        API["API Routes<br/>(/api/session/*)"]

        subgraph DB["Neon Postgres"]
            S["sessions"]
            TE["transcript_events"]
            FR["feedback_reports"]
        end

        subgraph Agents["AI Agent Layer"]
            IA["Interviewer Agent<br/>mode + role + difficulty aware<br/>flag_weakness tool"]
            FA["Feedback Agent<br/>Zod structured output<br/>role + difficulty + mode aware"]
            FB["Fallback Strategy<br/>OpenAI → OpenRouter → OpenCode Zen"]
        end

        subgraph Hooks["Custom Hooks"]
            US["useInterviewSession<br/>messages, speech, state"]
            USR["useSpeech<br/>STT & TTS"]
        end
    end

    subgraph External["External APIs"]
        OAI["OpenAI<br/>gpt-4o-mini"]
        OR["OpenRouter<br/>llama-3.1-8b-instruct:free"]
        OCZ["OpenCode Zen<br/>big-pickle"]
    end

    L --> CF
    CF --> API
    API --> DB
    API --> Agents
    Agents --> FB
    FB --> OAI
    FB --> OR
    FB --> OCZ
    API --> IP
    IP --> Hooks
    IP --> RP
    RP --> API
```

---

## Low-Level Design

### Component Architecture

```mermaid
graph LR
    subgraph Pages["Pages"]
        L["landing/page.tsx"]
        CF["interview/create/page.tsx"]
        IP["interview/[id]/page.tsx"]
        RP["interview/[id]/report/page.tsx"]
    end

    subgraph Hooks["Custom Hooks"]
        UIS["useInterviewSession"]
        US["useSpeech"]
    end

    subgraph Components["Components"]
        H["layout/Header.tsx"]
        C["chat/*<br/>(Conversation, Message,<br/>PromptInput, Suggestion,<br/>Shimmer)"]
        T["interview/*<br/>(CodeEditor, Whiteboard)"]
        CH["charts/*<br/>(BarChart, RadarChart)"]
        UI["ui/*<br/>(button, dialog,<br/>tooltip, popover, etc)"]
        TH["theme/*<br/>(ThemeProvider,<br/>ThemeToggle)"]
    end

    subgraph API["API Routes"]
        START["POST /api/session/start"]
        RESP["POST /api/session/[id]/respond"]
        FIN["GET+POST /api/session/[id]/finish"]
        TM["GET /api/test-model"]
        TS["GET /api/test-session"]
    end

    IP --> UIS
    IP --> C
    IP --> T
    IP --> UI
    IP --> H
    UIS --> US
    UIS --> API
    RP --> CH
    RP --> UI
    L --> H
    CF --> START
```

### Agent Architecture

```mermaid
flowchart TB
    subgraph Interviewer["Interviewer Agent Flow"]
        direction TB
        TR["Load Transcript<br/>(history)"]
        META["Load Session Metadata<br/>(role, difficulty)"]
        CD["Code Detection<br/>looksLikeCode()"]
        AG["mode-aware +<br/>role-aware +<br/>difficulty-aware<br/>instructions"]
        FW["flag_weakness tool<br/>(topic, note)"]
        FQ["Generate follow-up<br/>2-4 sentences"]
    end

    subgraph Feedback["Feedback Agent Flow"]
        direction TB
        FT["Format Transcript<br/>USER/AI labels"]
        FM["Load Session Metadata<br/>(role, difficulty, mode)"]
        ZOD["Zod-validated<br/>structured output"]
        RP2["Generate report<br/>(scores + notes + quotes)"]
    end

    subgraph Fallback["Fallback Chain"]
        direction LR
        OAI["OpenAI<br/>gpt-4o-mini"]
        OR["OpenRouter<br/>llama-3.1-8b-instruct:free"]
        OCZ["OpenCode Zen<br/>big-pickle"]
    end

    TR --> CD --> AG
    META --> AG
    AG --> FW --> FQ
    FQ --> Fallback

    FT --> FM --> ZOD --> RP2
    RP2 --> Fallback

    Fallback --> |"fail → next"| OAI
    OAI --> OR --> OCZ
```

### Database Schema

```mermaid
erDiagram
    sessions {
        uuid id PK
        text sessionId "anon cookie UUID"
        text role "e.g. SDE-2 Backend"
        text difficulty "easy | medium | hard"
        text status "in_progress | completed"
        timestamp createdAt
    }
    transcript_events {
        uuid id PK
        uuid sessionId FK
        text role "ai | user"
        text content
        timestamp createdAt
    }
    feedback_reports {
        uuid id PK
        uuid sessionId FK
        int overallScore "0-100"
        int correctnessScore "0-100"
        int complexityScore "0-100"
        int communicationScore "0-100"
        text correctnessNotes
        text complexityNotes
        text communicationNotes
        jsonb quotedMoments "{speaker, quote, why}[]"
        text nextSteps
        timestamp createdAt
    }

    sessions ||--o{ transcript_events : "sessionId"
    sessions ||--o| feedback_reports : "sessionId"
```

---

## Data Flow

### Start Interview

```mermaid
sequenceDiagram
    participant U as User
    participant F as Create Form
    participant S as Server
    participant C as Cookie Store
    participant D as Database
    participant Q as Question Bank

    U->>F: Fill role, difficulty, mode
    F->>S: POST /api/session/start
    S->>C: getOrCreateAnonId()
    alt New Visitor
        C->>S: Generate UUID
        S->>C: Set iq_session cookie
    else Returning Visitor
        C->>S: Return existing UUID
    end
    S->>D: INSERT sessions(sessionId, role, difficulty)
    S->>Q: pickQuestion(difficulty)
    Q->>S: Return question prompt
    S->>D: INSERT transcript_event(role: ai, question)
    S->>F: Return { sessionId, question }
    F->>U: Navigate to /interview/[id]
```

### Answer → Follow-up Loop

```mermaid
sequenceDiagram
    participant U as User
    participant P as Interview Page
    participant H as useInterviewSession
    participant S as Server
    participant D as Database
    participant A as Interviewer Agent

    U->>P: Type/speak answer
    P->>H: handleSubmit(text)
    H->>S: POST /api/session/[id]/respond
    S->>D: INSERT transcript_event(role: user)
    S->>D: SELECT transcript history
    S->>D: SELECT session(role, difficulty)
    S->>A: Create agent(mode, role, difficulty)
    S->>A: Run agent(transcript)
    alt Weakness Found
        A->>A: flag_weakness(topic, note)
    end
    A->>S: Return follow-up + flags
    S->>D: INSERT transcript_event(role: ai)
    S->>H: Return { reply, flagged }
    alt autoSpeak
        H->>H: speak(reply)
    end
    H->>P: Append AI message
    P->>U: Display follow-up
```

### Finish → Report

```mermaid
sequenceDiagram
    participant U as User
    participant P as Interview Page
    participant H as useInterviewSession
    participant S as Server
    participant D as Database
    participant A as Feedback Agent

    U->>P: Click "End Interview"
    P->>H: handleFinish()
    H->>S: POST /api/session/[id]/finish { mode }
    S->>D: SELECT session(role, difficulty)
    S->>D: SELECT transcript history
    S->>A: Create agent(role, difficulty, mode)
    S->>A: Run agent(transcript)
    A->>S: Return structured report
    S->>D: INSERT feedback_report
    S->>D: UPDATE session(status: completed)
    S->>H: Return report
    H->>P: Navigate to /report
    P->>U: Display feedback
    U->>P: View scores, notes, quotes, next steps
```

### Fallback Chain

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant OAI as OpenAI
    participant OR as OpenRouter
    participant OCZ as OpenCode Zen
    participant D as Database

    C->>S: POST /api/session/[id]/respond
    S->>D: Save user message
    S->>D: Load transcript + session
    S->>OAI: Run Interviewer Agent
    alt OpenAI Succeeds
        OAI->>S: Reply + flags
    else 400 Bad Request
        OAI-->>S: Error (our bug, don't retry)
        S-->>C: 500 Error
    else 429 Rate Limited
        OAI-->>S: Rate limit
        S->>OAI: Retry with backoff
        alt Retry Succeeds
            OAI->>S: Reply + flags
        else Retry Fails
            OAI-->>S: Still failing
            S->>OR: Fallback - Run agent
            alt OpenRouter Succeeds
                OR->>S: Reply + flags
            else OpenRouter Fails
                OR-->>S: Error
                S->>OCZ: Fallback - Run agent
                OCZ->>S: Reply + flags
            end
        end
    else 401/403/429(quota)/5xx
        OAI-->>S: Auth/quota/server error
        S->>OR: Fallback - Run agent
        alt OpenRouter Succeeds
            OR->>S: Reply + flags
        else OpenRouter Fails
            OR-->>S: Error
            S->>OCZ: Fallback - Run agent
            OCZ->>S: Reply + flags
        end
    end
    S->>D: Save AI reply
    S->>C: { reply, flagged, provider }
```

---

## Project Structure

```
interviewiq/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Landing page
│   ├── layout.tsx          # Root layout with Header + font
│   ├── interview/
│   │   ├── create/         # Interview config form
│   │   └── [id]/           # Live interview + report
│   └── api/session/        # Start, respond, finish endpoints
├── components/
│   ├── layout/             # Header
│   ├── chat/               # Conversation, Message, PromptInput, etc.
│   ├── interview/          # CodeEditor, Whiteboard
│   ├── charts/             # BarChart, RadarChart
│   ├── theme/              # ThemeProvider, ThemeToggle
│   └── ui/                 # shadcn/ui primitives (25+)
├── hooks/                  # useInterviewSession, useSpeech
├── lib/                    # Core logic (agents, db, questions, etc.)
└── knowledge/              # OKF documentation
```

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/session/start` | Create interview, pick question |
| POST | `/api/session/[id]/respond` | Submit answer, get follow-up |
| GET | `/api/session/[id]/finish` | Fetch existing report |
| POST | `/api/session/[id]/finish` | End interview, generate report |
| GET | `/api/test-model` | Verify AI fallback chain |
| GET | `/api/test-session` | Verify DB connectivity |

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **OpenAI Agents SDK** | Real tool calling (flag_weakness) + structured outputs (Zod) |
| **Three-tier fallback** | Free interviews survive OpenAI/OpenRouter quota limits |
| **Serverless DB (Neon HTTP)** | No connection pooling, stateless routes |
| **Anonymous sessions** | Zero friction — no login before first interview |
| **UI/Logic separation** | `hooks/useInterviewSession` keeps page.tsx pure JSX |
| **Multi-mode interviews** | Single codebase serves coding, system-design, behavioral |
| **CSV/JSON import** | Users practice on their own question banks |

## Environment Variables

```
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...
OPENCODEZEN_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
OPENCODEZEN_MODEL=big-pickle
DATABASE_URL=postgresql://...
APP_URL=http://localhost:3000
```

## Knowledge Base

InterviewIQ uses the **Open Knowledge Format (OKF)** for AI-readable documentation:

```
knowledge/_index.md           → start here
knowledge/system/             → architecture, sessions, interview-flow
knowledge/agents/             → interviewer-agent, feedback-agent
knowledge/questions/          → question bank (easy/medium/hard)
knowledge/guides/             → user-guide, developer-guide, api-reference
```

## License

MIT — see [LICENSE](./LICENSE).
