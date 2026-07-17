---
title: Hard DSA Questions
description: Hard difficulty DSA questions for mock interviews
topic: questions
subtopic: hard
difficulty: hard
count: 2
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

**Naive Approach (O(n²))**:
```javascript
const lengthOfLIS = (nums) => {
  const dp = new Array(nums.length).fill(1);
  
  for (let i = 1; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
  }
  
  return Math.max(...dp);
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
4. Space-time trade-offs?

---

## Question 2: Trapping Rain Water (2D - Matrix)

### Prompt

> Given a 2D matrix where each cell represents the height of a bar, calculate how much rain water can be trapped after raining. Water can flow in all four directions and gets trapped between higher bars.

### Key Concepts

- 2D array traversal
- Priority queues / heap
- Multi-directional boundary tracking
- Advanced graph algorithms

### Optimal Solution

**Time**: O(m × n × log(m × n)) using min-heap
**Space**: O(m × n)

```javascript
const trapRainWater = (heightMap) => {
  if (!heightMap || heightMap.length < 3 || heightMap[0].length < 3) {
    return 0;
  }
  
  const m = heightMap.length;
  const n = heightMap[0].length;
  const visited = Array.from({ length: m }, () => new Array(n).fill(false));
  
  // Min-heap: [height, row, col]
  const heap = new MinPriorityQueue();
  
  // Add border cells to heap
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (i === 0 || i === m - 1 || j === 0 || j === n - 1) {
        heap.enqueue([heightMap[i][j], i, j], heightMap[i][j]);
        visited[i][j] = true;
      }
    }
  }
  
  let water = 0;
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  let maxHeight = 0;
  
  while (!heap.isEmpty()) {
    const [height, i, j] = heap.dequeue().element;
    maxHeight = Math.max(maxHeight, height);
    
    for (const [di, dj] of directions) {
      const ni = i + di;
      const nj = j + dj;
      
      if (ni >= 0 && ni < m && nj >= 0 && nj < n && !visited[ni][nj]) {
        water += Math.max(0, maxHeight - heightMap[ni][nj]);
        heap.enqueue([heightMap[ni][nj], ni, nj], heightMap[ni][nj]);
        visited[ni][nj] = true;
      }
    }
  }
  
  return water;
};
```

### Common Mistakes

- Using 1D rain water logic (not considering 2D flow)
- Not recognizing it as a boundary/priority queue problem
- Incorrect heap implementation or ordering
- Not tracking visited cells (infinite loops)
- Off-by-one errors in matrix bounds

### Follow-up Questions

1. What's the intuition behind the boundary-first approach?
2. How would you solve this without a heap (if space was critical)?
3. Can you extend this to 3D?
4. What if water could flow in 8 directions (diagonals)?

---

## Difficulty Notes

**Time Allocation**: 25–30 minutes expected

**Passing Criteria**:
- ✓ Correct approach identified (may need hints)
- ✓ Correct complexity analysis
- ✓ Code runs without major errors
- ✓ Handles edge cases (empty matrix, small matrices, etc.)
- ✓ Clear communication of algorithm

**Strong Performance**:
- ✓ All above, plus
- ✓ Optimized solution (not just brute force)
- ✓ Proactive trade-off discussion
- ✓ Clean, production-ready code
- ✓ Handles follow-ups well
- ✓ Explains intuition behind optimization

---

## Interview Tips for Hard Questions

### Approach

1. **Don't panic** — hard questions often look unsolvable at first
2. **Start with brute force** — get a working solution, then optimize
3. **Think out loud** — interviewer wants to see your thought process
4. **Draw it out** — use paper/whiteboard for 2D problems
5. **Test as you go** — verify logic on simple examples

### Communication

- "I see this is related to X problem..."
- "The naive approach would be O(n²). Let me think of a better way..."
- "I'm going to use a heap/DP because..."
- "Here's my optimization: instead of O(n²), we can do O(n log n) by..."

### Time Management

- First 5 min: Understand the problem
- 10–15 min: Code the brute force
- 5–10 min: Optimize
- 2–3 min: Test and walk through

If you run out of time, **explain** the optimization even if you can't code it.

---

## Resources for Hard Problems

- LeetCode Hard section (150+ problems)
- CTCI Chapter 16–17 (dynamic programming, advanced)
- Competitive programming sites (Codeforces, AtCoder)
- System design interviews (different hard, but useful skills)
