import { NextRequest, NextResponse } from "next/server";
import { callModel } from "@/lib/callModel";

// Quick sanity-check route — hit this to confirm the fallback chain works
// before wiring it into the real interview flow.
// GET /api/test-model
export async function GET(_req: NextRequest) {
  try {
    const result = await callModel([
      { role: "system", content: "You are a concise assistant." },
      { role: "user", content: "Reply with exactly: 'callModel is working.'" },
    ]);

    return NextResponse.json({
      ok: true,
      provider: result.provider,
      model: result.model,
      content: result.content,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
