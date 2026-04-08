---
sidebar_position: 1
---

# Installation

Install only what you need. Every package is independently installable.

## Chat UIs (React)

```bash
npm install @agentskit/react @agentskit/adapters
```

## Chat UIs (Terminal)

```bash
npm install @agentskit/ink @agentskit/adapters
```

## Running Agents

```bash
npm install @agentskit/runtime @agentskit/adapters @agentskit/tools
```

## Full Ecosystem

```bash
npm install @agentskit/core @agentskit/react @agentskit/adapters @agentskit/runtime @agentskit/tools @agentskit/skills @agentskit/memory
```

## All Packages

New to the repo? **[Start here (60s)](./read-this-first)** → then the **[Packages overview](../packages/overview)**. API signatures: [TypeDoc](pathname:///agentskit/api-reference/).

| Package | What it does |
|---------|-------------|
| `@agentskit/core` | Types, contracts, shared primitives |
| `@agentskit/react` | React hooks + headless UI components |
| `@agentskit/ink` | Terminal UI components (Ink) |
| `@agentskit/adapters` | LLM provider adapters + embedders |
| `@agentskit/cli` | CLI commands (chat, init, run) |
| `@agentskit/runtime` | Standalone agent runtime (ReAct loop) |
| `@agentskit/tools` | Built-in tools (web search, filesystem, shell) |
| `@agentskit/skills` | Built-in skills (researcher, coder, planner, etc.) |
| `@agentskit/memory` | Persistent backends (SQLite, Redis, vectra) |
| `@agentskit/rag` | Retrieval-augmented generation |
| `@agentskit/observability` | Logging + tracing (console, LangSmith, OpenTelemetry) |
| `@agentskit/sandbox` | Secure code execution (E2B) |
| `@agentskit/eval` | Agent evaluation and benchmarking |
| `@agentskit/templates` | Scaffold tools, skills, and adapters |

## Peer Dependencies

React packages require React 18+:

```bash
npm install react react-dom
```

## Optional: Default Theme

```tsx
import '@agentskit/react/theme'
```

Uses CSS custom properties — override any token without ejecting.
