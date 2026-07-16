import { Agent } from "@openai/agents";
import { z } from "zod";
import type { getOpenAIModel } from "./providers";

/**
 * Structured output schema for the feedback report. Passing this as
 * `outputType` makes the SDK use structured outputs under the hood —
 * no manual "strip markdown fences and hope" JSON parsing needed,
 * unlike the raw-fetch version in lib/prompts.ts.
 */
export const feedbackReportSchema = z.object({
  correctnessNotes: z.string(),
  complexityNotes: z.string(),
  communicationNotes: z.string(),
  quotedMoments: z
    .array(
      z.object({
        speaker: z.enum(["user", "ai"]),
        quote: z.string(),
        why: z.string(),
      })
    )
    .min(2)
    .max(4),
  nextSteps: z.string(),
});

export type FeedbackReport = z.infer<typeof feedbackReportSchema>;

const FEEDBACK_INSTRUCTIONS = `You are analyzing a completed technical mock interview transcript.

Produce a structured feedback report covering correctness, complexity awareness, and communication clarity. quotedMoments MUST reference things actually said in the transcript you were given — never invent examples. Include 2-4 quoted moments, each with why it mattered. nextSteps should be concrete and actionable, not generic encouragement.

If a list of flagged weaknesses is included in the input, make sure each one is reflected somewhere in your notes or quoted moments.`;

export function makeFeedbackAgent(model: ReturnType<typeof getOpenAIModel>) {
  return new Agent({
    name: "InterviewIQ Feedback Analyst",
    instructions: FEEDBACK_INSTRUCTIONS,
    model,
    outputType: feedbackReportSchema,
  });
}
