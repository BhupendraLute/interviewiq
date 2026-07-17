import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { transcriptEvents } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { runAgentWithFallback } from "@/lib/agents/runWithFallback";
import { looksLikeCode, makeInterviewerAgent } from "@/lib/agents/interviewerAgent";
import type { InterviewMode } from "@/lib/interviewScoring";

// POST /api/session/[id]/respond
// Body: { message: string }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: sessionId } = await params;
    const db = getDb();
    const { message, mode } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ ok: false, error: "message is required" }, { status: 400 });
    }

    // 1. Log the candidate's submission.
    await db.insert(transcriptEvents).values({
      sessionId,
      role: "user",
      content: message,
    });

    // 2. Load full transcript so the agent has context.
    const history = await db
      .select()
      .from(transcriptEvents)
      .where(eq(transcriptEvents.sessionId, sessionId))
      .orderBy(asc(transcriptEvents.createdAt));

    const agentInput = history.map((row) => ({
      role: row.role === "user" ? ("user" as const) : ("assistant" as const),
      content: row.content,
    }));

    // 3. Run the interviewer agent (OpenAI first, OpenRouter fallback).
    const flagged: { topic: string; note: string }[] = [];
    const interviewMode = (mode as InterviewMode | undefined) ?? "coding";
    const isCodeAnswer = looksLikeCode(message);
    const { finalOutput, provider } = await runAgentWithFallback<string>(
      (model) => makeInterviewerAgent(model, flagged, interviewMode, isCodeAnswer),
      agentInput as any
    );

    // 4. Log the AI's follow-up.
    await db.insert(transcriptEvents).values({
      sessionId,
      role: "ai",
      content: finalOutput,
    });

    return NextResponse.json({ ok: true, reply: finalOutput, provider, flagged });
  } catch (err: any) {
    console.error("[respond] failed:", err);
    return NextResponse.json({ ok: false, error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
