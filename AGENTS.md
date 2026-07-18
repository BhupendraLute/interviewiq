<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:okf-knowledge -->
# Open Knowledge Format (OKF)

This project stores AI-readable documentation using the **Open Knowledge Format (OKF)** — a vendor-neutral, open specification by Google for organizational knowledge. OKF uses a simple directory structure of Markdown files with YAML frontmatter.

**Why OKF?**
- Version-controllable (git-friendly)
- AI-readable (no database required)
- Human-readable (plain text)
- Scalable (add files as needed)
- Portable (no vendor lock-in)

## Entry Point

Start all knowledge exploration at:
```
knowledge/_index.md
```
This file provides an overview of the entire knowledge base and links to all major sections.

## Directory Structure

```
knowledge/
├── _index.md                    # Root index — start here
├── OKF.md                       # OKF implementation guide
│
├── system/                      # System & architecture docs
│   ├── architecture.md          # Tech stack, design, component tree
│   ├── sessions.md              # Data models, session lifecycle
│   └── interview-flow.md        # Step-by-step interview process
│
├── agents/                      # AI agent documentation
│   ├── interviewer-agent.md     # Real-time interviewer with flag_weakness tool
│   └── feedback-agent.md        # Structured feedback with Zod output
│
├── questions/                   # Question bank
│   ├── easy-questions.md        # Easy DSA questions
│   ├── medium-questions.md      # Medium DSA questions
│   └── hard-questions.md        # Hard DSA questions
│
└── guides/                      # User & developer guides
    ├── user-guide.md            # How to take an interview
    ├── developer-guide.md       # Setup, project structure & development
    └── api-reference.md         # API endpoint docs
```

## YAML Frontmatter Reference

Every OKF document starts with YAML frontmatter:

```markdown
---
title: Document Title
description: Brief summary
topic: category
subtopic: subcategory
related:
  - related-doc.md
  - other-doc.md
updated: YYYY-MM-DD
---
```

### Common Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `title` | Document name | "Interviewer Agent" |
| `description` | 1-sentence summary | "Real-time interviewer with flag_weakness tool" |
| `topic` | Main category | "agents", "system", "guides" |
| `subtopic` | Subcategory | "interviewer", "database" |
| `related` | Links to related docs | `["architecture.md", "sessions.md"]` |
| `updated` | Last modification date | "2026-07-17" |
| `difficulty` | For questions | "easy", "medium", "hard" |
| `source_file` | Code file reference | "lib/agents/interviewerAgent.ts" |
| `audience` | Target reader | "candidates", "developers" |

## How to Navigate

1. **Start at `_index.md`** — provides overview and links to all sections
2. **Follow `related` links** — each document's frontmatter links to connected docs
3. **Use `topic` tags** — organize exploration by theme (system, agents, guides, questions)
4. **Reference `source_file`** — find actual implementation code in the codebase

## AI Agent Usage

### Directory Scanning
Scan `knowledge/` to discover all available documentation files (`.md` extension).

### Metadata Extraction
Parse YAML frontmatter from each document to understand:
- Document purpose (`title`, `description`)
- Relationships (`related` links)
- Categorization (`topic`, `subtopic`)
- Code references (`source_file`)

### Context Building
When answering questions about InterviewIQ:
1. Start at `_index.md` for overview
2. Follow `related` links to explore deeply
3. Use `topic` tags to organize by theme
4. Reference `source_file` to find actual code

### RAG Integration
For retrieval-augmented generation:
1. Index all OKF documents from `knowledge/`
2. Use `topic` and `subtopic` for filtering
3. Follow `related` links for broader context
4. Include `source_file` references for code-level answers

## Spec Reference

- **Official Spec**: [Google Cloud Platform/knowledge-catalog](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)
- **Project OKF Guide**: [knowledge/OKF.md](knowledge/OKF.md)
- **Root Index**: [knowledge/_index.md](knowledge/_index.md)
<!-- END:okf-knowledge -->
