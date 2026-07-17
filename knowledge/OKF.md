---
title: OKF Implementation Guide
description: How to use the Open Knowledge Format in InterviewIQ
topic: okf
format: OKF v1.0
created: 2026-07-17
updated: 2026-07-17
---

# OKF Implementation Guide for InterviewIQ

## What is OKF?

The **Open Knowledge Format (OKF)** is a vendor-neutral, open specification by Google for storing AI-readable organizational knowledge. It uses a simple directory structure of Markdown files with YAML frontmatter to formalize the "LLM-wiki" pattern.

**Advantages**:
- ✅ Version-controllable (git-friendly)
- ✅ AI-readable (no database required)
- ✅ Human-readable (plain text)
- ✅ Scalable (add files as needed)
- ✅ Portable (no vendor lock-in)

## InterviewIQ's OKF Structure

```
knowledge/
├── _index.md                    # Root index (entry point)
│
├── system/                      # System & architecture docs
│   ├── architecture.md          # Tech stack, design
│   ├── sessions.md              # Data models, session lifecycle
│   └── interview-flow.md        # Step-by-step interview process
│
├── agents/                      # AI agent documentation
│   ├── interviewer-agent.md     # Real-time interviewer
│   └── feedback-agent.md        # Feedback generation
│
├── questions/                   # Question bank
│   ├── easy-questions.md        # Easy DSA questions
│   ├── medium-questions.md      # Medium DSA questions
│   └── hard-questions.md        # Hard DSA questions
│
└── guides/                      # User & developer guides
    ├── user-guide.md            # How to take an interview
    ├── developer-guide.md       # Setup & development
    └── api-reference.md         # API endpoint docs
```

## YAML Frontmatter

Every OKF document starts with YAML frontmatter:

```markdown
---
title: My Document Title
description: Brief description
topic: category name
subtopic: subcategory (optional)
related:
  - related-doc.md
  - other-doc.md
updated: 2026-07-17
author: Optional author name
---
```

### Common Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `title` | Document name | "Interviewer Agent" |
| `description` | 1-sentence summary | "Real-time interviewer with flag_weakness tool" |
| `topic` | Main category | "agents", "system", "guides" |
| `subtopic` | Subcategory | "interviewer", "database", "user-guide" |
| `related` | Links to related docs | `["architecture.md", "sessions.md"]` |
| `updated` | Last modification date | "2026-07-17" |
| `difficulty` | For questions | "easy", "medium", "hard" |
| `source_file` | Code file reference | "lib/agents/interviewerAgent.ts" |
| `audience` | Target reader | "candidates", "developers" |

## How AI Systems Use OKF

### 1. Directory Scanning

An AI agent can scan the `knowledge/` directory to understand the system:

```python
import os
for root, dirs, files in os.walk('knowledge/'):
    for file in files:
        if file.endswith('.md'):
            print(f"Found: {os.path.join(root, file)}")
```

### 2. Metadata Extraction

AI systems extract YAML frontmatter to understand document relationships:

```yaml
# From agents/interviewer-agent.md
related:
  - feedback-agent.md
  - ../system/interview-flow.md

# This tells the AI that the interviewer agent is related to feedback
# and the broader interview flow
```

### 3. Context Building

When querying InterviewIQ's system, an AI can:
- Start at `_index.md` for overview
- Follow `related` links to explore deeply
- Use `topic` tags to organize by theme
- Reference `source_file` to find actual code

### 4. RAG Integration

For a **Retrieval-Augmented Generation** (RAG) system:

```python
# 1. Index all documents
docs = load_okf_directory('knowledge/')
vectordb.index(docs)

# 2. User queries
query = "How do I add a new interview question?"
results = vectordb.search(query, top_k=3)

# 3. LLM uses results as context
context = "\n\n".join([doc.content for doc in results])
answer = llm.generate(query, context=context)
```

## Adding New Content

### 1. New Feature or Topic

Create a new file in the appropriate subdirectory:

```bash
touch knowledge/guides/troubleshooting.md
```

### 2. Add YAML Frontmatter

```markdown
---
title: Troubleshooting InterviewIQ
description: Common issues and solutions
topic: guides
subtopic: troubleshooting
related:
  - user-guide.md
  - developer-guide.md
updated: 2026-07-17
---

# Troubleshooting InterviewIQ

...content...
```

### 3. Link from Related Docs

Update `related` in connected documents:

```yaml
# In guides/user-guide.md, add to related:
related:
  - troubleshooting.md
  - api-reference.md
```

### 4. Update Root Index

Add an entry in `_index.md`:

```markdown
### [Troubleshooting](guides/troubleshooting.md)
Common issues, solutions, and FAQs.
```

## Best Practices

### 1. Keep Documents Focused

- ✅ One topic per document
- ✅ 1-2 KB per document on average
- ❌ Don't create huge 20 KB files

### 2. Use Clear Structure

```markdown
# Title (h1)

Intro paragraph.

## Section 1 (h2)

Content.

## Section 2 (h2)

Content.

---

## Key Concepts

- Point 1
- Point 2
- Point 3
```

### 3. Link Generously

- Link to related documents
- Use relative paths: `../../system/architecture.md`
- Update `related` in frontmatter

### 4. Code Examples

Include real code snippets with language tags:

````markdown
```typescript
const result = await agent.run(transcript);
```

```javascript
const twoSum = (nums, target) => {
  const map = {};
  // ...
};
```
````

### 5. Tables for Reference

Use tables for quick lookups:

| Item | Description |
|------|-------------|
| A | ... |
| B | ... |

## Maintaining the Knowledge Base

### Weekly

- ✅ Fix typos
- ✅ Update related links
- ✅ Verify code examples still work

### Monthly

- ✅ Review for outdated info
- ✅ Add new features/updates
- ✅ Consolidate duplicate docs

### Quarterly

- ✅ Restructure if needed
- ✅ Archive old topics
- ✅ Survey team for missing docs

## OKF Tools & Integrations

### 1. Graphify (Knowledge Graph)

Graphify can consume OKF and build a knowledge graph:

```bash
graphify scan knowledge/
# Builds graph of:
# - Documents (nodes)
# - Related links (edges)
# - Topic clusters (communities)
```

### 2. LLM Context

Use OKF for LLM system prompts:

```
You are InterviewIQ. Here is the knowledge base:

<knowledge>
[Full OKF content here]
</knowledge>

User query: ${query}
Answer:
```

### 3. Documentation Site

Generate a docs website from OKF:

```bash
# Tools like MkDocs or Nextra can read OKF and render as HTML
mkdocs build -f knowledge/
```

### 4. AI Agents

Claude, ChatGPT, and other AI can read OKF directly:

```
Read the InterviewIQ knowledge base at knowledge/_index.md
and follow the related documents to answer this question: ...
```

## Spec Reference

- **Official Spec**: [Google Cloud Platform/knowledge-catalog](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)
- **Blog Post**: [Google Cloud Blog](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing)

## Next Steps

1. ✅ **Explore**: Browse the InterviewIQ knowledge base
2. ✅ **Use**: Reference docs when developing features
3. ✅ **Maintain**: Update docs when code changes
4. ✅ **Expand**: Add new documents as InterviewIQ grows
5. ✅ **Integrate**: Use OKF with Graphify, LLMs, or documentation sites

---

## Questions?

- **OKF Spec**: [GitHub](https://github.com/GoogleCloudPlatform/knowledge-catalog)
- **InterviewIQ Docs**: See [_index.md](_index.md)
- **Contributing**: See [developer-guide.md](guides/developer-guide.md)
