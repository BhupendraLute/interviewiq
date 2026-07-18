---
title: Medium DSA Questions
description: Medium difficulty DSA questions for mock interviews
topic: questions
subtopic: medium
difficulty: medium
count: 4
source_file: lib/questions.ts
updated: 2026-07-18
---

# Medium DSA Questions

Medium questions require **2-3 core concepts** and stronger algorithmic thinking. They typically:
- Require non-obvious approaches or optimization
- Have O(n log n) or O(n) optimal solutions
- Test real problem-solving, not just recall
- Take **10–15 minutes** to solve

## Question 1: Longest Substring Without Repeating Characters

### Prompt

> Given a string, how would you find the length of the longest substring that doesn't repeat any characters?

### Key Concepts

- Sliding window
- Hash maps for character tracking
- String iteration with pointers

### Optimal Solution

**Time**: O(n)
**Space**: O(min(n, charset))

```javascript
const lengthOfLongestSubstring = (s) => {
  const charIndex = {};
  let maxLength = 0;
  let start = 0;
  
  for (let end = 0; end < s.length; end++) {
    if (s[end] in charIndex && charIndex[s[end]] >= start) {
      start = charIndex[s[end]] + 1;
    }
    charIndex[s[end]] = end;
    maxLength = Math.max(maxLength, end - start + 1);
  }
  
  return maxLength;
};
```

### Common Mistakes

- Brute force checking all substrings O(n³)
- Not using sliding window optimization
- Off-by-one errors in pointer management
- Incorrect logic for resetting the window
- No handling of empty string

### Follow-up Questions

1. What if the charset is very large?
2. Can you modify it to return the actual substring, not just length?
3. How would performance change for Unicode vs. ASCII?

---

## Question 2: Binary Tree Level Order Traversal

### Prompt

> Given the root of a binary tree, how would you return the values level by level, left to right?

### Key Concepts

- Binary trees
- BFS / queue
- Level-order traversal

### Optimal Solution

**Time**: O(n)
**Space**: O(w) where w = max width of tree

```javascript
const levelOrder = (root) => {
  if (!root) return [];
  
  const result = [];
  const queue = [root];
  
  while (queue.length > 0) {
    const levelSize = queue.length;
    const levelValues = [];
    
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      levelValues.push(node.val);
      
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    
    result.push(levelValues);
  }
  
  return result;
};
```

### Common Mistakes

- Using recursion without tracking depth (harder to code)
- Not capturing level size before processing (mixes levels)
- Adding to queue after processing node (order gets confused)
- Null pointer exceptions from missing left/right checks

### Follow-up Questions

1. Can you solve it with recursion (DFS)?
2. What if you want right-to-left instead?
3. How would you do a zigzag traversal?

---

## Question 3: Number of Islands

### Prompt

> Given a 2D grid where 1 represents land and 0 represents water, count the number of distinct islands. An island is connected horizontally or vertically (not diagonally).

### Key Concepts

- 2D grids
- DFS / BFS
- Graph traversal
- Connected components

### Optimal Solution

**Time**: O(m × n)
**Space**: O(m × n) for visited tracking

```javascript
const numIslands = (grid) => {
  if (!grid || grid.length === 0) return 0;
  
  const visited = grid.map(row => row.map(() => false));
  let count = 0;
  
  const dfs = (i, j) => {
    if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length) return;
    if (visited[i][j] || grid[i][j] === '0') return;
    
    visited[i][j] = true;
    
    dfs(i + 1, j);
    dfs(i - 1, j);
    dfs(i, j + 1);
    dfs(i, j - 1);
  };
  
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[0].length; j++) {
      if (grid[i][j] === '1' && !visited[i][j]) {
        dfs(i, j);
        count++;
      }
    }
  }
  
  return count;
};
```

### Common Mistakes

- Forgetting to mark as visited (infinite recursion)
- Not checking bounds before recursing
- DFS not covering all connected land
- BFS implementation with wrong queue logic
- Space issues from deep recursion on large grids

### Follow-up Questions

1. Can you do it with BFS instead of DFS?
2. What's the space complexity?
3. How would you modify it to track island sizes?

---

## Question 4: Coin Change

### Prompt

> Given a set of coin denominations and a target amount, how would you find the fewest number of coins needed to make that amount?

### Key Concepts

- Dynamic programming
- Bottom-up memoization
- Optimization problems

### Optimal Solution

**Time**: O(amount × coins)
**Space**: O(amount)

```javascript
const coinChange = (coins, amount) => {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }
  
  return dp[amount] === Infinity ? -1 : dp[amount];
};
```

### Common Mistakes

- Using greedy instead of DP (greedy fails on non-canonical systems)
- Not handling the impossible case (return -1)
- Off-by-one in DP array initialization
- Wrong iteration order (coins loop vs amount loop)

### Follow-up Questions

1. Can greedy ever work? When?
2. How would you return the actual coin combination, not just count?
3. What if you have an unlimited supply? Limited supply?

---

## Difficulty Notes

**Time Allocation**: 10–15 minutes expected

**Passing Criteria**:
- ✓ Correct approach and algorithm
- ✓ Correct complexity analysis
- ✓ Code compiles and runs
- ✓ Handles edge cases

**Strong Performance**:
- ✓ All above, plus
- ✓ Clean, optimized code
- ✓ Proactive edge case handling
- ✓ Clear explanation of trade-offs
- ✓ Handles follow-up questions well
