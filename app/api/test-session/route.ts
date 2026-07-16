import { NextResponse } from "next/server";
import { getOrCreateAnonId } from "@/lib/session";
import { getDb } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/test-session
// Confirms: no-login anon ID works, and it can write/read from Neon.
export async function GET() {
  try {
    const anonId = await getOrCreateAnonId();
    const db = getDb();

    const [row] = await db
      .insert(sessions)
      .values({
        sessionId: anonId,
        role: "SDE-2 Backend",
        difficulty: "medium",
      })
      .returning();

    const existing = await db
      .select()
      .from(sessions)
      .where(eq(sessions.sessionId, anonId));

    return NextResponse.json({
      ok: true,
      anonId,
      createdRow: row,
      totalSessionsForThisBrowser: existing.length,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
