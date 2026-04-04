# React Arrow — Design Spec

> A React library for the agentic era. Inspired by [Arrow.js](https://arrow-js.com/).

## Overview

React Arrow is a hooks-first React library for building AI chat interfaces with streaming support. It brings Arrow.js's philosophy — minimal API, fine-grained reactivity, agent-friendly design — into the React ecosystem.

**Target audience:** Both human developers building AI products AND AI coding agents generating UI code.

## Core Philosophy

- **3 hooks = the whole library** — mirrors Arrow.js's 3-function API
- **Headless by default** — components ship unstyled, optional theme layer
- **Stream-native** — built around async streams, not request/response
- **Agent-friendly** — API small enough to fit in an LLM context window
- **Tree-shakeable** — single package, import only what you use

## Package: `react-arrow`

Single npm package with subpath exports for tree-shaking:

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./adapters": "./dist/adapters/index.js",
    "./theme": "./dist/theme/default.css"
  }
}
```

## Core Hooks

### `useStream(source, options?)`

The fundamental streaming primitive. Consumes any async stream and returns reactive state.

```tsx
const { data, text, status, error, stop } = useStream(source, options?)
```

- `source`: `ReadableStream | AsyncIterator` | adapter output
- `data`: latest chunk
- `text`: accumulated full text
- `status`: `'idle' | 'streaming' | 'complete' | 'error'`
- `error`: error object if status is `'error'`
- `stop()`: abort the stream

### `useReactive(initialState)`

Proxy-based fine-grained reactive state that minimizes re-renders. Reads are tracked, writes trigger only affected subscribers. Internally uses `useSyncExternalStore` to bridge proxy-based tracking with React's reconciliation model.

```tsx
const state = useReactive({ count: 0, messages: [] })
state.count++ // only components reading .count re-render
```

### `useChat(config)`

High-level chat session orchestrator. Manages messages, streaming, and input state.

```tsx
const chat = useChat({
  adapter: anthropic({ apiKey, model }),
  onMessage?: (msg) => void,
  onError?: (err) => void,
  initialMessages?: Message[],
})
```

Returns:
- `chat.messages` — reactive message array
- `chat.send(text)` — send user message and stream response
- `chat.stop()` — abort current stream
- `chat.retry()` — retry last message
- `chat.status` — `'idle' | 'streaming' | 'error'`
- `chat.input` — controlled input state

### Message and ToolCall Types

```ts
type ToolCall = {
  id: string
  name: string
  args: Record<string, unknown>
  result?: string
  status: 'pending' | 'running' | 'complete' | 'error'
}

type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  status: 'pending' | 'streaming' | 'complete' | 'error'
  toolCalls?: ToolCall[]
  metadata?: Record<string, unknown>
  createdAt: Date
}
```

## Adapters

Each adapter normalizes a provider's streaming API into a common `StreamSource`:

```ts
type StreamSource = {
  stream: () => AsyncIterableIterator<StreamChunk>
  abort: () => void
}

type StreamChunk = {
  type: 'text' | 'tool_call' | 'error' | 'done'
  content?: string
  toolCall?: { id: string; name: string; args: string; result?: string }
}
```

### Built-in Adapters

| Adapter | Import | Usage |
|---------|--------|-------|
| Anthropic | `react-arrow/adapters` | `anthropic({ apiKey, model })` |
| OpenAI | `react-arrow/adapters` | `openai({ apiKey, model })` |
| Vercel AI SDK | `react-arrow/adapters` | `vercelAI({ api: '/api/chat' })` |
| Generic | `react-arrow/adapters` | `generic({ send: async (msgs) => ReadableStream })` |

### Custom Adapters

```tsx
import { createAdapter } from 'react-arrow/adapters'
const myAdapter = createAdapter({ send, parse, abort })
```

## Components

All components are headless — they render semantic HTML with `data-ra-*` attributes. Import `react-arrow/theme` for a styled default.

| Component | Props | Purpose |
|-----------|-------|---------|
| `ChatContainer` | `chat`, `className` | Scrollable container, auto-scrolls on new content |
| `Message` | `message`, `avatar?`, `actions?` | Chat bubble, handles streaming text animation |
| `Markdown` | `content`, `streaming?` | Markdown renderer with streaming token support |
| `CodeBlock` | `code`, `language?`, `copyable?` | Syntax-highlighted code with copy button |
| `ToolCall` | `toolCall` | Expandable tool invocation (name, args, result) |
| `ThinkingIndicator` | `visible`, `label?` | Animated thinking/loading state |
| `InputBar` | `chat`, `placeholder?`, `disabled?` | Text input + send button, Enter/Shift+Enter |

### Quick Start Example

```tsx
import { useChat, ChatContainer, Message, InputBar } from 'react-arrow'
import 'react-arrow/theme'

function App() {
  const chat = useChat({ adapter: anthropic({ model: 'claude-sonnet-4-6' }) })
  return (
    <ChatContainer chat={chat}>
      {chat.messages.map(msg => (
        <Message key={msg.id} message={msg} />
      ))}
      <InputBar chat={chat} />
    </ChatContainer>
  )
}
```

## Theme System

- Default theme: single CSS file (`react-arrow/theme`)
- CSS custom properties for all tokens: `--ra-color-bg`, `--ra-color-bubble-user`, `--ra-font-size`, etc.
- Light/dark mode via `prefers-color-scheme` or `data-theme="dark"` attribute
- All components use `data-ra-*` attributes for zero-specificity styling hooks
- Users can override any token or use fully custom CSS

## Documentation Site (Docusaurus v3)

### Structure

```
docs/
├── Landing Page          — hero, animated demo, features, "inspired by Arrow.js"
├── Getting Started
│   ├── Installation
│   ├── Quick Start       — 10-line chat example
│   └── For AI Agents     — condensed API (<2000 tokens)
├── Core Hooks
│   ├── useStream
│   ├── useReactive
│   └── useChat
├── Components
│   ├── Individual component docs
│   └── Composing Components
├── Adapters
│   ├── Built-in adapters
│   └── Creating Custom Adapters
├── Theming
│   ├── Default Theme
│   ├── CSS Tokens Reference
│   └── Custom Themes
├── Examples
│   ├── Basic Chat
│   ├── Multi-model Chat
│   ├── Tool Use Visualization
│   ├── Custom Styled Chat
│   └── Headless + Tailwind
└── API Reference         — auto-generated from TypeScript
```

### Key Features

- Custom branded landing page with animated streaming text demo
- Live interactive playgrounds (CodeSandbox/StackBlitz)
- Agent-friendly single page — entire API in <2000 tokens for LLM context
- Custom logo and color palette
- Light/dark mode
- Deploy to GitHub Pages via GitHub Actions

## Repo Structure

```
react-arrow/
├── src/
│   ├── core/             — useStream, useReactive, useChat, types
│   ├── components/       — ChatContainer, Message, Markdown, etc.
│   ├── adapters/         — anthropic, openai, vercel-ai, generic, createAdapter
│   ├── theme/            — default.css, tokens.css
│   └── index.ts          — main entry, re-exports
├── docs/                 — Docusaurus site
├── examples/             — standalone example apps
├── tests/                — vitest + react testing library
├── package.json
├── tsconfig.json
├── tsup.config.ts        — ESM + CJS output
├── vitest.config.ts
└── README.md
```

## Tooling

| Tool | Purpose |
|------|---------|
| TypeScript (strict) | Language, full type exports |
| tsup | Bundler — ESM + CJS, tree-shaking |
| Vitest | Unit/integration testing |
| React Testing Library | Component tests |
| Docusaurus v3 | Documentation site |
| Changesets | Versioning and changelog |
| GitHub Actions | CI (lint, test, build) + docs deploy |

## Attribution

The README, landing page, and docs will clearly state: "Inspired by [Arrow.js](https://arrow-js.com/) — a tiny reactive UI framework for the agentic era."
