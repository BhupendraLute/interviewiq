import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { transcriptEvents, feedbackReports, sessions } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { runAgentWithFallback } from "@/lib/agents/runWithFallback";
import { makeFeedbackAgent, FeedbackReport } from "@/lib/agents/feedbackAgent";

// GET /api/session/[id]/finish — fetch existing report
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: sessionId } = await params;
    const db = getDb();

    const [report] = await db
      .select()
      .from(feedbackReports)
      .where(eq(feedbackReports.sessionId, sessionId))
      .limit(1);

    if (!report) {
      return NextResponse.json({ ok: false, error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      report: {
        overallScore: report.overallScore,
        correctnessScore: report.correctnessScore,
        complexityScore: report.complexityScore,
        communicationScore: report.communicationScore,
        correctnessNotes: report.correctnessNotes,
        complexityNotes: report.complexityNotes,
        communicationNotes: report.communicationNotes,
        quotedMoments: report.quotedMoments,
        nextSteps: report.nextSteps,
      },
    });
  } catch (err: any) {
    console.error("[finish GET] failed:", err);
    return NextResponse.json({ ok: false, error: err.message ?? "Unknown error" }, { status: 500 });
  }
}

// POST /api/session/[id]/finish — complete session and generate report
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: sessionId } = await params;
    const db = getDb();
    const { mode } = await req.json().catch(() => ({ mode: "coding" }));

    // Load session metadata for role-aware, difficulty-aware feedback.
    const [session] = await db
      .select({ role: sessions.role, difficulty: sessions.difficulty })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    const role = session?.role ?? "Software Engineer";
    const difficulty = session?.difficulty ?? "medium";
    const interviewMode = (mode as string) ?? "coding";

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
      (model) => makeFeedbackAgent(model, role, difficulty, interviewMode),
      `Here is the full interview transcript:\n\n${transcriptText}`
    );

    await db.insert(feedbackReports).values({
      sessionId,
      overallScore: Math.round(finalOutput.overallScore),
      correctnessScore: Math.round(finalOutput.correctnessScore),
      complexityScore: Math.round(finalOutput.complexityScore),
      communicationScore: Math.round(finalOutput.communicationScore),
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
