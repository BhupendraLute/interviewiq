import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import type { getOpenAIModel } from "./providers";
import type { InterviewMode } from "@/lib/interviewScoring";

/**
 * flagWeakness — a real tool call, not just text generation. When the
 * interviewer agent notices a specific gap in the candidate's answer
 * (missed edge case, wrong complexity claim, etc.) it calls this to log
 * a structured signal. We capture what it flags via the tool's own
 * execute function (closure over an array passed in), then feed those
 * flags into the feedback agent later — this is the "agent actually
 * taking an action" moment worth highlighting in the demo.
 */
export function makeFlagWeaknessTool(collected: { topic: string; note: string }[]) {
  return tool({
    name: "flag_weakness",
    description:
      "Log a specific weakness or gap you noticed in the candidate's current answer, so it can be referenced in their final feedback report.",
    parameters: z.object({
      topic: z.string().describe("Short label, e.g. 'time complexity', 'edge case: empty input'"),
      note: z.string().describe("One sentence on what was missed or wrong"),
    }),
    async execute({ topic, note }) {
      collected.push({ topic, note });
      return `Logged: ${topic}`;
    },
  });
}

export function looksLikeCode(answer: string): boolean {
  const normalized = answer.toLowerCase();
  const codeSignals = [
    "function ",
    "const ",
    "let ",
    "var ",
    "class ",
    "=>",
    "return ",
    "if (",
    "for (",
    "while (",
    "console.log",
    "{",
    "}",
    ";",
    "import ",
    "export ",
    "def ",
    "public static",
    "private",
  ];

  return codeSignals.some((signal) => normalized.includes(signal));
}

function difficultyDescriptor(difficulty: string): string {
  const map: Record<string, string> = {
    easy: "This is an easy-level question. The candidate should be expected to solve it comfortably. Probe for basic understanding, common edge cases, and whether they can clearly explain their reasoning.",
    medium: "This is a medium-level question. Expect a solid approach with some nuanced discussion. Probe for optimization awareness, tradeoffs, and less obvious edge cases.",
    hard: "This is a hard-level question. The candidate may need guidance. Probe for their problem-solving process, how they break down complexity, and whether they can identify optimal approaches even if implementation is partial.",
  };
  return map[difficulty] ?? map.medium;
}

function getInterviewerInstructions(mode: InterviewMode, isCodeAnswer: boolean, role: string, difficulty: string) {
  const modeSpecific = {
    coding: `You are running a coding interview for a ${role} role. Focus on algorithm correctness, data structure choice, time/space complexity, and edge cases. Tailor your follow-ups to the skills expected of a ${role} — if the role is senior, expect deeper system-level thinking even on coding questions.`,
    "system-design": `You are running a system design interview for a ${role} role. Focus on architecture decisions, component breakdown, scaling, tradeoffs, data flow, and resilience. Align the depth of your probes with the seniority implied by ${role}.`,
    behavioral: `You are running a behavioral interview for a ${role} role. Focus on specific past experiences, ownership, collaboration, conflict resolution, impact, and lessons learned. Probe for concrete examples with measurable outcomes relevant to a ${role}.`,
  }[mode];

  const codeInstruction = isCodeAnswer
    ? "The candidate just shared code or pseudocode. Probe implementation details, edge cases, performance, or how the solution behaves on tricky inputs."
    : "Focus on the strongest concrete gap in their reasoning.";

  return `You are an experienced technical interviewer conducting a live ${mode} mock interview for a **${role}** position.

${difficultyDescriptor(difficulty)}

You have just seen the candidate's submitted approach or code for the current question. Respond with ONE sharp, specific follow-up question grounded in what they actually wrote. Never ask a generic canned question.

${modeSpecific}
${codeInstruction}

If you notice a specific, concrete weakness (not a vague concern), call flag_weakness to log it before responding.

Keep your response to 2-4 sentences. Tone: professional, direct, encouraging but honest — like a real interviewer, not a cheerleader.`;
}

/**
 * makeInterviewerAgent — factory so runAgentWithFallback can build a
 * fresh instance bound to either the OpenAI or OpenRouter model.
 */
export function makeInterviewerAgent(
  model: ReturnType<typeof getOpenAIModel>,
  collected: { topic: string; note: string }[],
  mode: InterviewMode = "coding",
  isCodeAnswer = false,
  role = "Software Engineer",
  difficulty = "medium"
) {
  return new Agent({
    name: "InterviewIQ Interviewer",
    instructions: getInterviewerInstructions(mode, isCodeAnswer, role, difficulty),
    model,
    tools: [makeFlagWeaknessTool(collected)],
  });
}
