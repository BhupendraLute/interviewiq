import OpenAI from "openai";
import { OpenAIChatCompletionsModel } from "@openai/agents";

/**
 * Three OpenAI-compatible clients, three Model instances. OpenRouter and OpenCode Zen
 * mirror the OpenAI chat completions schema, so pointing the standard `openai`
 * client at their baseURL — then wrapping it in
 * OpenAIChatCompletionsModel — is the supported way to run Agents SDK
 * agents against a non-OpenAI backend (same pattern used for Ollama/
 * LM Studio in the SDK's own examples).
 *
 * We deliberately do NOT use setDefaultOpenAIClient() to swap providers
 * globally — that's a process-wide default, not a per-call fallback.
 * Instead we build three complete Model instances and choose between them
 * per call in runWithFallback.ts.
 *
 * All three are lazily constructed via getOpenAIModel()/getOpenRouterModel()/getOpenCodeZenModel().
 * The `openai` client throws immediately if no API key is present
 * anywhere it looks, and Next.js evaluates route modules during the
 * build's page-data-collection step — so eager (module-top-level)
 * construction would crash `next build` on a fresh clone before
 * .env.local is set up.
 */

export const OPENAI_MODEL_NAME = process.env.OPENAI_MODEL || "gpt-4o-mini";
export const OPENROUTER_MODEL_NAME =
  process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free";
export const OPENCODEZEN_MODEL_NAME =
  process.env.OPENCODEZEN_MODEL || "big-pickle";

let _openaiModel: OpenAIChatCompletionsModel | null = null;
let _openRouterModel: OpenAIChatCompletionsModel | null = null;
let _openCodeZenModel: OpenAIChatCompletionsModel | null = null;

export function getOpenAIModel(): OpenAIChatCompletionsModel {
  if (_openaiModel) return _openaiModel;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  // Verified constructor signature (checked against installed
  // @openai/agents-openai type defs): positional (client, model, options).
  _openaiModel = new OpenAIChatCompletionsModel(client, OPENAI_MODEL_NAME);
  return _openaiModel;
}

export function getOpenRouterModel(): OpenAIChatCompletionsModel {
  if (_openRouterModel) return _openRouterModel;
  const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": process.env.APP_URL || "https://interviewiq.vercel.app",
      "X-Title": "InterviewIQ",
    },
  });
  _openRouterModel = new OpenAIChatCompletionsModel(client, OPENROUTER_MODEL_NAME);
  return _openRouterModel;
}

export function getOpenCodeZenModel(): OpenAIChatCompletionsModel {
  if (_openCodeZenModel) return _openCodeZenModel;
  const client = new OpenAI({
    apiKey: process.env.OPENCODEZEN_API_KEY,
    baseURL: "https://opencode.ai/zen/v1",
  });
  _openCodeZenModel = new OpenAIChatCompletionsModel(client, OPENCODEZEN_MODEL_NAME);
  return _openCodeZenModel;
}
