import { NextRequest, NextResponse } from "next/server";
import { getOrCreateAnonId } from "@/lib/session";
import { getDb } from "@/lib/db";
import { sessions, transcriptEvents } from "@/lib/db/schema";
import { pickQuestion } from "@/lib/questions";

// POST /api/session/start
// Body: { role: string, difficulty: "easy" | "medium" | "hard" }
export async function POST(req: NextRequest) {
  try {
    const { role, difficulty } = await req.json();

    if (!role || !difficulty) {
      return NextResponse.json(
        { ok: false, error: "role and difficulty are required" },
        { status: 400 }
      );
    }

    const anonId = await getOrCreateAnonId(); // ensures the anon cookie is set, no login involved
    const db = getDb();

    const question = pickQuestion(difficulty);

    const [session] = await db
      .insert(sessions)
      .values({
        sessionId: anonId,
        role,
        difficulty,
      })
      .returning();

    await db.insert(transcriptEvents).values({
      sessionId: session.id,
      role: "ai",
      content: question.prompt,
    });

    return NextResponse.json({
      ok: true,
      sessionId: session.id,
      question: {
        title: question.title,
        prompt: question.prompt,
        difficulty: question.difficulty,
      },
    });
  } catch (err: any) {
    console.error("[session/start] failed:", err);
    return NextResponse.json({ ok: false, error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
