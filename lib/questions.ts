export type Question = {
  id: string;
  title: string;
  prompt: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
};

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

export function pickQuestion(difficulty: string): Question {
  const matching = QUESTION_BANK.filter((q) => q.difficulty === difficulty);
  const pool = matching.length > 0 ? matching : QUESTION_BANK;
  return pool[Math.floor(Math.random() * pool.length)];
}
