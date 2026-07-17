export type InterviewMode = "coding" | "system-design" | "behavioral";

export type AnswerScore = {
  score: number;
  strength: "weak" | "medium" | "strong";
  focusAreas: string[];
  summary: string;
};

const MODE_LABELS: Record<InterviewMode, string> = {
  coding: "coding interview",
  "system-design": "system design interview",
  behavioral: "behavioral interview",
};

export function getInterviewModeLabel(mode: InterviewMode): string {
  return MODE_LABELS[mode];
}

export function scoreAnswer(answer: string, mode: InterviewMode = "coding"): AnswerScore {
  const normalized = answer.toLowerCase();
  let score = 30;
  const focusAreas: string[] = [];

  if (normalized.length > 80) score += 10;
  if (normalized.length > 180) score += 10;

  const structureSignals = ["first", "then", "next", "finally", "i would", "step", "approach"];
  if (structureSignals.some((signal) => normalized.includes(signal))) score += 10;

  const complexitySignals = [
    "time complexity",
    "space complexity",
    "big-o",
    "big o",
    "o(n",
    "o(log",
    "o(1",
    "tradeoff",
    "trade-off",
    "scal",
    "optimi",
    "worst",
    "best",
    "average",
  ];
  if (complexitySignals.some((signal) => normalized.includes(signal))) score += 20;
  else focusAreas.push("Add time/space complexity thinking");

  const edgeCaseSignals = ["edge case", "edge-case", "empty", "null", "duplicate", "corner", "invalid", "boundary"];
  if (edgeCaseSignals.some((signal) => normalized.includes(signal))) score += 15;
  else focusAreas.push("Discuss edge cases");

  const exampleSignals = ["example", "for example", "case", "scenario", "illustrat"];
  if (exampleSignals.some((signal) => normalized.includes(signal))) score += 10;
  else focusAreas.push("Use a concrete example");

  const communicationSignals = ["because", "therefore", "however", "instead", "alternative", "why"];
  if (communicationSignals.some((signal) => normalized.includes(signal))) score += 10;
  else focusAreas.push("Explain your reasoning more clearly");

  if (mode === "coding") {
    const codeSignals = ["for", "while", "if", "return", "hash", "map", "stack", "queue", "tree", "graph", "array"];
    if (codeSignals.some((signal) => normalized.includes(signal))) score += 10;
    else focusAreas.push("Mention a concrete algorithm or data structure");
  }

  if (mode === "system-design") {
    const designSignals = ["service", "database", "latency", "cache", "api", "scale", "partition", "tradeoff", "throughput"];
    if (designSignals.some((signal) => normalized.includes(signal))) score += 10;
    else focusAreas.push("Discuss system constraints and tradeoffs");
  }

  if (mode === "behavioral") {
    const behavioralSignals = ["situation", "task", "action", "result", "learned", "impact", "team"];
    if (behavioralSignals.some((signal) => normalized.includes(signal))) score += 10;
    else focusAreas.push("Use a STAR-style structure");
  }

  score = Math.min(100, Math.max(0, score));

  const strength: AnswerScore["strength"] = score >= 75 ? "strong" : score >= 50 ? "medium" : "weak";
  const summary =
    strength === "strong"
      ? "This answer showed clear structure and useful depth."
      : strength === "medium"
        ? "This answer had some useful substance, but it could be sharper."
        : "This answer needs more structure and concrete reasoning.";

  return {
    score,
    strength,
    focusAreas: focusAreas.slice(0, 3),
    summary,
  };
}
