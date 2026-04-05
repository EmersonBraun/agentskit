# Open Source Prep & Interactive Examples Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare AgentsKit for open source release with proper governance files, and add 12+ interactive examples (including MUI/shadcn integrations and a Flappy Arrow game) embedded in the Docusaurus site.

**Architecture:** Open source files go at repo root (LICENSE, CONTRIBUTING.md, etc.). Examples are self-contained React components in `docs/src/examples/`, each rendered as an interactive demo on a Docusaurus page. MUI and shadcn examples show AgentsKit chat components restyled with those libraries. All examples use the library's own hooks (useReactive, useChat, useStream) to demonstrate capability.

**Tech Stack:** TypeScript, React 18, Docusaurus v3, MUI, shadcn/ui (CSS-only patterns for docs)

---

## File Map

```
# Open Source Prep
LICENSE                              — MIT license text
CONTRIBUTING.md                      — How to contribute
CODE_OF_CONDUCT.md                   — Contributor Covenant
SECURITY.md                          — Security policy
.github/ISSUE_TEMPLATE/bug.yml       — Bug report template
.github/ISSUE_TEMPLATE/feature.yml   — Feature request template
.github/PULL_REQUEST_TEMPLATE.md     — PR template

# Examples (interactive demos embedded in docs)
docs/src/examples/TodoList.tsx
docs/src/examples/PomodoroTimer.tsx
docs/src/examples/ColorPalette.tsx
docs/src/examples/PasswordGenerator.tsx
docs/src/examples/Accordion.tsx
docs/src/examples/LiveFeed.tsx
docs/src/examples/DataTable.tsx
docs/src/examples/Tabs.tsx
docs/src/examples/PhotoGallery.tsx
docs/src/examples/FlappyArrow.tsx
docs/src/examples/MuiChat.tsx
docs/src/examples/ShadcnChat.tsx

# Docs pages for examples
docs/docs/examples/index.md
docs/docs/examples/todo-list.mdx
docs/docs/examples/pomodoro-timer.mdx
docs/docs/examples/color-palette.mdx
docs/docs/examples/password-generator.mdx
docs/docs/examples/accordion.mdx
docs/docs/examples/live-feed.mdx
docs/docs/examples/data-table.mdx
docs/docs/examples/tabs.mdx
docs/docs/examples/photo-gallery.mdx
docs/docs/examples/flappy-arrow.mdx
docs/docs/examples/mui-chat.mdx
docs/docs/examples/shadcn-chat.mdx

# Updated
docs/sidebars.ts                     — Add examples section
```

---

### Task 1: Open Source Governance Files

**Files:**
- Create: `LICENSE`
- Create: `CONTRIBUTING.md`
- Create: `CODE_OF_CONDUCT.md`
- Create: `SECURITY.md`

- [ ] **Step 1: Create MIT LICENSE**

```
MIT License

Copyright (c) 2026 Emerson Braun

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: Create CONTRIBUTING.md**

Full contributing guide with: prerequisites, setup instructions, development workflow, PR guidelines, code style, testing requirements.

- [ ] **Step 3: Create CODE_OF_CONDUCT.md**

Contributor Covenant v2.1.

- [ ] **Step 4: Create SECURITY.md**

Security reporting policy.

- [ ] **Step 5: Commit**

```bash
git add LICENSE CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md
git commit -m "docs: add open source governance files (LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY)"
```

---

### Task 2: GitHub Issue & PR Templates

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug.yml`
- Create: `.github/ISSUE_TEMPLATE/feature.yml`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`

- [ ] **Step 1: Create bug report template** (YAML form)
- [ ] **Step 2: Create feature request template** (YAML form)
- [ ] **Step 3: Create PR template**
- [ ] **Step 4: Commit**

```bash
git add .github/ISSUE_TEMPLATE/ .github/PULL_REQUEST_TEMPLATE.md
git commit -m "docs: add GitHub issue and PR templates"
```

---

### Task 3: Examples Infrastructure

**Files:**
- Create: `docs/src/examples/ExampleWrapper.tsx` — reusable wrapper with source toggle
- Create: `docs/docs/examples/index.md` — examples landing page
- Modify: `docs/sidebars.ts` — add examples category

- [ ] **Step 1: Create ExampleWrapper component**

A wrapper that shows the live demo with a "Show Code" toggle button.

- [ ] **Step 2: Create examples index page**
- [ ] **Step 3: Update sidebars.ts to add Examples category**
- [ ] **Step 4: Commit**

---

### Task 4: Todo List Example

**Files:**
- Create: `docs/src/examples/TodoList.tsx`
- Create: `docs/docs/examples/todo-list.mdx`

Uses `useReactive` for state management. Add/remove/toggle todos, filter by status, computed count.

- [ ] **Step 1: Implement TodoList.tsx**
- [ ] **Step 2: Create MDX page with embedded demo**
- [ ] **Step 3: Commit**

---

### Task 5: Pomodoro Timer Example

**Files:**
- Create: `docs/src/examples/PomodoroTimer.tsx`
- Create: `docs/docs/examples/pomodoro-timer.mdx`

Uses `useReactive` for timer state. SVG circular progress, start/pause/reset, work/break modes.

- [ ] **Step 1: Implement PomodoroTimer.tsx**
- [ ] **Step 2: Create MDX page**
- [ ] **Step 3: Commit**

---

### Task 6: Color Palette Example

**Files:**
- Create: `docs/src/examples/ColorPalette.tsx`
- Create: `docs/docs/examples/color-palette.mdx`

Generates harmonious color palettes. Click to randomize, copy hex values, shows complementary/analogous/triadic.

- [ ] **Step 1: Implement ColorPalette.tsx**
- [ ] **Step 2: Create MDX page**
- [ ] **Step 3: Commit**

---

### Task 7: Password Generator Example

**Files:**
- Create: `docs/src/examples/PasswordGenerator.tsx`
- Create: `docs/docs/examples/password-generator.mdx`

Toggle options (uppercase, numbers, symbols), length slider, strength meter, copy button.

- [ ] **Step 1: Implement PasswordGenerator.tsx**
- [ ] **Step 2: Create MDX page**
- [ ] **Step 3: Commit**

---

### Task 8: Accordion Example

**Files:**
- Create: `docs/src/examples/Accordion.tsx`
- Create: `docs/docs/examples/accordion.mdx`

FAQ-style accordion with smooth expand/collapse animation. Single or multi-expand modes.

- [ ] **Step 1: Implement Accordion.tsx**
- [ ] **Step 2: Create MDX page**
- [ ] **Step 3: Commit**

---

### Task 9: Live Feed Example

**Files:**
- Create: `docs/src/examples/LiveFeed.tsx`
- Create: `docs/docs/examples/live-feed.mdx`

Auto-updating feed with new items appearing at top every few seconds. Simulated streaming data.

- [ ] **Step 1: Implement LiveFeed.tsx**
- [ ] **Step 2: Create MDX page**
- [ ] **Step 3: Commit**

---

### Task 10: Data Table Example

**Files:**
- Create: `docs/src/examples/DataTable.tsx`
- Create: `docs/docs/examples/data-table.mdx`

Sortable columns, clickable headers, alternating row styles. Reactive sorting with useReactive.

- [ ] **Step 1: Implement DataTable.tsx**
- [ ] **Step 2: Create MDX page**
- [ ] **Step 3: Commit**

---

### Task 11: Tabs Example

**Files:**
- Create: `docs/src/examples/Tabs.tsx`
- Create: `docs/docs/examples/tabs.mdx`

Tab panels with ARIA roles, animated indicator bar, keyboard navigation.

- [ ] **Step 1: Implement Tabs.tsx**
- [ ] **Step 2: Create MDX page**
- [ ] **Step 3: Commit**

---

### Task 12: Photo Gallery Example

**Files:**
- Create: `docs/src/examples/PhotoGallery.tsx`
- Create: `docs/docs/examples/photo-gallery.mdx`

Grid of thumbnails, lightbox overlay on click, keyboard nav (left/right/escape), transitions.

- [ ] **Step 1: Implement PhotoGallery.tsx**
- [ ] **Step 2: Create MDX page**
- [ ] **Step 3: Commit**

---

### Task 13: Flappy Arrow Game

**Files:**
- Create: `docs/src/examples/FlappyArrow.tsx`
- Create: `docs/docs/examples/flappy-arrow.mdx`

ASCII/canvas game: arrow character flies through pipes. Click/space to flap. Score counter. Game over / restart. Uses requestAnimationFrame + useReactive for game state.

- [ ] **Step 1: Implement FlappyArrow.tsx**
- [ ] **Step 2: Create MDX page**
- [ ] **Step 3: Commit**

---

### Task 14: MUI Chat Example

**Files:**
- Create: `docs/src/examples/MuiChat.tsx`
- Create: `docs/docs/examples/mui-chat.mdx`

Shows AgentsKit's useChat hook with MUI components (Paper, TextField, Button, List, ListItem, Avatar). Demonstrates that AgentsKit is headless — use any UI library.

- [ ] **Step 1: Implement MuiChat.tsx** (MUI styles inlined via sx prop patterns, no actual MUI dep in docs)
- [ ] **Step 2: Create MDX page with code showing real MUI imports**
- [ ] **Step 3: Commit**

---

### Task 15: shadcn Chat Example

**Files:**
- Create: `docs/src/examples/ShadcnChat.tsx`
- Create: `docs/docs/examples/shadcn-chat.mdx`

Shows AgentsKit's useChat hook styled with shadcn/ui patterns (Card, Input, Button, ScrollArea). Tailwind-style classes.

- [ ] **Step 1: Implement ShadcnChat.tsx** (shadcn visual patterns inlined)
- [ ] **Step 2: Create MDX page with code showing real shadcn imports**
- [ ] **Step 3: Commit**

---

### Task 16: Final — Build Verification & Push

- [ ] **Step 1: Build docs site**

```bash
cd docs && npm run build
```

- [ ] **Step 2: Run library tests**

```bash
npx vitest run
```

- [ ] **Step 3: Commit any fixes and push**

```bash
git push origin main
```
