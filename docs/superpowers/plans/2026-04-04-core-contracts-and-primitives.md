# Core Contracts & Shared Primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve `@agentskit/core` with new type contracts (SkillDefinition, VectorMemory, AgentEvent, Observer, EvalSuite/EvalResult), upgrade ToolDefinition, extract shared primitives from ChatController, and add event emission.

**Architecture:** New types go in `types.ts`. Shared primitives (`consumeStream`, `executeToolCall`, `buildMessage`, `generateId`, `createEventEmitter`) are extracted into `primitives.ts`. ChatController is refactored to import and use these primitives. ChatController gains an `observers` config option and emits AgentEvents at lifecycle points.

**Tech Stack:** TypeScript, vitest, tsup, `@types/json-schema` (devDependency)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `packages/core/package.json` | Modify | Add `@types/json-schema` devDep |
| `packages/core/src/types.ts` | Modify | Add new types, evolve ToolDefinition |
| `packages/core/src/primitives.ts` | Create | Shared building blocks for engines |
| `packages/core/src/controller.ts` | Modify | Refactor to use primitives, emit events |
| `packages/core/src/index.ts` | Modify | Re-export new types and primitives |
| `packages/core/tests/types.test.ts` | Create | Type contract smoke tests |
| `packages/core/tests/primitives.test.ts` | Create | Unit tests for all primitives |
| `packages/core/tests/controller.test.ts` | Create | ChatController unit tests |
| `packages/core/tests/memory.test.ts` | Create | Memory implementation tests |
| `packages/core/tests/helpers.ts` | Create | Shared test utilities (mock adapter, etc.) |

---

### Task 1: Add `@types/json-schema` devDependency

**Files:**
- Modify: `packages/core/package.json`

- [ ] **Step 1: Install the type package**

Run: `pnpm --filter @agentskit/core add -D @types/json-schema`

- [ ] **Step 2: Verify it installed**

Run: `pnpm --filter @agentskit/core lint`
Expected: PASS (no errors)

- [ ] **Step 3: Commit**

```bash
git add packages/core/package.json pnpm-lock.yaml
git commit -m "chore(core): add @types/json-schema devDependency"
```

---

### Task 2: Evolve types.ts with new contracts

**Files:**
- Modify: `packages/core/src/types.ts`
- Create: `packages/core/tests/types.test.ts`

- [ ] **Step 1: Write type contract smoke tests**

```ts
// packages/core/tests/types.test.ts
import { describe, it, expectTypeOf } from 'vitest'
import type {
  ToolDefinition,
  SkillDefinition,
  VectorMemory,
  AgentEvent,
  Observer,
  EvalSuite,
  EvalTestCase,
  EvalResult,
} from '../src/types'
import type { JSONSchema7 } from 'json-schema'

describe('type contracts', () => {
  it('ToolDefinition accepts JSONSchema7 schema', () => {
    const tool: ToolDefinition = {
      name: 'test',
      schema: { type: 'object', properties: { q: { type: 'string' } } },
    }
    expectTypeOf(tool.schema).toEqualTypeOf<JSONSchema7 | undefined>()
  })

  it('ToolDefinition execute can return AsyncIterable', () => {
    const tool: ToolDefinition = {
      name: 'stream-tool',
      async *execute() { yield 'chunk' },
    }
    expectTypeOf(tool).toMatchTypeOf<ToolDefinition>()
  })

  it('ToolDefinition supports lifecycle methods', () => {
    const tool: ToolDefinition = {
      name: 'stateful',
      init: async () => {},
      dispose: async () => {},
    }
    expectTypeOf(tool).toMatchTypeOf<ToolDefinition>()
  })

  it('ToolDefinition supports discovery metadata', () => {
    const tool: ToolDefinition = {
      name: 'search',
      tags: ['web', 'search'],
      category: 'retrieval',
    }
    expectTypeOf(tool.tags).toEqualTypeOf<string[] | undefined>()
    expectTypeOf(tool.category).toEqualTypeOf<string | undefined>()
  })

  it('SkillDefinition has required and optional fields', () => {
    const skill: SkillDefinition = {
      name: 'researcher',
      description: 'Researches topics',
      systemPrompt: 'You are a researcher.',
      examples: [{ input: 'hi', output: 'hello' }],
      tools: ['web_search'],
      delegates: ['summarizer'],
      temperature: 0.7,
      onActivate: async () => ({ tools: [] }),
    }
    expectTypeOf(skill.name).toBeString()
    expectTypeOf(skill.onActivate).toMatchTypeOf<
      (() => Promise<{ tools?: ToolDefinition[] }>) | undefined
    >()
  })

  it('VectorMemory accepts number[] embeddings only', () => {
    const mem: VectorMemory = {
      store: async () => {},
      search: async () => [],
    }
    expectTypeOf(mem.search).parameter(0).toEqualTypeOf<number[]>()
  })

  it('Observer has name and on handler', () => {
    const obs: Observer = {
      name: 'test',
      on: () => {},
    }
    expectTypeOf(obs.on).parameter(0).toMatchTypeOf<AgentEvent>()
  })

  it('EvalSuite contains test cases', () => {
    const suite: EvalSuite = {
      name: 'basic',
      cases: [
        { input: 'hello', expected: 'hi' },
        { input: 'hello', expected: (r: string) => r.includes('hi') },
      ],
    }
    expectTypeOf(suite.cases).toMatchTypeOf<EvalTestCase[]>()
  })

  it('EvalResult has accuracy and per-case results', () => {
    const result: EvalResult = {
      totalCases: 1,
      passed: 1,
      failed: 0,
      accuracy: 1.0,
      results: [{
        input: 'hi',
        output: 'hello',
        passed: true,
        latencyMs: 100,
      }],
    }
    expectTypeOf(result.accuracy).toBeNumber()
    expectTypeOf(result.results[0].tokenUsage).toEqualTypeOf<
      { prompt: number; completion: number } | undefined
    >()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @agentskit/core test`
Expected: FAIL — types don't exist yet

- [ ] **Step 3: Add new types to types.ts**

Add the following to `packages/core/src/types.ts` after the existing types:

```ts
import type { JSONSchema7 } from 'json-schema'

// Update existing ToolDefinition to:
export interface ToolDefinition {
  name: string
  description?: string
  schema?: JSONSchema7
  requiresConfirmation?: boolean
  execute?: (
    args: Record<string, unknown>,
    context: ToolExecutionContext,
  ) => MaybePromise<unknown> | AsyncIterable<unknown>
  init?: () => MaybePromise<void>
  dispose?: () => MaybePromise<void>
  tags?: string[]
  category?: string
}

// New types:
export interface SkillDefinition {
  name: string
  description: string
  systemPrompt: string
  examples?: Array<{ input: string; output: string }>
  tools?: string[]
  delegates?: string[]
  temperature?: number
  metadata?: Record<string, unknown>
  onActivate?: () => MaybePromise<{ tools?: ToolDefinition[] }>
}

export interface VectorDocument {
  id: string
  content: string
  embedding: number[]
  metadata?: Record<string, unknown>
}

export interface VectorMemory {
  store: (docs: VectorDocument[]) => MaybePromise<void>
  search: (
    embedding: number[],
    options?: { topK?: number; threshold?: number },
  ) => MaybePromise<RetrievedDocument[]>
  delete?: (ids: string[]) => MaybePromise<void>
}

export type AgentEvent =
  | { type: 'llm:start'; model?: string; messageCount: number }
  | { type: 'llm:first-token'; latencyMs: number }
  | { type: 'llm:end'; content: string; usage?: { promptTokens: number; completionTokens: number }; durationMs: number }
  | { type: 'tool:start'; name: string; args: Record<string, unknown> }
  | { type: 'tool:end'; name: string; result: string; durationMs: number }
  | { type: 'memory:load'; messageCount: number }
  | { type: 'memory:save'; messageCount: number }
  | { type: 'agent:step'; step: number; action: string }
  | { type: 'error'; error: Error }

export interface Observer {
  name: string
  on: (event: AgentEvent) => void | Promise<void>
}

export interface EvalTestCase {
  input: string
  expected: string | ((result: string) => boolean)
  metadata?: Record<string, unknown>
}

export interface EvalResult {
  totalCases: number
  passed: number
  failed: number
  accuracy: number
  results: Array<{
    input: string
    output: string
    passed: boolean
    latencyMs: number
    tokenUsage?: { prompt: number; completion: number }
    error?: string
  }>
}

export interface EvalSuite {
  name: string
  cases: EvalTestCase[]
}
```

Also update `ChatConfig` to accept observers:

```ts
export interface ChatConfig {
  // ... existing fields ...
  observers?: Observer[]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @agentskit/core test`
Expected: PASS

- [ ] **Step 5: Verify existing downstream tests still pass**

Run: `pnpm test`
Expected: All packages PASS

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/types.ts packages/core/tests/types.test.ts
git commit -m "feat(core): add SkillDefinition, VectorMemory, AgentEvent, Observer, Eval types and evolve ToolDefinition"
```

---

### Task 3: Create primitives.ts with generateId and createEventEmitter

**Files:**
- Create: `packages/core/src/primitives.ts`
- Create: `packages/core/tests/primitives.test.ts`
- Create: `packages/core/tests/helpers.ts`

- [ ] **Step 1: Write tests for generateId and createEventEmitter**

```ts
// packages/core/tests/helpers.ts
import type { AdapterFactory, AdapterRequest, StreamChunk } from '../src/types'

export function createMockAdapter(chunks: StreamChunk[]): AdapterFactory {
  return {
    createSource: (_request: AdapterRequest) => {
      let aborted = false
      return {
        stream: async function* () {
          for (const chunk of chunks) {
            if (aborted) return
            yield chunk
          }
        },
        abort: () => { aborted = true },
      }
    },
  }
}
```

```ts
// packages/core/tests/primitives.test.ts
import { describe, it, expect, vi } from 'vitest'
import { generateId, createEventEmitter } from '../src/primitives'
import type { Observer, AgentEvent } from '../src/types'

describe('generateId', () => {
  it('generates unique IDs with the given prefix', () => {
    const id1 = generateId('msg')
    const id2 = generateId('msg')
    expect(id1).toMatch(/^msg-\d+-\d+$/)
    expect(id2).toMatch(/^msg-\d+-\d+$/)
    expect(id1).not.toBe(id2)
  })

  it('uses different prefixes', () => {
    const msgId = generateId('msg')
    const toolId = generateId('tool')
    const stepId = generateId('step')
    expect(msgId).toMatch(/^msg-/)
    expect(toolId).toMatch(/^tool-/)
    expect(stepId).toMatch(/^step-/)
  })
})

describe('createEventEmitter', () => {
  it('emits events to all observers', () => {
    const emitter = createEventEmitter()
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    const obs1: Observer = { name: 'a', on: handler1 }
    const obs2: Observer = { name: 'b', on: handler2 }

    emitter.addObserver(obs1)
    emitter.addObserver(obs2)

    const event: AgentEvent = { type: 'llm:start', messageCount: 3 }
    emitter.emit(event)

    expect(handler1).toHaveBeenCalledWith(event)
    expect(handler2).toHaveBeenCalledWith(event)
  })

  it('removeObserver stops delivery', () => {
    const emitter = createEventEmitter()
    const handler = vi.fn()
    const obs: Observer = { name: 'test', on: handler }

    const remove = emitter.addObserver(obs)
    emitter.emit({ type: 'llm:start', messageCount: 1 })
    expect(handler).toHaveBeenCalledTimes(1)

    remove()
    emitter.emit({ type: 'llm:start', messageCount: 2 })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('error in one observer does not break others', () => {
    const emitter = createEventEmitter()
    const badObs: Observer = { name: 'bad', on: () => { throw new Error('boom') } }
    const goodHandler = vi.fn()
    const goodObs: Observer = { name: 'good', on: goodHandler }

    emitter.addObserver(badObs)
    emitter.addObserver(goodObs)

    emitter.emit({ type: 'llm:start', messageCount: 1 })
    expect(goodHandler).toHaveBeenCalledTimes(1)
  })

  it('handles async observers without blocking', () => {
    const emitter = createEventEmitter()
    const asyncObs: Observer = {
      name: 'async',
      on: async () => { await new Promise(r => setTimeout(r, 10)) },
    }
    const syncHandler = vi.fn()
    const syncObs: Observer = { name: 'sync', on: syncHandler }

    emitter.addObserver(asyncObs)
    emitter.addObserver(syncObs)

    // emit should not throw or block
    emitter.emit({ type: 'llm:start', messageCount: 1 })
    expect(syncHandler).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @agentskit/core test`
Expected: FAIL — `primitives.ts` doesn't exist

- [ ] **Step 3: Implement generateId and createEventEmitter**

```ts
// packages/core/src/primitives.ts
import type { AgentEvent, Observer } from './types'

let nextId = 0

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${nextId++}`
}

export function createEventEmitter() {
  const observers = new Set<Observer>()

  return {
    addObserver(observer: Observer): () => void {
      observers.add(observer)
      return () => { observers.delete(observer) }
    },
    emit(event: AgentEvent): void {
      for (const observer of observers) {
        try {
          const result = observer.on(event)
          if (result && typeof (result as Promise<void>).catch === 'function') {
            (result as Promise<void>).catch(() => {})
          }
        } catch {
          // Observer errors must never break the main loop.
        }
      }
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @agentskit/core test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/primitives.ts packages/core/tests/primitives.test.ts packages/core/tests/helpers.ts
git commit -m "feat(core): add generateId and createEventEmitter primitives"
```

---

### Task 4: Extract buildMessage primitive

**Files:**
- Modify: `packages/core/src/primitives.ts`
- Modify: `packages/core/tests/primitives.test.ts`

- [ ] **Step 1: Write tests for buildMessage**

Append to `packages/core/tests/primitives.test.ts`:

```ts
import { buildMessage } from '../src/primitives'
import type { MessageRole, MessageStatus } from '../src/types'

describe('buildMessage', () => {
  it('creates a message with defaults', () => {
    const msg = buildMessage({ role: 'user', content: 'hello' })
    expect(msg.id).toMatch(/^msg-/)
    expect(msg.role).toBe('user')
    expect(msg.content).toBe('hello')
    expect(msg.status).toBe('complete')
    expect(msg.createdAt).toBeInstanceOf(Date)
  })

  it('accepts status override', () => {
    const msg = buildMessage({ role: 'assistant', content: '', status: 'streaming' })
    expect(msg.status).toBe('streaming')
  })

  it('accepts custom id prefix via role', () => {
    const msg = buildMessage({ role: 'system', content: 'sys' })
    expect(msg.id).toMatch(/^msg-/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @agentskit/core test`
Expected: FAIL — `buildMessage` not exported

- [ ] **Step 3: Implement buildMessage**

Add to `packages/core/src/primitives.ts`:

```ts
import type { AgentEvent, Message, MessageRole, MessageStatus, Observer } from './types'

export function buildMessage(params: {
  role: MessageRole
  content: string
  status?: MessageStatus
  metadata?: Record<string, unknown>
}): Message {
  return {
    id: generateId('msg'),
    role: params.role,
    content: params.content,
    status: params.status ?? 'complete',
    metadata: params.metadata,
    createdAt: new Date(),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @agentskit/core test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/primitives.ts packages/core/tests/primitives.test.ts
git commit -m "feat(core): add buildMessage primitive"
```

---

### Task 5: Extract executeToolCall primitive

**Files:**
- Modify: `packages/core/src/primitives.ts`
- Modify: `packages/core/tests/primitives.test.ts`

- [ ] **Step 1: Write tests for executeToolCall**

Append to `packages/core/tests/primitives.test.ts`:

```ts
import { executeToolCall } from '../src/primitives'
import type { ToolDefinition, ToolCall } from '../src/types'

describe('executeToolCall', () => {
  const baseCall: ToolCall = {
    id: 'tc-1',
    name: 'test',
    args: { q: 'hello' },
    status: 'running',
  }

  it('executes a sync tool and returns string result', async () => {
    const tool: ToolDefinition = {
      name: 'test',
      execute: (args) => `result: ${args.q}`,
    }
    const result = await executeToolCall(tool, baseCall.args, {
      messages: [],
      call: baseCall,
    })
    expect(result).toBe('result: hello')
  })

  it('executes an async tool', async () => {
    const tool: ToolDefinition = {
      name: 'test',
      execute: async (args) => `async: ${args.q}`,
    }
    const result = await executeToolCall(tool, baseCall.args, {
      messages: [],
      call: baseCall,
    })
    expect(result).toBe('async: hello')
  })

  it('handles AsyncIterable tools with onPartialResult', async () => {
    const partials: string[] = []
    const tool: ToolDefinition = {
      name: 'stream',
      async *execute() {
        yield 'line1\n'
        yield 'line2\n'
        yield 'line3'
      },
    }
    const result = await executeToolCall(
      tool,
      {},
      { messages: [], call: baseCall },
      (partial) => { partials.push(partial) },
    )
    expect(partials).toEqual(['line1\n', 'line1\nline2\n', 'line1\nline2\nline3'])
    expect(result).toBe('line1\nline2\nline3')
  })

  it('handles AsyncIterable tools without onPartialResult', async () => {
    const tool: ToolDefinition = {
      name: 'stream',
      async *execute() {
        yield 'a'
        yield 'b'
      },
    }
    const result = await executeToolCall(
      tool,
      {},
      { messages: [], call: baseCall },
    )
    expect(result).toBe('ab')
  })

  it('returns empty string for null/undefined results', async () => {
    const tool: ToolDefinition = {
      name: 'void',
      execute: async () => undefined,
    }
    const result = await executeToolCall(tool, {}, { messages: [], call: baseCall })
    expect(result).toBe('')
  })

  it('throws on tool execution error', async () => {
    const tool: ToolDefinition = {
      name: 'fail',
      execute: async () => { throw new Error('tool broke') },
    }
    await expect(
      executeToolCall(tool, {}, { messages: [], call: baseCall })
    ).rejects.toThrow('tool broke')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @agentskit/core test`
Expected: FAIL — `executeToolCall` not exported

- [ ] **Step 3: Implement executeToolCall**

Add to `packages/core/src/primitives.ts`:

```ts
import type {
  AgentEvent, Message, MessageRole, MessageStatus, Observer,
  ToolDefinition, ToolCall, ToolExecutionContext,
} from './types'

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return value != null && typeof value === 'object' && Symbol.asyncIterator in value
}

export async function executeToolCall(
  tool: ToolDefinition,
  args: Record<string, unknown>,
  context: ToolExecutionContext,
  onPartialResult?: (accumulated: string) => void,
): Promise<string> {
  const raw = tool.execute?.(args, context)

  if (isAsyncIterable(raw)) {
    let accumulated = ''
    for await (const chunk of raw) {
      accumulated += String(chunk)
      onPartialResult?.(accumulated)
    }
    return accumulated
  }

  const result = await raw
  return result == null ? '' : String(result)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @agentskit/core test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/primitives.ts packages/core/tests/primitives.test.ts
git commit -m "feat(core): add executeToolCall primitive with AsyncIterable support"
```

---

### Task 6: Extract consumeStream primitive

**Files:**
- Modify: `packages/core/src/primitives.ts`
- Modify: `packages/core/tests/primitives.test.ts`

- [ ] **Step 1: Write tests for consumeStream**

Append to `packages/core/tests/primitives.test.ts`:

```ts
import { consumeStream } from '../src/primitives'
import type { StreamSource, StreamChunk } from '../src/types'

function createMockSource(chunks: StreamChunk[]): StreamSource {
  let aborted = false
  return {
    stream: async function* () {
      for (const chunk of chunks) {
        if (aborted) return
        yield chunk
      }
    },
    abort: () => { aborted = true },
  }
}

describe('consumeStream', () => {
  it('calls onText for text chunks and accumulates content', async () => {
    const texts: string[] = []
    const source = createMockSource([
      { type: 'text', content: 'Hello ' },
      { type: 'text', content: 'world' },
      { type: 'done' },
    ])

    await consumeStream(source, {
      onText: (accumulated) => { texts.push(accumulated) },
      onDone: () => {},
    })

    expect(texts).toEqual(['Hello ', 'Hello world'])
  })

  it('calls onReasoning for reasoning chunks', async () => {
    const reasoning: string[] = []
    const source = createMockSource([
      { type: 'reasoning', content: 'thinking...' },
      { type: 'reasoning', content: ' more' },
      { type: 'done' },
    ])

    await consumeStream(source, {
      onReasoning: (accumulated) => { reasoning.push(accumulated) },
      onDone: () => {},
    })

    expect(reasoning).toEqual(['thinking...', 'thinking... more'])
  })

  it('calls onToolCall for tool_call chunks', async () => {
    const calls: StreamChunk[] = []
    const source = createMockSource([
      { type: 'tool_call', toolCall: { id: 't1', name: 'search', args: '{"q":"hi"}' } },
      { type: 'done' },
    ])

    await consumeStream(source, {
      onToolCall: async (chunk) => { calls.push(chunk) },
      onDone: () => {},
    })

    expect(calls).toHaveLength(1)
    expect(calls[0].toolCall?.name).toBe('search')
  })

  it('calls onError for error chunks', async () => {
    const errors: Error[] = []
    const source = createMockSource([
      { type: 'error', content: 'something failed' },
    ])

    await consumeStream(source, {
      onError: (err) => { errors.push(err) },
      onDone: () => {},
    })

    expect(errors).toHaveLength(1)
    expect(errors[0].message).toBe('something failed')
  })

  it('calls onDone when stream completes normally', async () => {
    const doneFn = vi.fn()
    const source = createMockSource([
      { type: 'text', content: 'hi' },
      { type: 'done' },
    ])

    await consumeStream(source, { onDone: doneFn })

    expect(doneFn).toHaveBeenCalledWith('hi')
  })

  it('calls onToolResult for tool_result chunks', async () => {
    const results: string[] = []
    const source = createMockSource([
      { type: 'tool_result', content: 'result data' },
      { type: 'done' },
    ])

    await consumeStream(source, {
      onToolResult: (content) => { results.push(content) },
      onDone: () => {},
    })

    expect(results).toEqual(['result data'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @agentskit/core test`
Expected: FAIL — `consumeStream` not exported

- [ ] **Step 3: Implement consumeStream**

Add to `packages/core/src/primitives.ts`:

```ts
import type {
  AgentEvent, Message, MessageRole, MessageStatus, Observer,
  StreamChunk, StreamSource,
  ToolDefinition, ToolCall, ToolExecutionContext,
} from './types'

export interface ConsumeStreamHandlers {
  onText?: (accumulated: string) => void
  onReasoning?: (accumulated: string) => void
  onToolCall?: (chunk: StreamChunk) => Promise<void> | void
  onToolResult?: (content: string) => void
  onError?: (error: Error) => void
  onDone: (accumulatedText: string) => void
}

export async function consumeStream(
  source: StreamSource,
  handlers: ConsumeStreamHandlers,
): Promise<void> {
  let accumulatedText = ''
  let accumulatedReasoning = ''

  try {
    const iterator = source.stream()
    for await (const chunk of iterator) {
      if (chunk.type === 'text' && chunk.content) {
        accumulatedText += chunk.content
        handlers.onText?.(accumulatedText)
      } else if (chunk.type === 'reasoning' && chunk.content) {
        accumulatedReasoning += chunk.content
        handlers.onReasoning?.(accumulatedReasoning)
      } else if (chunk.type === 'tool_call') {
        await handlers.onToolCall?.(chunk)
      } else if (chunk.type === 'tool_result' && chunk.content) {
        handlers.onToolResult?.(chunk.content)
      } else if (chunk.type === 'error') {
        handlers.onError?.(new Error(chunk.content ?? 'Stream error'))
        return
      } else if (chunk.type === 'done') {
        break
      }
    }
    handlers.onDone(accumulatedText)
  } catch (error) {
    handlers.onError?.(error instanceof Error ? error : new Error(String(error)))
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @agentskit/core test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/primitives.ts packages/core/tests/primitives.test.ts
git commit -m "feat(core): add consumeStream primitive"
```

---

### Task 7: Refactor ChatController to use primitives and emit events

**Files:**
- Modify: `packages/core/src/controller.ts`
- Create: `packages/core/tests/controller.test.ts`

- [ ] **Step 1: Write ChatController tests**

```ts
// packages/core/tests/controller.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createChatController } from '../src/controller'
import { createInMemoryMemory } from '../src/memory'
import { createMockAdapter } from './helpers'
import type { Observer, AgentEvent, ChatConfig } from '../src/types'

function createTestController(overrides: Partial<ChatConfig> = {}) {
  const adapter = createMockAdapter([
    { type: 'text', content: 'Hello!' },
    { type: 'done' },
  ])
  return createChatController({ adapter, ...overrides })
}

describe('createChatController', () => {
  it('starts with idle status and empty messages', () => {
    const ctrl = createTestController()
    const state = ctrl.getState()
    expect(state.status).toBe('idle')
    expect(state.messages).toEqual([])
    expect(state.input).toBe('')
    expect(state.error).toBeNull()
  })

  it('send() adds user and assistant messages', async () => {
    const ctrl = createTestController()
    await ctrl.send('Hi')
    const state = ctrl.getState()
    expect(state.messages).toHaveLength(2)
    expect(state.messages[0].role).toBe('user')
    expect(state.messages[0].content).toBe('Hi')
    expect(state.messages[1].role).toBe('assistant')
    expect(state.messages[1].content).toBe('Hello!')
    expect(state.messages[1].status).toBe('complete')
    expect(state.status).toBe('idle')
  })

  it('ignores empty send()', async () => {
    const ctrl = createTestController()
    await ctrl.send('')
    await ctrl.send('   ')
    expect(ctrl.getState().messages).toEqual([])
  })

  it('stop() aborts the stream', async () => {
    const abortFn = vi.fn()
    const ctrl = createChatController({
      adapter: {
        createSource: () => ({
          stream: async function* () {
            while (true) {
              yield { type: 'text' as const, content: 'x' }
              await new Promise(r => setTimeout(r, 50))
            }
          },
          abort: abortFn,
        }),
      },
    })

    const sendPromise = ctrl.send('Go')
    // Wait for stream to start
    await new Promise(r => setTimeout(r, 20))
    ctrl.stop()
    await sendPromise.catch(() => {})

    expect(abortFn).toHaveBeenCalled()
    expect(ctrl.getState().status).toBe('idle')
  })

  it('retry() replaces last assistant message', async () => {
    const adapter = createMockAdapter([
      { type: 'text', content: 'first' },
      { type: 'done' },
    ])
    const ctrl = createChatController({ adapter })
    await ctrl.send('Hi')
    expect(ctrl.getState().messages[1].content).toBe('first')

    ctrl.updateConfig({
      adapter: createMockAdapter([
        { type: 'text', content: 'retried' },
        { type: 'done' },
      ]),
    })
    await ctrl.retry()
    const state = ctrl.getState()
    expect(state.messages).toHaveLength(2)
    expect(state.messages[1].content).toBe('retried')
  })

  it('clear() empties messages and calls memory.clear', async () => {
    const memory = createInMemoryMemory()
    const ctrl = createTestController({ memory })
    await ctrl.send('Hi')
    expect(ctrl.getState().messages.length).toBeGreaterThan(0)

    await ctrl.clear()
    expect(ctrl.getState().messages).toEqual([])
  })

  it('setInput updates input value', () => {
    const ctrl = createTestController()
    ctrl.setInput('new input')
    expect(ctrl.getState().input).toBe('new input')
  })

  it('subscribe notifies on state changes', async () => {
    const ctrl = createTestController()
    const listener = vi.fn()
    ctrl.subscribe(listener)
    await ctrl.send('Hi')
    expect(listener.mock.calls.length).toBeGreaterThan(0)
  })

  it('unsubscribe stops notifications', async () => {
    const ctrl = createTestController()
    const listener = vi.fn()
    const unsub = ctrl.subscribe(listener)
    unsub()
    await ctrl.send('Hi')
    expect(listener).not.toHaveBeenCalled()
  })

  it('hydrates from memory on creation', async () => {
    const memory = createInMemoryMemory([{
      id: 'old',
      role: 'assistant',
      content: 'remembered',
      status: 'complete',
      createdAt: new Date(),
    }])
    const ctrl = createTestController({ memory })

    // Wait for async hydration
    await new Promise(r => setTimeout(r, 10))
    expect(ctrl.getState().messages[0]?.content).toBe('remembered')
  })

  it('executes tools and stores results', async () => {
    const execute = vi.fn().mockResolvedValue('sunny')
    const adapter = createMockAdapter([
      { type: 'tool_call', toolCall: { id: 't1', name: 'weather', args: '{"city":"SP"}' } },
      { type: 'done' },
    ])
    const ctrl = createChatController({
      adapter,
      tools: [{ name: 'weather', execute }],
    })

    await ctrl.send('weather?')
    const toolCalls = ctrl.getState().messages[1]?.toolCalls
    expect(toolCalls).toHaveLength(1)
    expect(toolCalls?.[0].result).toBe('sunny')
    expect(toolCalls?.[0].status).toBe('complete')
    expect(execute).toHaveBeenCalledWith(
      { city: 'SP' },
      expect.objectContaining({ call: expect.objectContaining({ name: 'weather' }) }),
    )
  })

  it('handles tool execution errors', async () => {
    const adapter = createMockAdapter([
      { type: 'tool_call', toolCall: { id: 't1', name: 'fail', args: '{}' } },
      { type: 'done' },
    ])
    const ctrl = createChatController({
      adapter,
      tools: [{
        name: 'fail',
        execute: async () => { throw new Error('tool broke') },
      }],
    })

    await ctrl.send('do it')
    const toolCalls = ctrl.getState().messages[1]?.toolCalls
    expect(toolCalls?.[0].status).toBe('error')
    expect(toolCalls?.[0].error).toBe('tool broke')
  })

  it('handles stream errors', async () => {
    const onError = vi.fn()
    const adapter = createMockAdapter([
      { type: 'error', content: 'server died' },
    ])
    const ctrl = createChatController({ adapter, onError })

    await ctrl.send('Hi')
    expect(ctrl.getState().status).toBe('error')
    expect(ctrl.getState().error?.message).toBe('server died')
    expect(onError).toHaveBeenCalled()
  })
})

describe('ChatController event emission', () => {
  it('emits llm:start and llm:end events', async () => {
    const events: AgentEvent[] = []
    const obs: Observer = { name: 'test', on: (e) => { events.push(e) } }
    const adapter = createMockAdapter([
      { type: 'text', content: 'hi' },
      { type: 'done' },
    ])
    const ctrl = createChatController({ adapter, observers: [obs] })

    await ctrl.send('Hello')

    const start = events.find(e => e.type === 'llm:start')
    const end = events.find(e => e.type === 'llm:end')
    expect(start).toBeDefined()
    expect(start?.type === 'llm:start' && start.messageCount).toBeGreaterThan(0)
    expect(end).toBeDefined()
    expect(end?.type === 'llm:end' && end.content).toBe('hi')
    expect(end?.type === 'llm:end' && end.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('emits llm:first-token event', async () => {
    const events: AgentEvent[] = []
    const obs: Observer = { name: 'test', on: (e) => { events.push(e) } }
    const adapter = createMockAdapter([
      { type: 'text', content: 'first' },
      { type: 'text', content: ' second' },
      { type: 'done' },
    ])
    const ctrl = createChatController({ adapter, observers: [obs] })

    await ctrl.send('Go')

    const firstToken = events.filter(e => e.type === 'llm:first-token')
    expect(firstToken).toHaveLength(1)
  })

  it('emits tool:start and tool:end events', async () => {
    const events: AgentEvent[] = []
    const obs: Observer = { name: 'test', on: (e) => { events.push(e) } }
    const adapter = createMockAdapter([
      { type: 'tool_call', toolCall: { id: 't1', name: 'search', args: '{"q":"test"}' } },
      { type: 'done' },
    ])
    const ctrl = createChatController({
      adapter,
      tools: [{ name: 'search', execute: async () => 'found it' }],
      observers: [obs],
    })

    await ctrl.send('search')

    const toolStart = events.find(e => e.type === 'tool:start')
    const toolEnd = events.find(e => e.type === 'tool:end')
    expect(toolStart?.type === 'tool:start' && toolStart.name).toBe('search')
    expect(toolEnd?.type === 'tool:end' && toolEnd.result).toBe('found it')
    expect(toolEnd?.type === 'tool:end' && toolEnd.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('emits memory:load event on hydration', async () => {
    const events: AgentEvent[] = []
    const obs: Observer = { name: 'test', on: (e) => { events.push(e) } }
    const memory = createInMemoryMemory([{
      id: 'old',
      role: 'assistant',
      content: 'hi',
      status: 'complete',
      createdAt: new Date(),
    }])
    createChatController({
      adapter: createMockAdapter([]),
      memory,
      observers: [obs],
    })

    await new Promise(r => setTimeout(r, 10))
    const memLoad = events.find(e => e.type === 'memory:load')
    expect(memLoad?.type === 'memory:load' && memLoad.messageCount).toBe(1)
  })

  it('emits memory:save event after messages change', async () => {
    const events: AgentEvent[] = []
    const obs: Observer = { name: 'test', on: (e) => { events.push(e) } }
    const memory = createInMemoryMemory()
    const adapter = createMockAdapter([
      { type: 'text', content: 'hi' },
      { type: 'done' },
    ])
    const ctrl = createChatController({ adapter, memory, observers: [obs] })

    await ctrl.send('Hello')

    const memSave = events.filter(e => e.type === 'memory:save')
    expect(memSave.length).toBeGreaterThan(0)
  })

  it('emits error event on stream error', async () => {
    const events: AgentEvent[] = []
    const obs: Observer = { name: 'test', on: (e) => { events.push(e) } }
    const adapter = createMockAdapter([
      { type: 'error', content: 'boom' },
    ])
    const ctrl = createChatController({ adapter, observers: [obs] })

    await ctrl.send('Hi')

    const errorEvent = events.find(e => e.type === 'error')
    expect(errorEvent?.type === 'error' && errorEvent.error.message).toBe('boom')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @agentskit/core test`
Expected: FAIL — controller doesn't emit events yet, tests reference new API

- [ ] **Step 3: Refactor controller.ts to use primitives and emit events**

Replace `packages/core/src/controller.ts` entirely with:

```ts
import { formatRetrievedDocuments } from './rag'
import { generateId, buildMessage, consumeStream, executeToolCall, createEventEmitter } from './primitives'
import type {
  AdapterRequest,
  ChatConfig,
  ChatController,
  ChatState,
  Message,
  StreamChunk,
  StreamSource,
  ToolCall,
  ToolDefinition,
} from './types'

function safeParseArgs(args: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(args)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function mergeSystemMessages(messages: Message[], systemPrompt?: string): Message[] {
  if (!systemPrompt) return messages
  if (messages.some(message => message.role === 'system' && message.content === systemPrompt)) {
    return messages
  }
  return [buildMessage({ role: 'system', content: systemPrompt }), ...messages]
}

function buildRetrievalMessage(documentsText: string): Message | null {
  if (!documentsText) return null
  return buildMessage({
    role: 'system',
    content: `Use the retrieved context below when it is relevant.\n\n${documentsText}`,
  })
}

export function createChatController(initialConfig: ChatConfig): ChatController {
  let config = initialConfig
  let source: StreamSource | null = null
  let state: ChatState = {
    messages: initialConfig.initialMessages ?? [],
    status: 'idle',
    input: '',
    error: null,
  }
  const listeners = new Set<() => void>()
  const emitter = createEventEmitter()
  let hydrated = false

  // Register initial observers
  for (const observer of config.observers ?? []) {
    emitter.addObserver(observer)
  }

  const emit = () => {
    for (const listener of listeners) listener()
  }

  const setState = (updater: ChatState | ((current: ChatState) => ChatState)) => {
    state = typeof updater === 'function' ? updater(state) : updater
    void persistMessages(state.messages)
    emit()
  }

  const persistMessages = async (messages: Message[]) => {
    try {
      await config.memory?.save(messages)
      if (config.memory) {
        emitter.emit({ type: 'memory:save', messageCount: messages.length })
      }
    } catch {
      // Memory failures should not break chat usage.
    }
  }

  const hydrateMemory = async () => {
    if (hydrated || !config.memory) return
    hydrated = true

    try {
      const loaded = await config.memory.load()
      if (loaded.length > 0 && state.messages.length === 0) {
        state = { ...state, messages: loaded }
        emitter.emit({ type: 'memory:load', messageCount: loaded.length })
        emit()
      }
    } catch {
      // Ignore hydration failures and continue with in-memory state.
    }
  }

  void hydrateMemory()

  const setAssistantMessage = (assistantId: string, updater: (message: Message) => Message) => {
    setState(current => ({
      ...current,
      messages: current.messages.map(message =>
        message.id === assistantId ? updater(message) : message
      ),
    }))
  }

  const findTool = (name: string): ToolDefinition | undefined =>
    config.tools?.find(tool => tool.name === name)

  const handleToolCall = async (assistantId: string, chunk: StreamChunk) => {
    if (!chunk.toolCall) return

    const args = safeParseArgs(chunk.toolCall.args)
    const tool = findTool(chunk.toolCall.name)
    const toolCall: ToolCall = {
      id: chunk.toolCall.id,
      name: chunk.toolCall.name,
      args,
      result: chunk.toolCall.result,
      status: tool?.requiresConfirmation ? 'requires_confirmation' : 'pending',
    }

    setAssistantMessage(assistantId, message => ({
      ...message,
      toolCalls: [...(message.toolCalls ?? []), toolCall],
    }))

    await config.onToolCall?.(toolCall, { messages: state.messages, tool })

    if (!tool?.execute || tool.requiresConfirmation) {
      if (chunk.toolCall.result) {
        setAssistantMessage(assistantId, message => ({
          ...message,
          toolCalls: (message.toolCalls ?? []).map(call =>
            call.id === toolCall.id
              ? { ...call, result: chunk.toolCall?.result, status: 'complete' as const }
              : call
          ),
        }))
      }
      return
    }

    setAssistantMessage(assistantId, message => ({
      ...message,
      toolCalls: (message.toolCalls ?? []).map(call =>
        call.id === toolCall.id ? { ...call, status: 'running' as const } : call
      ),
    }))

    emitter.emit({ type: 'tool:start', name: toolCall.name, args })
    const toolStart = Date.now()

    try {
      const result = await executeToolCall(
        tool,
        args,
        { messages: state.messages, call: toolCall },
        (partial) => {
          setAssistantMessage(assistantId, message => ({
            ...message,
            toolCalls: (message.toolCalls ?? []).map(call =>
              call.id === toolCall.id ? { ...call, result: partial } : call
            ),
          }))
        },
      )
      setAssistantMessage(assistantId, message => ({
        ...message,
        toolCalls: (message.toolCalls ?? []).map(call =>
          call.id === toolCall.id
            ? { ...call, status: 'complete' as const, result }
            : call
        ),
      }))
      emitter.emit({ type: 'tool:end', name: toolCall.name, result, durationMs: Date.now() - toolStart })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setAssistantMessage(assistantId, message => ({
        ...message,
        toolCalls: (message.toolCalls ?? []).map(call =>
          call.id === toolCall.id
            ? { ...call, status: 'error' as const, error: errorMessage }
            : call
        ),
      }))
      emitter.emit({ type: 'error', error: error instanceof Error ? error : new Error(errorMessage) })
    }
  }

  const buildAdapterRequest = async (messages: Message[], text: string): Promise<AdapterRequest> => {
    const withSystem = mergeSystemMessages(messages, config.systemPrompt)
    const retrievedDocuments = config.retriever
      ? await config.retriever.retrieve({ query: text, messages })
      : []
    const retrievalMessage = buildRetrievalMessage(formatRetrievedDocuments(retrievedDocuments))

    return {
      messages: retrievalMessage ? [retrievalMessage, ...withSystem] : withSystem,
      context: {
        systemPrompt: config.systemPrompt,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        tools: config.tools,
        metadata: retrievedDocuments.length > 0 ? { retrievedDocuments } : undefined,
      },
    }
  }

  const startStream = async (messages: Message[], assistantId: string, text: string) => {
    const request = await buildAdapterRequest(messages, text)
    source = config.adapter.createSource(request)

    const streamStart = Date.now()
    let firstTokenEmitted = false

    emitter.emit({ type: 'llm:start', messageCount: request.messages.length })

    await consumeStream(source, {
      onText(accumulated) {
        if (!firstTokenEmitted) {
          emitter.emit({ type: 'llm:first-token', latencyMs: Date.now() - streamStart })
          firstTokenEmitted = true
        }
        setAssistantMessage(assistantId, message => ({
          ...message,
          content: accumulated,
        }))
      },
      onReasoning(accumulated) {
        setAssistantMessage(assistantId, message => ({
          ...message,
          metadata: { ...message.metadata, reasoning: accumulated },
        }))
      },
      async onToolCall(chunk) {
        await handleToolCall(assistantId, chunk)
      },
      onToolResult(content) {
        setAssistantMessage(assistantId, message => ({
          ...message,
          metadata: { ...message.metadata, toolResult: content },
        }))
      },
      onError(error) {
        setAssistantMessage(assistantId, message => ({ ...message, status: 'error' }))
        setState(current => ({ ...current, status: 'error', error }))
        emitter.emit({ type: 'error', error })
        config.onError?.(error)
      },
      onDone(accumulatedText) {
        let completedMessage: Message | undefined
        setState(current => {
          const messages = current.messages.map(message => {
            if (message.id !== assistantId) return message
            completedMessage = { ...message, status: 'complete' }
            return completedMessage
          })
          return { ...current, messages, status: 'idle', error: null }
        })
        emitter.emit({ type: 'llm:end', content: accumulatedText, durationMs: Date.now() - streamStart })
        if (completedMessage) config.onMessage?.(completedMessage)
      },
    })
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    async send(text) {
      if (!text.trim()) return

      const userMessage = buildMessage({ role: 'user', content: text })
      const assistantMessage = buildMessage({ role: 'assistant', content: '', status: 'streaming' })

      setState(current => ({
        ...current,
        messages: [...current.messages, userMessage, assistantMessage],
        status: 'streaming',
        input: '',
        error: null,
      }))

      await startStream([...state.messages], assistantMessage.id, text)
    },
    stop() {
      source?.abort()
      setState(current => ({ ...current, status: 'idle' }))
    },
    async retry() {
      const messages = [...state.messages]
      if (messages.length < 2) return

      const lastAssistant = messages[messages.length - 1]
      const lastUser = messages[messages.length - 2]
      if (lastAssistant.role !== 'assistant' || lastUser.role !== 'user') return

      const withoutLast = messages.slice(0, -1)
      const replacementAssistant = buildMessage({ role: 'assistant', content: '', status: 'streaming' })

      setState(current => ({
        ...current,
        messages: [...withoutLast, replacementAssistant],
        status: 'streaming',
        error: null,
      }))

      await startStream([...withoutLast, replacementAssistant], replacementAssistant.id, lastUser.content)
    },
    setInput(value) {
      setState(current => ({ ...current, input: value }))
    },
    setMessages(messages) {
      setState(current => ({ ...current, messages }))
    },
    async clear() {
      setState(current => ({
        ...current,
        messages: [],
        status: 'idle',
        error: null,
      }))
      await config.memory?.clear?.()
    },
    updateConfig(nextConfig) {
      config = { ...config, ...nextConfig }
      void hydrateMemory()
    },
  }
}
```

- [ ] **Step 4: Run core tests**

Run: `pnpm --filter @agentskit/core test`
Expected: PASS

- [ ] **Step 5: Run all tests to verify no regressions**

Run: `pnpm test`
Expected: All packages PASS

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/controller.ts packages/core/tests/controller.test.ts
git commit -m "refactor(core): use shared primitives in ChatController and emit AgentEvents"
```

---

### Task 8: Add memory unit tests

**Files:**
- Create: `packages/core/tests/memory.test.ts`

- [ ] **Step 1: Write memory implementation tests**

```ts
// packages/core/tests/memory.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createInMemoryMemory, createFileMemory } from '../src/memory'
import type { Message } from '../src/types'
import { writeFile, unlink, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const sampleMessage: Message = {
  id: 'test-1',
  role: 'user',
  content: 'hello',
  status: 'complete',
  createdAt: new Date('2026-01-01T00:00:00Z'),
}

describe('createInMemoryMemory', () => {
  it('starts empty by default', async () => {
    const mem = createInMemoryMemory()
    expect(await mem.load()).toEqual([])
  })

  it('starts with initial messages', async () => {
    const mem = createInMemoryMemory([sampleMessage])
    const loaded = await mem.load()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].content).toBe('hello')
  })

  it('save then load round-trips', async () => {
    const mem = createInMemoryMemory()
    await mem.save([sampleMessage])
    const loaded = await mem.load()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe('test-1')
  })

  it('clear empties messages', async () => {
    const mem = createInMemoryMemory([sampleMessage])
    await mem.clear!()
    expect(await mem.load()).toEqual([])
  })

  it('returns copies, not references', async () => {
    const mem = createInMemoryMemory([sampleMessage])
    const loaded1 = await mem.load()
    const loaded2 = await mem.load()
    expect(loaded1).not.toBe(loaded2)
  })
})

describe('createFileMemory', () => {
  let filepath: string

  beforeEach(() => {
    filepath = join(tmpdir(), `agentskit-test-${Date.now()}.json`)
  })

  afterEach(async () => {
    try { await unlink(filepath) } catch {}
  })

  it('returns empty array when file does not exist', async () => {
    const mem = createFileMemory(filepath)
    expect(await mem.load()).toEqual([])
  })

  it('save then load round-trips with date serialization', async () => {
    const mem = createFileMemory(filepath)
    await mem.save([sampleMessage])
    const loaded = await mem.load()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].content).toBe('hello')
    expect(loaded[0].createdAt).toBeInstanceOf(Date)
    expect(loaded[0].createdAt.toISOString()).toBe('2026-01-01T00:00:00.000Z')
  })

  it('clear removes the file', async () => {
    const mem = createFileMemory(filepath)
    await mem.save([sampleMessage])
    await mem.clear!()
    expect(await mem.load()).toEqual([])
  })

  it('clear on non-existent file does not throw', async () => {
    const mem = createFileMemory(filepath)
    await expect(mem.clear!()).resolves.toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it passes**

Run: `pnpm --filter @agentskit/core test`
Expected: PASS (these test existing implementations)

- [ ] **Step 3: Commit**

```bash
git add packages/core/tests/memory.test.ts
git commit -m "test(core): add unit tests for memory implementations"
```

---

### Task 9: Update index.ts exports

**Files:**
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Update exports**

Replace `packages/core/src/index.ts` with:

```ts
export { createChatController } from './controller'
export { createInMemoryMemory, createLocalStorageMemory, createFileMemory } from './memory'
export { createStaticRetriever, formatRetrievedDocuments } from './rag'
export {
  generateId,
  buildMessage,
  executeToolCall,
  consumeStream,
  createEventEmitter,
} from './primitives'
export type { ConsumeStreamHandlers } from './primitives'
export type {
  MaybePromise,
  StreamStatus,
  MessageRole,
  MessageStatus,
  ToolCallStatus,
  ToolCall,
  RetrievedDocument,
  Message,
  StreamToolCallPayload,
  StreamChunk,
  StreamSource,
  UseStreamOptions,
  UseStreamReturn,
  ToolExecutionContext,
  ToolDefinition,
  ToolCallHandlerContext,
  ChatMemory,
  RetrieverRequest,
  Retriever,
  AdapterContext,
  AdapterRequest,
  ChatConfig,
  ChatState,
  ChatController,
  ChatReturn,
  MemoryRecord,
  AdapterFactory,
  SkillDefinition,
  VectorDocument,
  VectorMemory,
  AgentEvent,
  Observer,
  EvalTestCase,
  EvalResult,
  EvalSuite,
} from './types'
```

- [ ] **Step 2: Build and verify**

Run: `pnpm --filter @agentskit/core build`
Expected: PASS

- [ ] **Step 3: Run full test suite**

Run: `pnpm test`
Expected: All packages PASS

- [ ] **Step 4: Check bundle size**

Run: `ls -la packages/core/dist/index.js | awk '{print $5}'`
Expected: Well under 10KB (gzipped would be even smaller)

Optionally: `gzip -c packages/core/dist/index.js | wc -c`
Expected: Under 10240 bytes

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/index.ts
git commit -m "feat(core): export all new types and primitives from index"
```

---

### Task 10: Final verification and cleanup

**Files:**
- No new files

- [ ] **Step 1: Full build**

Run: `pnpm build`
Expected: All 9 packages build successfully

- [ ] **Step 2: Full test suite**

Run: `pnpm test`
Expected: All 10 test suites pass

- [ ] **Step 3: Full lint**

Run: `pnpm lint`
Expected: No type errors

- [ ] **Step 4: Verify zero external runtime dependencies**

Run: `cat packages/core/package.json | grep -A5 '"dependencies"'`
Expected: No `dependencies` field (only `devDependencies`)

- [ ] **Step 5: Commit any remaining cleanup**

Only if needed. Otherwise, this task produces no commit.
