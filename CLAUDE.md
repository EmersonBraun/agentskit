# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this

AgentsKit is a monorepo for building AI chat interfaces across React, terminal (Ink), and CLI. It uses pnpm workspaces + Turborepo.

## Commands

```bash
pnpm install                          # install all deps
pnpm build                            # build all packages (turborepo)
pnpm test                             # run all tests (vitest via turborepo)
pnpm lint                             # type-check all packages (tsc --noEmit)
pnpm dev                              # watch mode for all packages

# Single package
pnpm --filter @agentskit/core test     # test one package
pnpm --filter @agentskit/react build   # build one package
pnpm --filter @agentskit/adapters test -- --watch  # watch mode

# Apps
pnpm --filter @agentskit/docs start    # docusaurus dev server
pnpm --filter @agentskit/example-react dev  # vite dev server
pnpm --filter @agentskit/example-ink dev    # tsx runner
```

## Package dependency graph

```
@agentskit/core          (zero deps — portable runtime)
  ├── @agentskit/adapters   (provider adapters, depends on core)
  ├── @agentskit/react      (React hooks + components, depends on core)
  ├── @agentskit/ink        (Ink terminal components, depends on core)
  └── @agentskit/cli        (CLI tool, depends on core + adapters + ink)

@agentskit-react/core       (legacy compat bridge, re-exports react + adapters)
```

## Architecture

**Core** (`packages/core`) — Framework-agnostic runtime. `ChatController` is the central state machine: manages messages, streaming, tool execution, memory, and retrieval. All UI packages (`react`, `ink`) wrap `ChatController` via `useChat`.

**Adapters** (`packages/adapters`) — Each adapter implements `AdapterFactory.createSource()` returning a `StreamSource` that yields `StreamChunk` async iterables. Providers: Anthropic, OpenAI, Gemini, Ollama, Vercel AI, LangChain, DeepSeek, Grok, Kimi, and a generic adapter for any `ReadableStream`. New adapters use `createAdapter()` helper for SSE parsing.

**React** (`packages/react`) — Three hooks (`useChat`, `useStream`, `useReactive`) plus headless components (`ChatContainer`, `Message`, `InputBar`, `CodeBlock`, `Markdown`, `ThinkingIndicator`, `ToolCallView`). Components use `data-ak-*` attributes for styling, with an optional default CSS theme at `@agentskit/react/theme`.

**Ink** (`packages/ink`) — Terminal equivalents of the React components, using the Ink framework.

**CLI** (`packages/cli`) — `agentskit chat` and `agentskit init` commands via Commander.

## Code conventions

- TypeScript strict mode, no `any` — use `unknown` and narrow
- Named exports only, no default exports
- Components are headless — no hardcoded styles, use `data-ak-*` attributes
- All packages build with tsup, dual CJS/ESM output
- Tests use vitest
- Changesets for versioning (`pnpm changeset`)
