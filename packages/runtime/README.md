# @agentskit/runtime

Standalone agent runtime for [AgentsKit](https://github.com/EmersonBraun/agentskit). Run autonomous agents with a ReAct loop — no UI required.

## Install

```bash
npm install @agentskit/runtime @agentskit/adapters
```

## Quick example

```ts
import { createRuntime } from '@agentskit/runtime'
import { openai } from '@agentskit/adapters'

const runtime = createRuntime({
  adapter: openai({ apiKey: 'your-key', model: 'gpt-4o' }),
  tools: [mySearchTool, myFileSystemTool],
  systemPrompt: 'You are a helpful research assistant.',
})

const result = await runtime.run('Research quantum computing')

console.log(result.content)    // final response
console.log(result.steps)      // number of ReAct steps
console.log(result.toolCalls)  // all tool calls made
console.log(result.durationMs) // total execution time
```

## Features

- ReAct loop: observe → think → act → repeat until done
- Tool results injected as messages — LLM decides when to stop
- Lazy tool `init()`/`dispose()` lifecycle
- Skill activation with `onActivate()` tool merging
- Tool errors injected as results — LLM decides recovery
- `AbortSignal` support for per-run cancellation
- Memory save at end of run
- Emits `AgentEvent`s for observability

## Docs

[Full documentation](https://emersonbraun.github.io/agentskit/)
