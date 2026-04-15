# v1 Launch Kit

All copy ready to paste. Replace `{{BLOG_URL}}` with the canonical post once the docs site is live (e.g. `https://agentskit.dev/docs/announcements/core-v1`). Repo: `https://github.com/EmersonBraun/agentskit`.

---

## 1 — Twitter / X thread (8 tweets)

> **Posting tip:** first tweet is the hook. Put the chart/OG image on tweet 1. Thread the rest.

**1/8**
`@agentskit/core` just hit 1.0.

The JavaScript agent toolkit I wish existed when I started.

5.17 KB gzipped. Zero dependencies. Forever stable at the minor level.

Here's what's inside 👇

**2/8**
Building agents in JS today sucks:

→ Heavyweight SDKs (200KB, vendor lock-in, breaking minors)
→ Or glue primitives yourself for 6 months
→ Or pick a framework and inherit its opinions

None of this is fine. The agent era deserves a React-sized substrate.

**3/8**
AgentsKit = 14 plug-and-play packages on one 5KB core.

- core · adapters · react · ink · cli
- runtime · tools · skills
- memory · rag · sandbox
- observability · eval · templates

Install two. Skip twelve. Your bundle pays for what you use.

**4/8**
Six contracts, pinned to ADRs:

Adapter · Tool · Memory · Retriever · Skill · Runtime

Every combination composes. Swap OpenAI → Anthropic → Ollama without rewriting. Swap React → Ink → CLI without touching your agent code.

**5/8**
v1 isn't a version bump. It's a promise.

✓ API frozen at the minor level
✓ Contracts pinned to ADRs
✓ Deprecations live ≥1 minor release
✓ Every change ships a changeset

The substrate stops moving. Your code stops breaking.

**6/8**
Shipped this cycle:

• `agentskit init/doctor/dev/tunnel`
• Auto-retry in every adapter
• `mockAdapter` / `recordingAdapter` / `replayAdapter`
• `costGuard` — enforce USD budgets per run
• `edit` + `regenerate` on ChatController

538 tests green. Bundle budget 48% under.

**7/8**
Migrating from 0.4? Two import swaps:

`createFileMemory` → `@agentskit/memory`
`loadConfig` → `@agentskit/cli`

Driven by Manifesto principle 1: core works in any environment, including browsers.

**8/8**
Install:

```
npm i @agentskit/core@1 @agentskit/react @agentskit/adapters
```

Docs, roadmap, Manifesto, all open:
{{BLOG_URL}}

Built by one. Ready for many. PRs open — 10 good-first-issues waiting.

---

## 2 — LinkedIn post

Today I'm shipping `@agentskit/core` v1.0.0.

The JavaScript agent toolkit I kept wishing existed while building agent products the last two years.

**The numbers:**
→ 5.17 KB gzipped (48% under our 10 KB budget)
→ Zero runtime dependencies
→ 14 composable packages
→ 538 tests, enforced in CI
→ 6 core contracts, each pinned to an ADR

**Why this matters:**

Building agents in JavaScript today forces a bad trade:
• Heavyweight vendor SDKs that lock you in and ship breaking minors
• Or you glue primitives yourself for 6 months before shipping product code
• Or you adopt a framework and inherit every opinion it was ever going to have

None of those are fine. The agent era deserves what React gave the UI era: a small, stable, composable substrate that gets out of your way.

**Lessons from shipping Phase 0 + 1 solo:**

1. **Contracts first.** I spent the first month writing ADRs, not code. Six contracts (Adapter, Tool, Memory, Retriever, Skill, Runtime) held across 27 PRs without a single breaking change. That's what made v1 possible.

2. **Bundle budgets as CI gates.** Not a goal — a gate. size-limit fails the build if core creeps past 10 KB. This is the only reason principle 1 (zero deps) survived the year.

3. **Small, deep, testable modules.** When the pieces are small enough for one brain to hold, one person can ship 14 packages. That's not a flex — it's a signal about the architecture.

4. **Docs are product.** 74 routes, 13 recipes, 3 migration guides, 7 ADRs. The docs site ships with the release every time, not after.

5. **v1 is a promise, not a version.** Shipping 1.0 means almost nothing. Keeping it stable — frozen API at the minor level, ADR-pinned contracts, deprecation cycles — is the actual work.

**What's next:**
Phase 2 is additive: deterministic replay, hierarchical memory, durable execution, multi-agent topologies, PII redaction. The substrate holds. None of it requires breaking core.

**Contribute:**
10 good-first-issues are waiting. Adapters (Cohere, Groq, Bedrock), tools, recipes, templates. The bar is high, the scope is clear, the code is small.

Built by one. Ready for many. Come help: {{BLOG_URL}}

#javascript #typescript #ai #agents #opensource

---

## 3 — Hacker News "Show HN"

**Title (80 char limit):**
`Show HN: AgentsKit v1 – JS agent toolkit, 5KB core, zero deps, 6 pinned contracts`

**URL field:**
{{BLOG_URL}}

**First comment (post immediately after submitting):**

Maintainer here. Quick context on what this is and what it isn't.

**What it is:** a 14-package monorepo for building AI agents in JavaScript. The `@agentskit/core` package is 5.17 KB gzipped with zero runtime dependencies — just types, events, and six contracts (Adapter, Tool, Memory, Retriever, Skill, Runtime). Every other package plugs into those contracts.

**What it is not:** a framework. There's no App, no Provider, no lifecycle. You import `createChatController` (or `runtime.run`, or `useChat`) and compose. If you've used Radix UI's "headless + composable" model for agents instead of UI, that's the design target.

**Why v1 now:**
- The six contracts held across 18 Phase 0 PRs + 9 Phase 1 PRs without breakage.
- `size-limit` enforces the 10KB core budget in CI — we're at 5.17KB (48% headroom).
- 538 tests green across all 14 packages.
- Every user-facing change ships with a Changeset.

At v1, `@agentskit/core` commits to: API frozen at the minor level, contract changes require new ADRs, deprecations live ≥1 minor release before removal.

**What's different from `ai-sdk`, LangChain.js, and Mastra:**
- Smaller core (5 KB vs. their much larger substrates)
- Contracts are explicit and versioned via ADR (not implicit in the SDK shape)
- Works with Vercel AI SDK and LangChain as adapters — not a replacement, a substrate

**Honest caveats:**
- Built solo by me so far. That's why I'm posting — 10 good-first-issues are open and the roadmap is public.
- Only core is at v1. The other packages are 0.x and graduate individually per a stability policy in the repo.
- Fumadocs docs site is still being polished; expect a few rough edges.

Roadmap: https://github.com/users/EmersonBraun/projects/1
Manifesto: https://github.com/EmersonBraun/agentskit/blob/main/MANIFESTO.md

Happy to answer anything.

---

## 4 — Reddit

### r/javascript (title + body)

**Title:**
`Released @agentskit/core v1.0 — 5KB, zero deps, 6 ADR-pinned contracts for building agents in JS`

**Body:**
Hey r/javascript — shipped the first stable release of an agent toolkit I've been building solo for the past year.

**TL;DR:** 14 plug-and-play packages on a 5.17 KB gzipped core. Zero runtime deps. Six contracts (Adapter, Tool, Memory, Retriever, Skill, Runtime) pinned to ADRs. MIT.

At v1, core commits to a stable API at the minor level. Contract changes require a new ADR + coordinated major bump. 538 tests, bundle budgets enforced in CI.

Install:
```
npm i @agentskit/core@1 @agentskit/react @agentskit/adapters
```

Works with OpenAI, Anthropic, Gemini, Grok, Ollama, DeepSeek, LangChain, Vercel AI SDK. Swap any of them without rewriting agent code.

Docs + roadmap: {{BLOG_URL}}

Built by one. 10 good-first-issues open. Questions/feedback welcome.

### r/reactjs (title + body)

**Title:**
`useChat hook without the framework — @agentskit/react v0.5 (core just hit 1.0)`

**Body:**
If you've wanted a `useChat` that's truly headless (no styles, no framework lock-in, no opinionated Provider tree) — that's what `@agentskit/react` gives you.

Sits on a 5KB core with zero deps. Adapter seam means you can swap OpenAI → Anthropic → local Ollama without touching your components. `data-ak-*` attributes let you style however you want (Tailwind, CSS modules, shadcn, whatever).

New in this release: `edit(messageId)` and `regenerate()` for optimistic-UI editing. Auto-retry with exponential backoff baked into every adapter.

```tsx
const { messages, send, edit, regenerate } = useChat({
  adapter: openaiAdapter({ apiKey: env.OPENAI_API_KEY }),
})
```

MIT, 538 tests across the ecosystem. {{BLOG_URL}}

### r/LocalLLaMA (title + body)

**Title:**
`AgentsKit v1 — JS agent toolkit that treats Ollama as a first-class citizen, not an afterthought`

**Body:**
Local-first is one of the core principles of AgentsKit, not a checkbox. Just shipped v1 of the core substrate.

- `ollamaAdapter` is in the main adapters package, not a side project.
- Memory runs local-first by default (in-memory, file, SQLite before any cloud option).
- Sandbox uses E2B or WebContainer — no telemetry by default.
- Zero runtime dependencies in the 5KB core means no surprise network calls.

You can wire Llama 3.3 via Ollama into a full agent loop (tools, memory, skills, RAG) in under 20 lines. No OpenAI key anywhere.

```
npm i @agentskit/core@1 @agentskit/react @agentskit/adapters
```

MIT. Roadmap public. Feedback welcome, especially on local/self-hosted workflows: {{BLOG_URL}}

---

## 5 — Dev.to / Hashnode article

**Title:** `Why I rewrote the core of my agent toolkit to ship 1.0`

**Cover image:** OG image (see #9)

**Tags:** `javascript`, `typescript`, `ai`, `opensource`

---

Shipping `1.0` is easy. Keeping it stable is the work.

This is the story of what I cut, what I moved, and what I committed to — so that `@agentskit/core` could graduate to v1 honestly.

## The substrate problem

Every agent toolkit in JavaScript today forces a bad trade-off:

- **Heavyweight SDKs** — drag 200 KB of transitive dependencies, lock you to one provider, break across minor versions.
- **Glue it yourself** — 6 months of adapter layers, retry logic, tool contracts, memory, and eval harness before you ship one line of product code.
- **Frameworks** — inherit every opinion, every lifetime, every breaking change.

I wanted what React gave UIs: a small, stable, composable substrate. That's the target AgentsKit shot for.

## Six contracts, pinned

Before Phase 0 started, I wrote six ADRs — one per contract:

1. **Adapter** — the seam to any LLM provider
2. **Tool** — a function the model can call
3. **Memory** — chat history + vector store
4. **Retriever** — context fetching
5. **Skill** — declarative persona
6. **Runtime** — the loop that composes them all

No code for weeks. Just the interfaces, with counterexamples of what I wouldn't accept.

The payoff: across 18 Phase 0 PRs + 9 Phase 1 PRs, **not one contract broke**. That's what made v1 possible. Every package downstream could trust the shapes it imported.

## What I cut from core

The hard decision was removing `createFileMemory` and `loadConfig` from `@agentskit/core`. Both were Node-only — they imported `node:fs/promises`. Any browser consumer crashed.

Manifesto principle 1 says core works in any environment. Both helpers violated it.

**The move:**
```diff
- import { createFileMemory } from '@agentskit/core'
+ import { fileChatMemory } from '@agentskit/memory'

- import { loadConfig } from '@agentskit/core'
+ import { loadConfig } from '@agentskit/cli'
```

Two import swaps. Breaking for anyone on 0.4.x, but the alternative was a core that lied about being universal.

## The 10 KB gate

Zero runtime dependencies is easy to claim and easy to violate by accident. The only thing that kept it honest was a CI gate: `size-limit` fails the build if `@agentskit/core` creeps past 10 KB gzipped.

We're at 5.17 KB. 48% headroom.

Every PR that touches core runs the budget check. No one — including me — can merge a contribution that imports a new package into the substrate. That's what makes the number real.

## What v1 actually promises

Saying "1.0" means nothing. **Keeping it stable** is the work.

At v1, `@agentskit/core` commits to:

- **API frozen at the minor level.** Breaking changes require a major bump + deprecation cycle.
- **Contracts pinned to ADRs.** Changing Adapter, Tool, Memory, Retriever, Skill, or Runtime requires a new ADR + coordinated major bump across affected packages.
- **Deprecations live ≥ 1 minor release** before removal.
- **Every user-facing change** ships with a Changeset.

The substrate stops moving. Your code stops breaking. That's the deal.

## What's next

Phase 2 is additive. Deterministic replay, hierarchical memory, durable execution, multi-agent topologies, PII redaction. The substrate holds — none of it requires a breaking change to core.

## Try it

```bash
npm i @agentskit/core@1 @agentskit/react @agentskit/adapters
```

Canonical post: {{BLOG_URL}}
Repo: https://github.com/EmersonBraun/agentskit
Roadmap: https://github.com/users/EmersonBraun/projects/1

Built by one. Ready for many. 10 good-first-issues are open.

---

## 7 — Migration guide (0.4.x → 1.0)

> Drop-in location: `apps/docs-next/content/docs/migrating/0.4-to-1.0.mdx`

---
title: "Migrating from 0.4 to 1.0"
description: "Two import swaps. That's it."
---

`@agentskit/core` v1.0.0 removes two Node-only helpers to restore universal browser compatibility. If your project uses them, swap the imports.

## `createFileMemory` moved to `@agentskit/memory`

```diff
- import { createFileMemory } from '@agentskit/core'
+ import { fileChatMemory } from '@agentskit/memory'

- const memory = createFileMemory({ path: './chat.json' })
+ const memory = fileChatMemory({ path: './chat.json' })
```

- Install `@agentskit/memory` if you don't have it: `pnpm add @agentskit/memory`
- `fileChatMemory` has the same options and behavior as the old `createFileMemory`

## `loadConfig` moved to `@agentskit/cli`

```diff
- import { loadConfig, type AgentsKitConfig } from '@agentskit/core'
+ import { loadConfig, type AgentsKitConfig } from '@agentskit/cli'
```

- If you were only using this at runtime, consider whether you need it at all — config loading is a CLI concern.
- `LoadConfigOptions` also moved.

## What didn't change

- `createInMemoryMemory` and `createLocalStorageMemory` stay in core — both are universal.
- Every contract (Adapter, Tool, Memory, Retriever, Skill, Runtime) is unchanged.
- Adapter signatures are unchanged. `@agentskit/adapters` still works as-is.
- `ChatController` is unchanged aside from the additive `edit` + `regenerate` methods.

## Why

Both helpers pulled `node:fs/promises` into core, which crashed any browser consumer. Manifesto principle 1 says core works in any environment. Moving them to packages that already carry Node dependencies restored that guarantee.

See [the canonical v1 announcement]({{BLOG_URL}}) for the full story.

---

## 8 — Changelog highlight reel

> Drop-in location: top of [CHANGELOG.md at repo root] or the "What shipped" section of the blog post.

### v1 cycle — highlights

**`@agentskit/core` 1.0.0**
- 🎉 Graduates to v1 — API frozen at the minor level, contracts pinned to ADRs.
- `ChatController.edit(messageId, newContent)` — optimistic-UI edit preserving contract.
- `ChatController.regenerate(messageId?)` — regenerate any assistant message.
- `AdapterCapabilities` hint type — additive, backwards-compatible.
- **Removed:** `createFileMemory`, `loadConfig` — [moved](./migrating/0.4-to-1.0).

**`@agentskit/cli` 0.5.0**
- `agentskit init` — interactive starter with 4 templates (`react`, `ink`, `runtime`, `multi-agent`).
- `agentskit doctor` — one-shot diagnostics, CI-ready.
- `agentskit dev` — hot-reload with chokidar, keyboard shortcuts.
- `agentskit tunnel` — public URL via localtunnel, no auth.

**`@agentskit/adapters` 0.5.0**
- Auto-retry with exponential backoff in every adapter.
- `mockAdapter`, `recordingAdapter`, `replayAdapter`, `inMemorySink` — first-class dry-run primitives.
- `simulateStream` + `chunkText` helpers for non-streaming endpoints.
- Optional `capabilities` field on every adapter factory.

**`@agentskit/observability` 0.3.0**
- `costGuard` — enforce a USD budget per run, abort cleanly.

**`@agentskit/react` + `@agentskit/ink` 0.5.0**
- `useChat` mirrors the new `edit` + `regenerate` surface.

**`@agentskit/memory` 0.5.0**
- `fileChatMemory` now lives here (was `createFileMemory` in core).

**Ecosystem-wide**
- 538 tests green across 14 packages.
- Bundle-size CI gate holds for every package.
- E2E Playwright across 4 example apps, 10/10 passing.

---

## 9 — OG image brief (for a designer or a Figma pass)

**Dimensions:** 1200 × 630 (standard OG)
**Background:** Midnight `#0D1117` with faint triangular grid
**Composition (left → right):**
- Left 40%: AgentsKit triangle logo (3 circles, monochrome foam `#E6EDF3`), centered vertically
- Right 60%:
  - Line 1 (small, mono, `#58A6FF`): `@agentskit/core`
  - Line 2 (huge, bold, `#E6EDF3`): `v1.0`
  - Line 3 (medium, `#E6EDF3`): `The JavaScript agent toolkit that doesn't lock you in.`
  - Line 4 (small, mono, `#2EA043`): `5.17 KB · zero deps · 6 pinned contracts`

**Files:** export as `apps/docs-next/public/og-core-v1.png` + wire via `metadata.openGraph.images` in `apps/docs-next/app/(home)/page.tsx` and in the blog post front-matter if Fumadocs supports per-doc OG.

**Production options if you don't want to design by hand:**
- Vercel OG (`@vercel/og`) — generate dynamically from an Edge function
- Figma template from [OG Image Playground](https://og-playground.vercel.app)
- Your existing brand-1.4 Figma file (triangle + B palette already there)

---

## 10 — Demo GIF brief (for Terminalizer or asciinema)

**Target:** 30 seconds, looping, < 3 MB.

**Script:**
```
$ npx @agentskit/cli init
  ◈ Project name: › my-agent
  ◈ Template: › react  (React + Vite)
  ◈ Provider: › openai
  ◈ Tools: › web-search, fs
  ◈ Memory: › file
  ◈ Package manager: › pnpm
  ✓ Scaffolded in my-agent/
$ cd my-agent && pnpm dev
  ▲ ready at http://localhost:5173
```

Then switch to a second terminal panel (side-by-side) showing a browser frame with the starter chat responding to "Summarize the AgentsKit manifesto."

**Tools:**
- `asciinema rec` + `agg` (gif export) — simplest pipeline
- Terminalizer — more styled output, slower
- QuickTime + Gifski — if you want real browser capture side-by-side

**Files:** `apps/docs-next/public/demo-init.gif` + embed in the blog post and the README "Quick start" section.

---

## Launch day checklist

- [ ] Deploy docs-next (Vercel) so `{{BLOG_URL}}` resolves
- [ ] Replace all `{{BLOG_URL}}` placeholders in this file
- [ ] Publish the blog post (#6) — already in the repo at `apps/docs-next/content/docs/announcements/core-v1.mdx`
- [ ] Drop OG image at `apps/docs-next/public/og-core-v1.png`
- [ ] Post X thread (#1)
- [ ] Post LinkedIn (#2) — 30 min after X, different copy
- [ ] Submit Show HN (#3) — Tuesday or Wednesday, 8–10 AM PT
- [ ] Cross-post Reddit (#4) — after HN, space them 1+ hours apart
- [ ] Publish Dev.to article (#5) — end of day, links back to blog post
- [ ] Add migration guide (#7) to docs — `content/docs/migrating/0.4-to-1.0.mdx`
- [ ] Pin the HN comment with roadmap + good-first-issues
- [ ] Reply to everything for the first 4 hours
