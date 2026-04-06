---
sidebar_position: 1
---

# Runtime

`@agentskit/runtime` is the execution engine for autonomous agents. It runs a ReAct loop — observe, think, act — until the model produces a final answer or a step limit is reached.

## Install

```bash
npm install @agentskit/runtime @agentskit/adapters
```

## Basic usage

```ts
import { createRuntime } from '@agentskit/runtime'
import { anthropic } from '@agentskit/adapters'

const runtime = createRuntime({
  adapter: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, model: 'claude-sonnet-4-6' }),
})

const result = await runtime.run('What is 3 + 4?')
console.log(result.content) // "7"
```

### Demo adapter (no API key)

```ts
import { createRuntime } from '@agentskit/runtime'
import { generic } from '@agentskit/adapters'

const runtime = createRuntime({
  adapter: generic({ /* custom send/parse */ }),
})
```

## ReAct loop

Each call to `runtime.run()` enters the following loop:

```
observe  →  think  →  act  →  observe  →  ...
```

1. **Observe** — retrieve context from memory or a retriever and inject it into the prompt.
2. **Think** — send messages + tools to the LLM and stream the response.
3. **Act** — if the LLM calls tools, execute them and append results as `tool` messages.
4. Repeat until the model returns a plain text response or `maxSteps` is reached.

## `RunResult`

`runtime.run()` resolves to a `RunResult` object:

```ts
interface RunResult {
  content: string      // Final text response from the model
  messages: Message[]  // Full conversation including tool calls and results
  steps: number        // How many loop iterations ran
  toolCalls: ToolCall[] // Every tool call made during the run
  durationMs: number   // Total wall-clock time
}
```

### Example

```ts
const result = await runtime.run('List the files in the current directory', {
  tools: [shell({ allowed: ['ls'] })],
})

console.log(result.content)   // Model's final answer
console.log(result.steps)     // e.g. 2
console.log(result.durationMs) // e.g. 1340
result.toolCalls.forEach(tc => {
  console.log(tc.name, tc.args, tc.result)
})
```

## `RuntimeConfig`

```ts
interface RuntimeConfig {
  adapter: AdapterFactory        // Required — the LLM provider
  tools?: ToolDefinition[]       // Tools available to the agent
  systemPrompt?: string          // Default system prompt
  memory?: ChatMemory            // Persist and reload conversation history
  retriever?: Retriever          // RAG source injected each step
  observers?: Observer[]         // Event listeners (logging, tracing)
  maxSteps?: number              // Max loop iterations (default: 10)
  temperature?: number
  maxTokens?: number
  delegates?: Record<string, DelegateConfig>
  maxDelegationDepth?: number    // Default: 3
}
```

## `RunOptions`

Override per-call defaults on `runtime.run(task, options)`:

```ts
const result = await runtime.run('Summarize this document', {
  systemPrompt: 'You are a concise summarizer.',
  tools: [readFileTool],
  maxSteps: 5,
  skill: summarizer,
})
```

## Aborting a run

Pass an `AbortSignal` to cancel mid-run. The runtime checks the signal before each step and before each tool call.

```ts
const controller = new AbortController()

setTimeout(() => controller.abort(), 5000) // cancel after 5 s

const result = await runtime.run('Long running task', {
  signal: controller.signal,
})
```

## Memory

When a `memory` is configured, the runtime saves all messages at the end of each run. On the next run it reloads prior context automatically.

```ts
import { createRuntime } from '@agentskit/runtime'
import { inMemory } from '@agentskit/memory'
import { anthropic } from '@agentskit/adapters'

const runtime = createRuntime({
  adapter: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, model: 'claude-sonnet-4-6' }),
  memory: inMemory(),
})

await runtime.run('My name is Alice.')
const result = await runtime.run('What is my name?')
console.log(result.content) // "Your name is Alice."
```

Memory is saved after `RunResult` is assembled — if you abort early, partial messages are still persisted up to the abort point.

## Related

- [Tools](./tools.md) — built-in tool definitions
- [Skills](./skills.md) — role-based system prompts
- [Delegation](./delegation.md) — multi-agent coordination
