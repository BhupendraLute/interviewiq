---
name: InterviewIQ
description: Visual design system for the free AI mock-interview app (Next.js + Tailwind v4 + base-ui).
register: product
tokenSource: app/globals.css
components: shadcn-style base-ui primitives, @uiw/react-codemirror, custom canvas whiteboard
---

# Design

## Overview

InterviewIQ is a focused, tool-assisted interview workspace. Surfaces are quiet and neutral so the candidate's
thinking space (conversation, code, diagram) stays dominant. A single brand accent — indigo (`oklch` ≈ `79 70 229`,
used as `#4f46e5` / Tailwind `indigo-500`) — marks primary actions and the ambient page glow. The system is flat and
border-driven; it avoids heavy shadows and rounded "pill" surfaces.

Stack: Next.js 16 (App Router) + React 19, Tailwind CSS v4 (CSS-first tokens via `@theme`), base-ui primitives
wrapped in a shadcn-style component layer, CodeMirror for the in-interview editor.

## Design Tokens

### Color

Defined as CSS custom properties in `app/globals.css`. Light is the default; `.dark` overrides on `<html>`.

**Neutrals (light)**

| Token | Value | Use |
|---|---|---|
| `--background` | `oklch(1 0 0)` | Page base (overlaid by the ambient gradient) |
| `--foreground` | `oklch(0.145 0 0)` | Body text |
| `--muted` | `oklch(0.97 0 0)` | Subtle fills |
| `--muted-foreground` | `oklch(0.556 0 0)` | Secondary text (verify ≥ 4.5:1 on its bg) |
| `--card` | `oklch(1 0 0)` | Card surface |
| `--popover` | `oklch(1 0 0)` | Popover/menu surface |
| `--border` | `oklch(0.922 0 0)` | Hairline borders |
| `--input` | `oklch(0.922 0 0)` | Input borders |
| `--ring` | `oklch(0.708 0 0)` | Focus ring |

**Brand & semantic**

| Token | Value | Use |
|---|---|---|
| `--primary` | `oklch(0.205 0 0)` | Default buttons (near-black), text on light accents |
| `--primary-foreground` | `oklch(0.985 0 0)` | Text on primary |
| `--secondary` | `oklch(0.97 0 0)` | Secondary button fill |
| `--accent` | `oklch(0.97 0 0)` | Hover/active fills |
| `--accent-soft` | `rgba(79,70,229,0.12)` | Selection, indigo tint, soft highlights |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Errors, destructive actions |
| `--chart-1..5` | `oklch(0.87→0.269 0 0)` | Report charts (grayscale ramp) |

**Accent (indigo) — applied directly, not a token**

- Ambient page glow + gradient: `radial-gradient(circle at top left, rgba(79,70,229,0.16), transparent 28%)` over `linear-gradient(135deg, #f8faff, #eef2ff)`.
- Primary action buttons inside the interview tools (Share with interviewer, Stop, Tools toggle when active): `bg-indigo-500 text-white hover:bg-indigo-400`.
- Create-page hero chip: `from-blue-500 to-indigo-600`.

**Dark theme overrides** (`.dark` on `<html>`)

- `--background: oklch(0.145 0 0)`, `--foreground: oklch(0.985 0 0)`
- `--primary: oklch(0.922 0 0)`, `--border: oklch(1 0 0 / 10%)`, `--input: oklch(1 0 0 / 15%)`
- `--sidebar-primary: oklch(0.488 0.243 264.376)` (indigo) keeps brand continuity in dark.

**Code editor surface** (separate from app theme): `#282c34` (oneDark) with `#ffffff` text — a deliberately dark,
high-contrast IDE panel so code is always readable regardless of app theme.

**Whiteboard surface**: opaque `#ffffff` canvas with a neutral toolbar; stroke palette includes `#0f172a` plus
`red / amber / emerald / blue / violet / pink`.

### Typography

- **Sans (UI & headings):** Geist, loaded via `next/font/google` as `--font-sans`. Applied globally (`font-sans`).
- **Mono:** `ui-monospace, SFMono-Regular, Menlo, monospace` (`--font-mono`) for code and the editor.
- **Scale:** body defaults to the browser base; chat messages render at `text-sm`. Headings use tight tracking
  (`tracking-tight` on display sizes, ≥ `-0.02em`).
- **Emphasis:** weight + size carry hierarchy; the design avoids gradient text and colored display headings.

### Radius & spacing

- Base radius `--radius: 0.625rem`; derived scale via `@theme` multiples: `sm 0.6×`, `md 0.8×`, `lg 1×`,
  `xl 1.4×`, up to `4xl 2.6×`.
- Buttons: `rounded-lg` (default), inputs/popovers share the scale. Cards/panels stay ≤ `rounded-xl` (≈ 14px) —
  no oversized radii.
- Spacing follows Tailwind's 4px base scale; section rhythm uses generous vertical padding on marketing surfaces and
  tight, utility-first gaps inside the workspace.

### Elevation

Minimal. Surfaces are differentiated by `1px` borders and tinted fills rather than shadows. The only shadows are
small, functional focus rings (`ring-3 ring-ring/50`) and the create-page hero chip shadow.

## Components

Shared primitives live in `components/ui/*` (base-ui wrapped, shadcn-style API) and `components/ai-elements/*`.

- **Button** (`components/ui/button.tsx`): variants `default | outline | secondary | ghost | destructive | link`;
  sizes `xs | sm | default | lg | icon | icon-xs | icon-sm | icon-lg`. Neutral by default; indigo reserved for the
  in-interview primary tools. Renders via `@base-ui/react/button`.
- **InputGroup / Textarea** (`components/ui/input-group.tsx`): the chat composer container.
- **Tooltip** (`components/ui/tooltip.tsx`): base-ui tooltip; trigger uses the `render` prop so it becomes the
  underlying control (no nested `<button>`). Provider `delay={0}`.
- **Select / DropdownMenu / Dialog / Tabs / Card / Badge / Switch / Avatar / Progress / ScrollArea / Separator / Accordion / Carousel / Command / HoverCard / Popover / Collapsible / Alert / Spinner** — base-ui + Radix-derived
  wrappers, consistent `data-slot` attributes and `cn()` styling.
- **Conversation / Message** (`components/ai-elements/*`): chat thread (`use-stick-to-bottom`), streaming shimmer,
  markdown rendered with `streamdown` (code/math/mermaid). `MessageAction` is a ghost icon button with an optional
  tooltip.
- **CodeEditor** (`components/interview/CodeEditor.tsx`): CodeMirror (`@uiw/react-codemirror`) in a `#282c34` panel
  with a language `Select` and a "Share with interviewer" action.
- **Whiteboard** (`components/interview/Whiteboard.tsx`): canvas drawing surface with pen/eraser/line/rect/ellipse,
  color swatches, width slider, undo/redo/clear/download, and a "Share with interviewer" note field.
- **Voice controls:** toolbar "Read aloud" toggle + per-message replay (Web Speech `SpeechSynthesis`); mic button in
  the composer (`SpeechRecognition`, feature-detected).

## Layout

- **App shell:** `Header` (h-16 / 4rem) in `app/layout.tsx`, then a `flex-1 flex-col` body.
- **Interview workspace** (`app/interview/[id]/page.tsx`): full-height
  (`h-[calc(100vh-4rem)]`) workspace.
  - **Desktop (`lg+`):** two columns — chat (`flex-1`) on the left, a collapsible **Tools** panel on the right
    (`lg:w-[44%]`, `max-w-[680px]`, `min-w-[380px]`, `border-l`). The panel has **Code** / **Whiteboard** tabs.
  - **Mobile (`<lg`):** a Chat / Code / Whiteboard segmented switch replaces the side-by-side view; the tapped
    surface takes the full width.
- **Create page** (`app/interview/create/page.tsx`): centered single-column form (`max-w-lg`) with a gradient hero
  chip.
- **Report page** (`app/interview/[id]/report/page.tsx`): structured feedback with Chart.js radar/bar visuals.

## Motion

- Utility-first transitions (`transition-all`, `transition-colors`) on interactive elements; `tw-animate-css`
  provides enter/exit keyframes for tooltips, dialogs, and streaming states.
- Reveal/entrance animations must keep content visible by default (no class-gated hiding) and honor
  `prefers-reduced-motion` (the app sets a `.dark` custom variant; reduced-motion is respected via Tailwind's
  `motion-reduce` utilities where applied).
- Voice "listening" uses a pulsing red dot; speaking state uses a subtle indicator rather than aggressive animation.

## Accessibility Notes

- Body/muted-foreground contrast must stay ≥ 4.5:1; verify `--muted-foreground` (`oklch(0.556 0 0)`) on its actual
  background before shipping copy.
- All icon-only controls carry a `tooltip`/`aria-label` and an `sr-only` label.
- Feature-detected capabilities (speech input/output, canvas) degrade gracefully: unsupported controls are disabled
  with an explanatory tooltip.
- Focus rings use `ring-3 ring-ring/50`; avoid removing outlines except when a visible alternative is present.
