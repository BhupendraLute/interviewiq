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
  overallScore: z.number().min(0).max(100),
  correctnessScore: z.number().min(0).max(100),
  complexityScore: z.number().min(0).max(100),
  communicationScore: z.number().min(0).max(100),
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

function getFeedbackInstructions(role: string, difficulty: string, mode: string): string {
  return `You are analyzing a completed ${mode} mock interview for a **${role}** position at **${difficulty}** difficulty.

This was a ${mode} interview. Score each dimension relative to what would be expected for a ${role} at this difficulty level.

Score each dimension from 0-100 based on actual performance. Be honest — a score in the 40-70 range is typical for a practice interview and gives the candidate room to improve. Reserve 85+ for genuinely excellent answers.

- overallScore: weighted aggregate reflecting the full interview
- correctnessScore: how accurate and complete the solution/answers were for a ${role} at ${difficulty} level
- complexityScore: did they proactively analyze time & space complexity (for coding) or architecture tradeoffs (for system design)
- communicationScore: clarity, structure, how they walked through their thinking

Produce detailed text notes for each dimension. quotedMoments MUST reference things actually said in the transcript you were given — never invent examples. Include 2-4 quoted moments, each with why it mattered. nextSteps should be concrete and actionable for someone aiming for a ${role} role, not generic encouragement.

Format correctnessNotes, complexityNotes, communicationNotes, and nextSteps using Markdown for readability. Use numbered lists (1. 2. 3.) for sequential items, **bold** for key concepts, and blank lines between paragraphs. Put each list item on its own line.

If a list of flagged weaknesses is included in the input, make sure each one is reflected somewhere in your notes or quoted moments.`;
}

export function makeFeedbackAgent(
  model: ReturnType<typeof getOpenAIModel>,
  role = "Software Engineer",
  difficulty = "medium",
  mode = "coding"
) {
  return new Agent({
    name: "InterviewIQ Feedback Analyst",
    instructions: getFeedbackInstructions(role, difficulty, mode),
    model,
    outputType: feedbackReportSchema,
  });
}
