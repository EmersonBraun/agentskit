# @agentskit/core

Portable runtime for the [AgentsKit](https://github.com/EmersonBraun/agentskit) ecosystem. Zero external dependencies.

## Install

```bash
npm install @agentskit/core
```

## What's inside

- `createChatController` — state machine for chat: messages, streaming, tools, memory
- Shared primitives: `generateId`, `buildMessage`, `executeToolCall`, `consumeStream`, `createEventEmitter`
- Memory: `createInMemoryMemory`, `createLocalStorageMemory`, `createFileMemory`
- Retrieval: `createStaticRetriever`
- Type contracts: `ToolDefinition`, `SkillDefinition`, `VectorMemory`, `AgentEvent`, `Observer`, `EvalSuite`

## Quick example

```ts
import { createChatController, createInMemoryMemory } from '@agentskit/core'

const controller = createChatController({
  adapter: myAdapter,
  memory: createInMemoryMemory(),
})

await controller.send('Hello!')
console.log(controller.getState().messages)
```

## Docs

[Full documentation](https://emersonbraun.github.io/agentskit/)
