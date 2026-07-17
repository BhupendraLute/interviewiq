export type Question = {
  id: string;
  title: string;
  prompt: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
};

type QuestionInput = {
  id?: string;
  title?: string;
  prompt?: string;
  difficulty?: string;
  topic?: string;
};

export type QuestionPack = {
  name?: string;
  questions?: unknown[];
};

const VALID_DIFFICULTIES = ["easy", "medium", "hard"] as const;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function parseCsvQuestions(text: string): Question[] {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("The uploaded file is empty.");
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one question row.");
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  const titleIndex = headers.findIndex((header) => header === "title");
  const promptIndex = headers.findIndex((header) => header === "prompt");

  if (titleIndex < 0 || promptIndex < 0) {
    throw new Error("CSV must include title and prompt columns.");
  }

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return normalizeQuestion({
      title: values[titleIndex] ?? "",
      prompt: values[promptIndex] ?? "",
      difficulty: values[headers.findIndex((header) => header === "difficulty") ?? -1] ?? "",
      topic: values[headers.findIndex((header) => header === "topic") ?? -1] ?? "",
    });
  });
}

function makeQuestionId(title: string): string {
  const seed = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
  return `import-${seed || "question"}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeQuestion(raw: unknown): Question {
  if (!raw || typeof raw !== "object") {
    throw new Error("Each question must be an object.");
  }

  const candidate = raw as QuestionInput;
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  const prompt = typeof candidate.prompt === "string" ? candidate.prompt.trim() : "";
  const topic = typeof candidate.topic === "string" ? candidate.topic.trim() : "general";
  const difficulty = typeof candidate.difficulty === "string" ? candidate.difficulty.toLowerCase() : "";

  if (!title || !prompt) {
    throw new Error("Each question must include a title and prompt.");
  }

  if (!VALID_DIFFICULTIES.includes(difficulty as (typeof VALID_DIFFICULTIES)[number])) {
    throw new Error(`Invalid difficulty "${difficulty || "unknown"}". Use easy, medium, or hard.`);
  }

  return {
    id: candidate.id || makeQuestionId(title),
    title,
    prompt,
    difficulty: difficulty as Question["difficulty"],
    topic: topic || "general",
  };
}

export function normalizeImportedQuestions(input: unknown): Question[] {
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error("The uploaded file is empty.");
    }

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => normalizeQuestion(item));
        }

        if (parsed && typeof parsed === "object") {
          const payload = parsed as QuestionPack;
          if (Array.isArray(payload.questions)) {
            return payload.questions.map((item) => normalizeQuestion(item));
          }
        }
      } catch {
        return parseCsvQuestions(trimmed);
      }

      throw new Error("Expected a JSON array of questions or an object with a questions array.");
    }

    return parseCsvQuestions(trimmed);
  }

  if (Array.isArray(input)) {
    return input.map((item) => normalizeQuestion(item));
  }

  if (input && typeof input === "object") {
    const payload = input as QuestionPack;
    if (Array.isArray(payload.questions)) {
      return payload.questions.map((item) => normalizeQuestion(item));
    }
  }

  throw new Error("Expected a JSON array of questions, a JSON object with a questions array, or CSV content.");
}

export const QUESTION_BANK: Question[] = [
  {
    id: "q1",
    title: "Two Sum",
    difficulty: "easy",
    topic: "arrays",
    prompt:
      "Say I hand you a list of numbers and a target value. I want you to find two numbers in the list that add up to that target, and return their positions. How would you approach this?",
  },
  {
    id: "q2",
    title: "Valid Parentheses",
    difficulty: "easy",
    topic: "strings",
    prompt:
      "Given a string containing just the characters (), {}, and [], how would you determine if the brackets are properly closed and nested?",
  },
  {
    id: "q3",
    title: "Reverse Linked List",
    difficulty: "easy",
    topic: "linked-lists",
    prompt:
      "Suppose you have a singly linked list. Walk me through how you'd reverse it in place, without using extra data structures.",
  },
  {
    id: "q4",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    topic: "strings",
    prompt:
      "Given a string, how would you find the length of the longest substring that doesn't repeat any characters?",
  },
  {
    id: "q5",
    title: "Binary Tree Level Order Traversal",
    difficulty: "medium",
    topic: "trees",
    prompt:
      "Given the root of a binary tree, how would you return the values level by level, left to right?",
  },
  {
    id: "q6",
    title: "Number of Islands",
    difficulty: "medium",
    topic: "graphs",
    prompt:
      "You're given a 2D grid of 1s (land) and 0s (water). How would you count the number of islands, where an island is formed by connecting adjacent lands horizontally or vertically?",
  },
  {
    id: "q7",
    title: "Coin Change",
    difficulty: "medium",
    topic: "dynamic-programming",
    prompt:
      "Given a set of coin denominations and a target amount, how would you find the fewest number of coins needed to make that amount?",
  },
  {
    id: "q8",
    title: "Merge K Sorted Lists",
    difficulty: "hard",
    topic: "linked-lists",
    prompt:
      "You have k sorted linked lists. How would you merge them into a single sorted list efficiently?",
  },
  {
    id: "q9",
    title: "Word Ladder",
    difficulty: "hard",
    topic: "graphs",
    prompt:
      "Given a start word, an end word, and a dictionary of words, how would you find the shortest transformation sequence where each step changes exactly one letter and the result must be a valid word?",
  },
  {
    id: "q10",
    title: "Longest Increasing Subsequence",
    difficulty: "hard",
    topic: "dynamic-programming",
    prompt:
      "Given an array of integers, how would you find the length of the longest strictly increasing subsequence?",
  },
];

export function pickQuestion(difficulty: string, questionBank: Question[] = QUESTION_BANK): Question {
  const normalizedDifficulty = difficulty.toLowerCase();
  const sourceBank = questionBank.length > 0 ? questionBank : QUESTION_BANK;
  const matching = sourceBank.filter((q) => q.difficulty === normalizedDifficulty);
  const pool = matching.length > 0 ? matching : sourceBank;
  return pool[Math.floor(Math.random() * pool.length)];
}
