import type { InterviewMode } from "./interviewScoring";

export type HintRequest = {
  prompt: string;
  answer: string;
  mode: InterviewMode;
  hintLevel: number;
};

function getPromptSignal(prompt: string): string {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("linked list")) return "linked-list";
  if (normalized.includes("tree")) return "tree";
  if (normalized.includes("graph")) return "graph";
  if (normalized.includes("string")) return "string";
  if (normalized.includes("array")) return "array";
  if (normalized.includes("parenth")) return "parentheses";
  return "general";
}

export function buildProgressiveHint({ prompt, answer, mode, hintLevel }: HintRequest): string {
  const normalizedAnswer = answer.toLowerCase();
  const promptSignal = getPromptSignal(prompt);
  const safeLevel = Math.min(3, Math.max(1, hintLevel));

  const genericHints = {
    coding: [
      "Hint 1: Start by naming the core idea you would use first, such as a data structure, traversal, or algorithm pattern.",
      "Hint 2: Think about the tricky cases that could break your approach, especially input size, empties, duplicates, or ordering.",
      "Hint 3: Now make your reasoning more concrete by explaining the runtime and a clean implementation path.",
    ],
    "system-design": [
      "Hint 1: Begin with the main components and the way data moves between them.",
      "Hint 2: Focus on the bottlenecks, where scale or latency could become a problem.",
      "Hint 3: Add the tradeoffs you would accept, such as consistency, complexity, or cost.",
    ],
    behavioral: [
      "Hint 1: Choose one concrete story and anchor your answer in a specific situation and action.",
      "Hint 2: Make your answer more structured by covering the challenge, your role, and the outcome.",
      "Hint 3: Add what you learned and why it changed the way you work.",
    ],
  }[mode];

  const promptHints: Record<string, string[]> = {
    "linked-list": [
      "Hint 1: Think about how pointers move as you traverse the list.",
      "Hint 2: Try to identify which node references need to be updated in place.",
      "Hint 3: Explain how your approach handles the head and tail safely.",
    ],
    tree: [
      "Hint 1: Consider whether you need a recursive or iterative traversal strategy.",
      "Hint 2: Think about the queue or stack that would keep track of each level or branch.",
      "Hint 3: Make sure your approach handles null children and leaf nodes correctly.",
    ],
    graph: [
      "Hint 1: Think about whether you need to visit nodes more than once.",
      "Hint 2: Consider using a queue or stack to manage frontier nodes.",
      "Hint 3: Explain how you would avoid revisiting the same node.",
    ],
    string: [
      "Hint 1: Look for repeated characters, substrings, or bracket patterns that can be tracked efficiently.",
      "Hint 2: Think about what information you need to carry between positions.",
      "Hint 3: Explain how you would handle the edge cases that make the problem tricky.",
    ],
    array: [
      "Hint 1: Identify whether you need to scan, sort, or use extra state.",
      "Hint 2: Think about whether the answer can be improved from a brute-force approach.",
      "Hint 3: Add a note about the tradeoff between time and space.",
    ],
    parentheses: [
      "Hint 1: Think about the order in which characters appear.",
      "Hint 2: Consider a structure that remembers what needs to be closed next.",
      "Hint 3: Explain how your approach behaves on an empty or invalid input.",
    ],
  };

  const tailored = promptHints[promptSignal] ?? genericHints;

  if (safeLevel === 2 && normalizedAnswer.includes("i would")) {
    return `${tailored[1]} If you want, describe your first step in one sentence and then the next one.`;
  }

  if (safeLevel === 3 && (normalizedAnswer.includes("i" ) || normalizedAnswer.includes("think"))) {
    return `${tailored[2]} Try to turn your idea into a concrete step-by-step plan.`;
  }

  return tailored[safeLevel - 1] ?? genericHints[0];
}
