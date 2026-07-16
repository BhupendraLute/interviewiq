# InterviewIQ

Free, no-login AI mock technical interviews — an open alternative to paid
tools like AlgoExpert and Pramp. Built for the OpenAI × NamasteDev Codex
Hackathon (July 2026).

Pick a role and difficulty, work through a DSA question with an AI
interviewer that probes your *actual* submission (not generic follow-ups),
then get a feedback report that quotes specific moments from the
conversation instead of giving generic advice.

**No signup. No login. No paywall.** Open the URL, click one button, start
interviewing.

## Why it exists

Mock interviews are expensive or require a human partner. InterviewIQ
removes both barriers — free to use, available any time, no waiting for a
peer to be free.

## Tech stack

- **Next.js (App Router) + TypeScript + Tailwind CSS** — frontend and
  serverless API routes in one deployable unit
- **OpenAI Agents SDK** (`@openai/agents`) — the interview loop is built as
  real agents, not a single prompt-in/text-out call:
  - an **Interviewer agent** with a `flag_weakness` tool it calls when it
    spots a concrete gap in the candidate's answer
  - a **Feedback agent** using structured output (Zod schema) to produce a
    reliable JSON report, no manual markdown-fence-stripping needed
- **Drizzle ORM + Neon Postgres** (serverless HTTP driver) — session,
  transcript, and feedback storage
- **Anonymous sessions** — identity is a single httpOnly UUID cookie
  (`lib/session.ts`), no user table, no auth provider, ever

## Architecture: OpenAI-primary, OpenRouter-fallback

Every AI call is wrapped in `lib/agents/runWithFallback.ts` (and the lower-
level `lib/callModel.ts` for any non-agent calls):

1. Try OpenAI first.
2. On a genuine request bug (`400`) — fail immediately, don't mask it.
3. On plain rate limiting (`429`, not quota) — one short backoff retry on
   OpenAI before falling back.
4. On auth failure, exhausted quota, or a `5xx` — fall back automatically
   to OpenRouter (same OpenAI-compatible schema, different model).

This exists for resilience against free-tier quota limits, and every
response is tagged with which provider actually served it.

## Running locally

\`\`\`bash
npm install
cp .env.local.example .env.local   # fill in real keys
npm run db:push                    # pushes the schema to your Neon DB
npm run dev
\`\`\`

Required env vars (see `.env.local.example`):
- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` (free key at openrouter.ai/keys)
- `DATABASE_URL` (from your Neon project dashboard)
- `APP_URL`

## Deploying

Deploy directly to Vercel (free tier). Set the same env vars in the Vercel
project settings. No auth/login gating should be enabled on the deployment
— the app must be reachable by anyone with the link, no access request.

## Built with OpenAI Codex

This project was built using OpenAI Codex throughout development, per the
hackathon requirements.
