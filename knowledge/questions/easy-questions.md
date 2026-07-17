---
title: Easy DSA Questions
description: Easy difficulty DSA questions for mock interviews
topic: questions
subtopic: easy
difficulty: easy
count: 3
source_file: lib/questions.ts
updated: 2026-07-17
---

# Easy DSA Questions

Easy questions focus on foundational data structures and algorithms. They typically:
- Require 1-2 core concepts (arrays, hash maps, simple recursion)
- Have O(n) or O(n log n) optimal solutions
- Are meant to warm up and build confidence

## Question 1: Two Sum

### Prompt

> Say I hand you a list of numbers and a target value. I want you to find two numbers in the list that add up to that target, and return their positions. How would you approach this?

### Key Concepts

- Hash maps / dictionaries
- Array iteration
- Complement-based search

### Optimal Solution

**Time**: O(n)
**Space**: O(n)

```javascript
const twoSum = (nums, target) => {
  const map = {};
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map[complement] !== undefined) {
      return [map[complement], i];
    }
    map[nums[i]] = i;
  }
  return [];
};
```

### Common Mistakes

- Brute force O(n²) nested loops (inefficient)
- No edge case handling (empty array, null)
- Duplicate number handling unclear
- Forgetting the space complexity trade-off

### Follow-up Questions

1. What's the space-time trade-off vs. sorting?
2. How would you handle duplicates?
3. What if target is not found?

---

## Question 2: Valid Parentheses

### Prompt

> Given a string containing just the characters (), {}, and [], how would you determine if the brackets are properly closed and nested?

### Key Concepts

- Stacks
- String traversal
- Bracket matching

### Optimal Solution

**Time**: O(n)
**Space**: O(n)

```javascript
const isValid = (s) => {
  const stack = [];
  const pairs = { ')': '(', '}': '{', ']': '[' };
  
  for (const char of s) {
    if (char in pairs) {
      if (stack.pop() !== pairs[char]) return false;
    } else {
      stack.push(char);
    }
  }
  
  return stack.length === 0;
};
```

### Common Mistakes

- Not using a stack (trying to track with counters)
- Forgetting to check stack is empty at the end
- Wrong closing bracket for matching opening
- No handling of empty input

### Follow-up Questions

1. What if there are other characters in the string?
2. Can you solve it without a stack?
3. What's the worst-case space usage?

---

## Question 3: Reverse Linked List

### Prompt

> Suppose you have a singly linked list. Walk me through how you'd reverse it in place, without using extra data structures.

### Key Concepts

- Linked list traversal
- Pointer manipulation
- In-place algorithms

### Optimal Solution

**Time**: O(n)
**Space**: O(1)

```javascript
const reverseList = (head) => {
  let prev = null;
  let current = head;
  
  while (current) {
    const next = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }
  
  return prev;
};
```

### Common Mistakes

- Creating extra array or stack (violates "no extra data structures")
- Not saving next pointer before overwriting
- Infinite loop from not advancing pointers
- Null pointer exceptions

### Follow-up Questions

1. Can you do it recursively?
2. How would you reverse between two positions?
3. What's the space complexity of the recursive approach?

---

## Difficulty Notes

These questions should be solved in **5–10 minutes** by someone familiar with the core concepts. They're designed to build confidence, not stump.

**Passing Criteria**:
- ✓ Correct approach identified
- ✓ Correct complexity analysis
- ✓ Code runs without errors
- ✓ Edge cases considered

**Strong Performance**:
- ✓ All above, plus
- ✓ Proactive edge case handling
- ✓ Clear communication throughout
- ✓ Clean, readable code
