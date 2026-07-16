import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { transcriptEvents, feedbackReports, sessions } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { runAgentWithFallback } from "@/lib/agents/runWithFallback";
import { makeFeedbackAgent, FeedbackReport } from "@/lib/agents/feedbackAgent";

// POST /api/session/[id]/finish
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: sessionId } = await params;
    const db = getDb();

    await db.update(sessions).set({ status: "completed" }).where(eq(sessions.id, sessionId));

    const history = await db
      .select()
      .from(transcriptEvents)
      .where(eq(transcriptEvents.sessionId, sessionId))
      .orderBy(asc(transcriptEvents.createdAt));

    const transcriptText = history
      .map((row) => `${row.role.toUpperCase()}: ${row.content}`)
      .join("\n\n");

    const { finalOutput, provider } = await runAgentWithFallback<FeedbackReport>(
      (model) => makeFeedbackAgent(model),
      `Here is the full interview transcript:\n\n${transcriptText}`
    );

    await db.insert(feedbackReports).values({
      sessionId,
      correctnessNotes: finalOutput.correctnessNotes,
      complexityNotes: finalOutput.complexityNotes,
      communicationNotes: finalOutput.communicationNotes,
      quotedMoments: finalOutput.quotedMoments,
      nextSteps: finalOutput.nextSteps,
    });

    return NextResponse.json({ ok: true, report: finalOutput, provider });
  } catch (err: any) {
    console.error("[finish] failed:", err);
    return NextResponse.json({ ok: false, error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
