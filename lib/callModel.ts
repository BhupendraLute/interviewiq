/**
 * callModel — single entrypoint for all AI calls in InterviewIQ.
 *
 * Strategy:
 *  1. Try OpenAI first (primary).
 *  2. On auth failure (401) or quota exhaustion (429 insufficient_quota)
 *     or server error (5xx) -> fall back to OpenRouter automatically.
 *  3. On plain rate-limiting (429 without insufficient_quota) -> brief
 *     backoff retry against OpenAI itself before falling back.
 *  4. On 400 (bad request) -> do NOT fall back; that's our bug, not a
 *     provider issue. Throw immediately so it surfaces during dev.
 *
 * Both providers speak the OpenAI-compatible chat completions schema,
 * so the request body is shared between them.
 */

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type CallModelResult = {
  content: string;
  provider: "openai" | "openrouter";
  model: string;
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Swap these freely without touching call sites.
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callOpenAI(
  messages: ChatMessage[],
  { temperature = 0.7, max_tokens = 800 }: { temperature?: number; max_tokens?: number } = {}
): Promise<CallModelResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err: any = new Error("OPENAI_API_KEY missing");
    err.status = 401;
    throw err;
  }

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature,
      max_tokens,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err: any = new Error(body?.error?.message || `OpenAI error ${res.status}`);
    err.status = res.status;
    err.code = body?.error?.code; // e.g. "insufficient_quota"
    err.type = body?.error?.type;
    throw err;
  }

  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    provider: "openai",
    model: OPENAI_MODEL,
  };
}

async function callOpenRouter(
  messages: ChatMessage[],
  { temperature = 0.7, max_tokens = 800 }: { temperature?: number; max_tokens?: number } = {}
): Promise<CallModelResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY missing — cannot fall back");
  }

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      // OpenRouter asks for these but they're optional/cosmetic
      "HTTP-Referer": process.env.APP_URL || "https://interviewiq.vercel.app",
      "X-Title": "InterviewIQ",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      temperature,
      max_tokens,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `OpenRouter error ${res.status}`);
  }

  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    provider: "openrouter",
    model: OPENROUTER_MODEL,
  };
}

function isQuotaExhausted(err: any): boolean {
  return err?.status === 429 && err?.code === "insufficient_quota";
}

function isPlainRateLimit(err: any): boolean {
  return err?.status === 429 && err?.code !== "insufficient_quota";
}

function isAuthFailure(err: any): boolean {
  return err?.status === 401 || err?.status === 403;
}

function isServerError(err: any): boolean {
  return typeof err?.status === "number" && err.status >= 500;
}

function isBadRequest(err: any): boolean {
  return err?.status === 400;
}

export async function callModel(
  messages: ChatMessage[],
  options?: { temperature?: number; max_tokens?: number }
): Promise<CallModelResult> {
  try {
    return await callOpenAI(messages, options);
  } catch (err: any) {
    // Our bug (bad prompt/schema) — surface it, don't mask with a fallback.
    if (isBadRequest(err)) {
      console.error("[callModel] OpenAI 400 — not retrying, this is a request bug:", err.message);
      throw err;
    }

    // Plain rate limiting: brief backoff, retry OpenAI once before falling back.
    if (isPlainRateLimit(err)) {
      console.warn("[callModel] OpenAI rate-limited, retrying once after backoff...");
      await sleep(1500);
      try {
        return await callOpenAI(messages, options);
      } catch (retryErr) {
        console.warn("[callModel] Retry failed, falling back to OpenRouter.");
        return await callOpenRouter(messages, options);
      }
    }

    // Auth failure, quota exhausted, or server error -> fall back immediately.
    if (isAuthFailure(err) || isQuotaExhausted(err) || isServerError(err)) {
      console.warn(
        `[callModel] OpenAI unavailable (${err.status ?? "no status"} ${err.code ?? ""}), falling back to OpenRouter.`
      );
      return await callOpenRouter(messages, options);
    }

    // Unknown error shape — safest default is to still try the fallback
    // rather than hard-fail the whole interview.
    console.warn("[callModel] Unrecognized OpenAI error, attempting OpenRouter fallback:", err.message);
    return await callOpenRouter(messages, options);
  }
}
