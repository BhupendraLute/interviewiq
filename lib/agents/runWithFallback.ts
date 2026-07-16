import { Agent, run, AgentInputItem } from "@openai/agents";
import { getOpenAIModel, getOpenRouterModel } from "./providers";

/**
 * runAgentWithFallback — the Agents-SDK equivalent of lib/callModel.ts.
 *
 * Because an Agent's model is fixed at construction time in this SDK,
 * we can't swap providers mid-run. Instead, `makeAgent` is a factory
 * that builds a fresh Agent bound to whichever model we pass it. We
 * build the OpenAI-bound agent first and run it; on a qualifying
 * error we build a second agent bound to the OpenRouter model and
 * run that instead. Same error rules as callModel.ts:
 *  - 400 -> rethrow immediately, don't fall back (our bug)
 *  - plain 429 (rate limit, not quota) -> one backoff retry on OpenAI
 *  - 401/403, quota-exhausted 429, or 5xx -> fall back to OpenRouter
 *  - anything else unrecognized -> attempt fallback rather than fail hard
 */

type MakeAgent = (model: ReturnType<typeof getOpenAIModel>) => Agent<any, any>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function getStatus(err: any): number | undefined {
  return err?.status ?? err?.response?.status ?? err?.error?.status;
}

function getCode(err: any): string | undefined {
  return err?.code ?? err?.error?.code ?? err?.error?.error?.code;
}

function isBadRequest(err: any) {
  return getStatus(err) === 400;
}
function isPlainRateLimit(err: any) {
  return getStatus(err) === 429 && getCode(err) !== "insufficient_quota";
}
function isQuotaExhausted(err: any) {
  return getStatus(err) === 429 && getCode(err) === "insufficient_quota";
}
function isAuthFailure(err: any) {
  const s = getStatus(err);
  return s === 401 || s === 403;
}
function isServerError(err: any) {
  const s = getStatus(err);
  return typeof s === "number" && s >= 500;
}

export async function runAgentWithFallback<TOutput = string>(
  makeAgent: MakeAgent,
  input: string | AgentInputItem[]
): Promise<{ finalOutput: TOutput; provider: "openai" | "openrouter" }> {
  const openaiAgent = makeAgent(getOpenAIModel());

  try {
    const result = await run(openaiAgent, input);
    return { finalOutput: result.finalOutput as TOutput, provider: "openai" };
  } catch (err: any) {
    if (isBadRequest(err)) {
      console.error("[runAgentWithFallback] 400 from OpenAI — not falling back, this is our bug:", err.message);
      throw err;
    }

    if (isPlainRateLimit(err)) {
      console.warn("[runAgentWithFallback] OpenAI rate-limited, retrying once after backoff...");
      await sleep(1500);
      try {
        const retryResult = await run(openaiAgent, input);
        return { finalOutput: retryResult.finalOutput as TOutput, provider: "openai" };
      } catch {
        console.warn("[runAgentWithFallback] Retry failed, falling back to OpenRouter.");
      }
    } else if (isAuthFailure(err) || isQuotaExhausted(err) || isServerError(err)) {
      console.warn(
        `[runAgentWithFallback] OpenAI unavailable (status ${getStatus(err)}, code ${getCode(err)}), falling back to OpenRouter.`
      );
    } else {
      console.warn("[runAgentWithFallback] Unrecognized error, attempting OpenRouter fallback:", err.message);
    }

    const openRouterAgent = makeAgent(getOpenRouterModel());
    const fallbackResult = await run(openRouterAgent, input);
    return { finalOutput: fallbackResult.finalOutput as TOutput, provider: "openrouter" };
  }
}
