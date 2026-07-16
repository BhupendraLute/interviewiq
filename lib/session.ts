import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const COOKIE_NAME = "iq_session";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * getOrCreateAnonId — the entire "auth" system for InterviewIQ.
 * No signup, no login screen. First visit gets a UUID in a cookie;
 * every subsequent request from that browser reuses it. This is what
 * ties together a user's sessions/transcripts/feedback in the DB,
 * with zero friction before they can start an interview.
 *
 * Must be called from a Server Component, Route Handler, or Server Action.
 */
export async function getOrCreateAnonId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = randomUUID();
  cookieStore.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
    path: "/",
  });
  return id;
}
