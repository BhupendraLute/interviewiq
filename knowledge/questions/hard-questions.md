---
title: Hard DSA Questions
description: Hard difficulty DSA questions for mock interviews
topic: questions
subtopic: hard
difficulty: hard
count: 3
source_file: lib/questions.ts
updated: 2026-07-17
---

# Hard DSA Questions

Hard questions require **advanced problem-solving** and integration of multiple concepts. They typically:
- Require 3+ core concepts or novel approaches
- Have O(n) or O(n log n) optimal solutions but aren't obvious
- Test deep understanding and optimization skills
- Take **20–30 minutes** to solve

## Question 1: Longest Increasing Subsequence

### Prompt

> Given an array of integers, find the length of the longest subsequence such that all elements are in increasing order. The subsequence doesn't need to be contiguous.

### Key Concepts

- Dynamic programming
- Binary search optimization
- Sequence analysis

### Optimal Solution

**Time**: O(n log n) using binary search + DP
**Space**: O(n)

```javascript
const lengthOfLIS = (nums) => {
  if (nums.length === 0) return 0;
  
  // dp[i] = smallest tail of all increasing subsequences of length i+1
  const dp = [];
  
  for (const num of nums) {
    // Binary search for position to insert/replace
    let left = 0, right = dp.length;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (dp[mid] < num) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }
    
    // Insert or replace at position
    dp[left] = num;
  }
  
  return dp.length;
};
```

### Common Mistakes

- DP approach without binary search optimization (O(n²))
- Confusion between subsequence and subarray (contiguity)
- Not handling negative numbers or duplicates correctly
- Off-by-one errors in binary search bounds

### Follow-up Questions

1. Can you optimize from O(n²) to O(n log n)? How?
2. How would you modify it to return the actual sequence, not just length?
3. What if you want strictly increasing vs. non-decreasing?

---

## Question 2: Merge K Sorted Lists

### Prompt

> You have k sorted linked lists. How would you merge them into a single sorted list efficiently?

### Key Concepts

- Priority queues / heap
- Linked list manipulation
- Divide and conquer
- K-way merge

### Optimal Solutions

**Approach 1: Min-Heap (O(n log k))**
**Time**: O(n log k), **Space**: O(k)

```javascript
const mergeKLists = (lists) => {
  const minHeap = new MinPriorityQueue({ priority: (node) => node.val });
  const dummy = new ListNode(0);
  let current = dummy;
  
  for (const list of lists) {
    if (list) minHeap.enqueue(list);
  }
  
  while (!minHeap.isEmpty()) {
    const node = minHeap.dequeue().element;
    current.next = node;
    current = current.next;
    if (node.next) minHeap.enqueue(node.next);
  }
  
  return dummy.next;
};
```

**Approach 2: Divide & Conquer (O(n log k))**
Recursively merge pairs of lists.

### Common Mistakes

- Not using a heap (comparing all k heads each iteration = O(nk))
- Forgetting to advance the pointer after extracting min
- Not handling empty lists in the input array
- Space complexity of recursive D&C approach

### Follow-up Questions

1. Compare heap vs divide & conquer approaches
2. What if the lists are on different machines (distributed)?
3. How would you handle very large lists that don't fit in memory?

---

## Question 3: Word Ladder

### Prompt

> Given a start word, an end word, and a dictionary of words, how would you find the shortest transformation sequence where each step changes exactly one letter and the result must be a valid word?

### Key Concepts

- BFS on implicit graph
- Shortest path in unweighted graph
- Pattern/replacement word mapping
- Bidirectional BFS optimization

### Optimal Solution

**Time**: O(M² × N) where M = word length, N = word count
**Space**: O(M × N)

```javascript
const ladderLength = (beginWord, endWord, wordList) => {
  const wordSet = new Set(wordList);
  if (!wordSet.has(endWord)) return 0;
  
  const queue = [beginWord];
  let level = 1;
  const visited = new Set([beginWord]);
  
  while (queue.length > 0) {
    const levelSize = queue.length;
    
    for (let i = 0; i < levelSize; i++) {
      const word = queue.shift();
      if (word === endWord) return level;
      
      for (let j = 0; j < word.length; j++) {
        for (let c = 97; c <= 122; c++) {
          const newWord = word.slice(0, j) + String.fromCharCode(c) + word.slice(j + 1);
          if (wordSet.has(newWord) && !visited.has(newWord)) {
            visited.add(newWord);
            queue.push(newWord);
          }
        }
      }
    }
    level++;
  }
  
  return 0;
};
```

### Common Mistakes

- Using DFS instead of BFS (BFS guarantees shortest path)
- Not pre-processing the word list into a set for O(1) lookup
- Skipping bidirectional BFS optimization for large dictionaries
- Not checking if endWord is in wordList before starting

### Follow-up Questions

1. How would you optimize with bidirectional BFS?
2. What if you need to return the actual path, not just length?
3. How does performance scale with word length and dictionary size?

---

## Difficulty Notes

**Time Allocation**: 25–30 minutes expected

**Passing Criteria**:
- ✓ Correct approach identified (may need hints)
- ✓ Correct complexity analysis
- ✓ Code runs without major errors
- ✓ Handles edge cases
- ✓ Clear communication of algorithm

**Strong Performance**:
- ✓ All above, plus
- ✓ Optimized solution (not just brute force)
- ✓ Proactive trade-off discussion
- ✓ Clean, production-ready code
- ✓ Handles follow-ups well

---

## Interview Tips for Hard Questions

### Approach

1. **Don't panic** — hard questions often look unsolvable at first
2. **Start with brute force** — get a working solution, then optimize
3. **Think out loud** — interviewer wants to see your thought process
4. **Draw it out** — use paper/whiteboard for graph problems
5. **Test as you go** — verify logic on simple examples

### Communication

- "I see this is related to X problem..."
- "The naive approach would be O(n²). Let me think of a better way..."
- "I'm going to use a heap/DP/BFS because..."
- "Here's my optimization: instead of O(n²), we can do O(n log n) by..."

### Time Management

- First 5 min: Understand the problem
- 10–15 min: Code the brute force
- 5–10 min: Optimize
- 2–3 min: Test and walk through

If you run out of time, **explain** the optimization even if you can't code it.

---

## Importing Custom Questions

Import your own hard questions via CSV or JSON at `POST /api/session/start`. See [easy-questions.md](easy-questions.md) for format details.

## Resources for Hard Problems

- LeetCode Hard section (150+ problems)
- CTCI Chapter 16–17 (dynamic programming, advanced)
- Competitive programming sites (Codeforces, AtCoder)
