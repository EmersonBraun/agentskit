# React Arrow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `react-arrow`, a hooks-first React library for AI chat interfaces with streaming support, inspired by Arrow.js.

**Architecture:** Three core hooks (`useStream`, `useReactive`, `useChat`) form the foundation. Adapters normalize AI provider streams into a common interface. Headless UI components consume hooks and render with `data-ra-*` attributes. An optional CSS theme provides polished defaults. Docusaurus v3 powers the documentation site.

**Tech Stack:** TypeScript (strict), React 18+, tsup, Vitest, React Testing Library, Docusaurus v3, GitHub Actions

---

## File Map

```
src/
├── core/
│   ├── types.ts              — Message, ToolCall, StreamChunk, StreamSource, ChatConfig types
│   ├── useStream.ts          — streaming primitive hook
│   ├── useReactive.ts        — proxy-based reactive state hook
│   ├── useChat.ts            — chat session orchestrator hook
│   └── index.ts              — re-exports core hooks and types
├── adapters/
│   ├── types.ts              — AdapterConfig, AdapterFactory types
│   ├── createAdapter.ts      — factory for custom adapters
│   ├── generic.ts            — generic ReadableStream/AsyncIterator adapter
│   ├── anthropic.ts          — Anthropic streaming adapter
│   ├── openai.ts             — OpenAI streaming adapter
│   ├── vercel-ai.ts          — Vercel AI SDK adapter
│   └── index.ts              — re-exports all adapters
├── components/
│   ├── ChatContainer.tsx     — scrollable chat layout
│   ├── Message.tsx           — chat bubble with streaming
│   ├── Markdown.tsx          — reactive markdown renderer
│   ├── CodeBlock.tsx         — syntax-highlighted code
│   ├── ToolCallView.tsx      — tool invocation display
│   ├── ThinkingIndicator.tsx — loading/thinking state
│   ├── InputBar.tsx          — message input with submit
│   └── index.ts              — re-exports all components
├── theme/
│   ├── tokens.css            — CSS custom properties
│   └── default.css           — full default theme (imports tokens)
└── index.ts                  — main entry, re-exports everything

tests/
├── core/
│   ├── useStream.test.ts
│   ├── useReactive.test.ts
│   └── useChat.test.ts
├── adapters/
│   ├── createAdapter.test.ts
│   └── generic.test.ts
└── components/
    ├── ChatContainer.test.tsx
    ├── Message.test.tsx
    ├── Markdown.test.tsx
    ├── CodeBlock.test.tsx
    ├── ToolCallView.test.tsx
    ├── ThinkingIndicator.test.tsx
    └── InputBar.test.tsx

docs/                         — Docusaurus v3 site (scaffolded via create-docusaurus)
examples/
└── basic-chat/               — standalone Next.js example app
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/rebecabraun/workspace/EmersonBraun/lib
git init
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "react-arrow",
  "version": "0.1.0",
  "description": "A hooks-first React library for the agentic era. Inspired by Arrow.js.",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./adapters": {
      "import": "./dist/adapters/index.js",
      "require": "./dist/adapters/index.cjs",
      "types": "./dist/adapters/index.d.ts"
    },
    "./theme": "./dist/theme/default.css"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit",
    "dev": "tsup --watch"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.5.0",
    "tsup": "^8.0.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jsdom": "^24.0.0"
  },
  "keywords": ["react", "ai", "chat", "streaming", "hooks", "agentic", "arrow-js"],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/EmersonBraun/lib"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests", "docs", "examples"]
}
```

- [ ] **Step 4: Create tsup.config.ts**

```ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'adapters/index': 'src/adapters/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  splitting: true,
  treeshake: true,
})
```

- [ ] **Step 5: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
})
```

- [ ] **Step 6: Create tests/setup.ts**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 7: Create .gitignore**

```
node_modules/
dist/
.superpowers/
*.tsbuildinfo
.DS_Store
```

- [ ] **Step 8: Create README.md**

```markdown
# React Arrow

> A hooks-first React library for the agentic era. Inspired by [Arrow.js](https://arrow-js.com/).

React Arrow provides a minimal, agent-friendly API for building AI chat interfaces with streaming support in React.

## Install

\`\`\`bash
npm install react-arrow
\`\`\`

## Quick Start

\`\`\`tsx
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
\`\`\`

## Core API

| Hook | Purpose |
|------|---------|
| \`useStream(source)\` | Consume any async stream reactively |
| \`useReactive(state)\` | Proxy-based fine-grained reactive state |
| \`useChat(config)\` | Full chat session management |

## License

MIT
```

- [ ] **Step 9: Install dependencies**

```bash
npm install
```

- [ ] **Step 10: Verify build tooling works**

```bash
mkdir -p src && echo "export {}" > src/index.ts
npx tsup
npx tsc --noEmit
```

- [ ] **Step 11: Commit**

```bash
git add package.json tsconfig.json tsup.config.ts vitest.config.ts .gitignore README.md tests/setup.ts src/index.ts
git commit -m "chore: scaffold react-arrow project with build and test tooling"
```

---

### Task 2: Core Types

**Files:**
- Create: `src/core/types.ts`

- [ ] **Step 1: Create src/core/types.ts**

```ts
export type StreamStatus = 'idle' | 'streaming' | 'complete' | 'error'

export type MessageRole = 'user' | 'assistant' | 'system'

export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error'

export type ToolCallStatus = 'pending' | 'running' | 'complete' | 'error'

export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
  result?: string
  status: ToolCallStatus
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  status: MessageStatus
  toolCalls?: ToolCall[]
  metadata?: Record<string, unknown>
  createdAt: Date
}

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'error' | 'done'
  content?: string
  toolCall?: {
    id: string
    name: string
    args: string
    result?: string
  }
}

export interface StreamSource {
  stream: () => AsyncIterableIterator<StreamChunk>
  abort: () => void
}

export interface UseStreamOptions {
  onChunk?: (chunk: StreamChunk) => void
  onComplete?: (text: string) => void
  onError?: (error: Error) => void
}

export interface UseStreamReturn {
  data: StreamChunk | null
  text: string
  status: StreamStatus
  error: Error | null
  stop: () => void
}

export interface ChatConfig {
  adapter: AdapterFactory
  onMessage?: (message: Message) => void
  onError?: (error: Error) => void
  initialMessages?: Message[]
}

export interface ChatReturn {
  messages: Message[]
  send: (text: string) => void
  stop: () => void
  retry: () => void
  status: StreamStatus
  input: string
  setInput: (value: string) => void
}

export type AdapterFactory = {
  createSource: (messages: Message[]) => StreamSource
}
```

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/core/types.ts
git commit -m "feat: add core type definitions for Message, StreamSource, and ChatConfig"
```

---

### Task 3: useStream Hook

**Files:**
- Create: `src/core/useStream.ts`
- Create: `tests/core/useStream.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/core/useStream.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStream } from '../../src/core/useStream'
import type { StreamSource, StreamChunk } from '../../src/core/types'

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

describe('useStream', () => {
  it('starts with idle status and empty text', () => {
    const source = createMockSource([])
    const { result } = renderHook(() => useStream(source))
    expect(result.current.status).toBe('idle')
    expect(result.current.text).toBe('')
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('streams text chunks and accumulates text', async () => {
    const source = createMockSource([
      { type: 'text', content: 'Hello' },
      { type: 'text', content: ' world' },
      { type: 'done' },
    ])
    const { result } = renderHook(() => useStream(source))

    await waitFor(() => {
      expect(result.current.status).toBe('complete')
    })

    expect(result.current.text).toBe('Hello world')
  })

  it('sets error status on error chunk', async () => {
    const source = createMockSource([
      { type: 'text', content: 'partial' },
      { type: 'error', content: 'connection lost' },
    ])
    const { result } = renderHook(() => useStream(source))

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('connection lost')
  })

  it('calls onChunk callback for each chunk', async () => {
    const onChunk = vi.fn()
    const source = createMockSource([
      { type: 'text', content: 'Hi' },
      { type: 'done' },
    ])
    const { result } = renderHook(() => useStream(source, { onChunk }))

    await waitFor(() => {
      expect(result.current.status).toBe('complete')
    })

    expect(onChunk).toHaveBeenCalledTimes(2)
    expect(onChunk).toHaveBeenCalledWith({ type: 'text', content: 'Hi' })
  })

  it('stop() aborts the stream', async () => {
    let yieldCount = 0
    const source: StreamSource = {
      stream: async function* () {
        while (true) {
          yieldCount++
          yield { type: 'text' as const, content: `chunk${yieldCount}` }
          await new Promise(r => setTimeout(r, 10))
        }
      },
      abort: vi.fn(),
    }

    const { result } = renderHook(() => useStream(source))

    await waitFor(() => {
      expect(result.current.status).toBe('streaming')
    })

    act(() => {
      result.current.stop()
    })

    expect(source.abort).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/core/useStream.test.ts
```

Expected: FAIL — `useStream` module does not exist.

- [ ] **Step 3: Implement useStream**

```ts
// src/core/useStream.ts
import { useState, useEffect, useRef, useCallback } from 'react'
import type { StreamSource, StreamChunk, StreamStatus, UseStreamOptions, UseStreamReturn } from './types'

export function useStream(
  source: StreamSource,
  options?: UseStreamOptions
): UseStreamReturn {
  const [data, setData] = useState<StreamChunk | null>(null)
  const [text, setText] = useState('')
  const [status, setStatus] = useState<StreamStatus>('idle')
  const [error, setError] = useState<Error | null>(null)
  const sourceRef = useRef(source)
  const optionsRef = useRef(options)
  const abortedRef = useRef(false)

  sourceRef.current = source
  optionsRef.current = options

  useEffect(() => {
    let cancelled = false
    abortedRef.current = false
    setStatus('streaming')
    setText('')
    setData(null)
    setError(null)

    let accumulated = ''

    const consume = async () => {
      try {
        const iterator = sourceRef.current.stream()
        for await (const chunk of iterator) {
          if (cancelled || abortedRef.current) return

          setData(chunk)
          optionsRef.current?.onChunk?.(chunk)

          if (chunk.type === 'text' && chunk.content) {
            accumulated += chunk.content
            setText(accumulated)
          } else if (chunk.type === 'error') {
            const err = new Error(chunk.content ?? 'Stream error')
            setError(err)
            setStatus('error')
            optionsRef.current?.onError?.(err)
            return
          } else if (chunk.type === 'done') {
            setStatus('complete')
            optionsRef.current?.onComplete?.(accumulated)
            return
          }
        }

        if (!cancelled && !abortedRef.current) {
          setStatus('complete')
          optionsRef.current?.onComplete?.(accumulated)
        }
      } catch (err) {
        if (!cancelled && !abortedRef.current) {
          const error = err instanceof Error ? err : new Error(String(err))
          setError(error)
          setStatus('error')
          optionsRef.current?.onError?.(error)
        }
      }
    }

    consume()

    return () => {
      cancelled = true
    }
  }, [source])

  const stop = useCallback(() => {
    abortedRef.current = true
    sourceRef.current.abort()
  }, [])

  return { data, text, status, error, stop }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/core/useStream.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/useStream.ts tests/core/useStream.test.ts
git commit -m "feat: implement useStream hook with tests"
```

---

### Task 4: useReactive Hook

**Files:**
- Create: `src/core/useReactive.ts`
- Create: `tests/core/useReactive.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/core/useReactive.test.ts
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useReactive } from '../../src/core/useReactive'

describe('useReactive', () => {
  it('returns a proxy with initial state values', () => {
    const { result } = renderHook(() => useReactive({ count: 0, name: 'test' }))
    expect(result.current.count).toBe(0)
    expect(result.current.name).toBe('test')
  })

  it('triggers re-render when a property is mutated', () => {
    let renderCount = 0
    const { result } = renderHook(() => {
      renderCount++
      return useReactive({ count: 0 })
    })

    const before = renderCount
    act(() => {
      result.current.count = 5
    })

    expect(renderCount).toBeGreaterThan(before)
    expect(result.current.count).toBe(5)
  })

  it('supports nested object mutation', () => {
    const { result } = renderHook(() =>
      useReactive({ user: { name: 'Alice' } })
    )

    act(() => {
      result.current.user = { name: 'Bob' }
    })

    expect(result.current.user.name).toBe('Bob')
  })

  it('supports array operations', () => {
    const { result } = renderHook(() =>
      useReactive({ items: ['a', 'b'] })
    )

    act(() => {
      result.current.items = [...result.current.items, 'c']
    })

    expect(result.current.items).toEqual(['a', 'b', 'c'])
  })

  it('preserves the same proxy reference across re-renders', () => {
    const { result, rerender } = renderHook(() => useReactive({ count: 0 }))
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/core/useReactive.test.ts
```

Expected: FAIL — `useReactive` module does not exist.

- [ ] **Step 3: Implement useReactive**

```ts
// src/core/useReactive.ts
import { useRef, useSyncExternalStore, useCallback } from 'react'

export function useReactive<T extends Record<string, unknown>>(initialState: T): T {
  const storeRef = useRef<{
    state: T
    listeners: Set<() => void>
    proxy: T
    version: number
  } | null>(null)

  if (storeRef.current === null) {
    const store = {
      state: { ...initialState },
      listeners: new Set<() => void>(),
      proxy: null as unknown as T,
      version: 0,
    }

    const notify = () => {
      store.version++
      store.listeners.forEach(listener => listener())
    }

    store.proxy = new Proxy(store.state, {
      get(target, prop, receiver) {
        return Reflect.get(target, prop, receiver)
      },
      set(target, prop, value, receiver) {
        const result = Reflect.set(target, prop, value, receiver)
        notify()
        return result
      },
    }) as T

    storeRef.current = store
  }

  const store = storeRef.current

  const subscribe = useCallback((callback: () => void) => {
    store.listeners.add(callback)
    return () => { store.listeners.delete(callback) }
  }, [store])

  const getSnapshot = useCallback(() => store.version, [store])

  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return store.proxy
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/core/useReactive.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/useReactive.ts tests/core/useReactive.test.ts
git commit -m "feat: implement useReactive hook with proxy-based state and useSyncExternalStore"
```

---

### Task 5: useChat Hook

**Files:**
- Create: `src/core/useChat.ts`
- Create: `tests/core/useChat.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/core/useChat.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useChat } from '../../src/core/useChat'
import type { AdapterFactory, Message, StreamChunk } from '../../src/core/types'

function createMockAdapter(chunks: StreamChunk[]): AdapterFactory {
  return {
    createSource: (_messages: Message[]) => {
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

describe('useChat', () => {
  it('starts with empty messages and idle status', () => {
    const adapter = createMockAdapter([])
    const { result } = renderHook(() => useChat({ adapter }))
    expect(result.current.messages).toEqual([])
    expect(result.current.status).toBe('idle')
    expect(result.current.input).toBe('')
  })

  it('initializes with initialMessages if provided', () => {
    const adapter = createMockAdapter([])
    const initial: Message[] = [{
      id: '1', role: 'system', content: 'You are helpful.',
      status: 'complete', createdAt: new Date(),
    }]
    const { result } = renderHook(() =>
      useChat({ adapter, initialMessages: initial })
    )
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].content).toBe('You are helpful.')
  })

  it('send() adds user message and streams assistant response', async () => {
    const adapter = createMockAdapter([
      { type: 'text', content: 'Hi there!' },
      { type: 'done' },
    ])
    const { result } = renderHook(() => useChat({ adapter }))

    act(() => {
      result.current.send('Hello')
    })

    await waitFor(() => {
      expect(result.current.status).toBe('idle')
    })

    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[0].role).toBe('user')
    expect(result.current.messages[0].content).toBe('Hello')
    expect(result.current.messages[1].role).toBe('assistant')
    expect(result.current.messages[1].content).toBe('Hi there!')
    expect(result.current.messages[1].status).toBe('complete')
  })

  it('setInput updates the input value', () => {
    const adapter = createMockAdapter([])
    const { result } = renderHook(() => useChat({ adapter }))

    act(() => {
      result.current.setInput('new value')
    })

    expect(result.current.input).toBe('new value')
  })

  it('calls onMessage when assistant message completes', async () => {
    const onMessage = vi.fn()
    const adapter = createMockAdapter([
      { type: 'text', content: 'Done' },
      { type: 'done' },
    ])
    const { result } = renderHook(() =>
      useChat({ adapter, onMessage })
    )

    act(() => {
      result.current.send('Go')
    })

    await waitFor(() => {
      expect(result.current.status).toBe('idle')
    })

    expect(onMessage).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'assistant', content: 'Done' })
    )
  })

  it('stop() aborts the current stream', async () => {
    const abortFn = vi.fn()
    const adapter: AdapterFactory = {
      createSource: () => ({
        stream: async function* () {
          while (true) {
            yield { type: 'text' as const, content: 'chunk ' }
            await new Promise(r => setTimeout(r, 50))
          }
        },
        abort: abortFn,
      }),
    }

    const { result } = renderHook(() => useChat({ adapter }))

    act(() => {
      result.current.send('Go')
    })

    await waitFor(() => {
      expect(result.current.status).toBe('streaming')
    })

    act(() => {
      result.current.stop()
    })

    expect(abortFn).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/core/useChat.test.ts
```

Expected: FAIL — `useChat` module does not exist.

- [ ] **Step 3: Implement useChat**

```ts
// src/core/useChat.ts
import { useState, useCallback, useRef } from 'react'
import type {
  ChatConfig, ChatReturn, Message, StreamStatus, StreamChunk, StreamSource,
} from './types'

let nextId = 0
function generateId(): string {
  return `msg-${Date.now()}-${nextId++}`
}

export function useChat(config: ChatConfig): ChatReturn {
  const { adapter, onMessage, onError, initialMessages } = config
  const [messages, setMessages] = useState<Message[]>(initialMessages ?? [])
  const [status, setStatus] = useState<StreamStatus>('idle')
  const [input, setInput] = useState('')
  const sourceRef = useRef<StreamSource | null>(null)
  const adapterRef = useRef(adapter)
  adapterRef.current = adapter

  const send = useCallback((text: string) => {
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      status: 'complete',
      createdAt: new Date(),
    }

    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      status: 'streaming',
      createdAt: new Date(),
    }

    setMessages(prev => {
      const updated = [...prev, userMessage, assistantMessage]
      startStream(updated, assistantMessage.id)
      return updated
    })

    setInput('')
    setStatus('streaming')
  }, [])

  const startStream = async (allMessages: Message[], assistantId: string) => {
    const source = adapterRef.current.createSource(allMessages)
    sourceRef.current = source

    let accumulated = ''

    try {
      const iterator = source.stream()
      for await (const chunk of iterator) {
        if (chunk.type === 'text' && chunk.content) {
          accumulated += chunk.content
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, content: accumulated }
                : m
            )
          )
        } else if (chunk.type === 'tool_call' && chunk.toolCall) {
          setMessages(prev =>
            prev.map(m => {
              if (m.id !== assistantId) return m
              const existing = m.toolCalls ?? []
              return {
                ...m,
                toolCalls: [...existing, {
                  id: chunk.toolCall!.id,
                  name: chunk.toolCall!.name,
                  args: JSON.parse(chunk.toolCall!.args || '{}'),
                  result: chunk.toolCall!.result,
                  status: 'complete' as const,
                }],
              }
            })
          )
        } else if (chunk.type === 'error') {
          const err = new Error(chunk.content ?? 'Stream error')
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, status: 'error' }
                : m
            )
          )
          setStatus('error')
          onError?.(err)
          return
        } else if (chunk.type === 'done') {
          break
        }
      }

      setMessages(prev => {
        const updated = prev.map(m =>
          m.id === assistantId
            ? { ...m, status: 'complete' as const }
            : m
        )
        const completed = updated.find(m => m.id === assistantId)
        if (completed) onMessage?.(completed)
        return updated
      })
      setStatus('idle')
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, status: 'error' }
            : m
        )
      )
      setStatus('error')
      onError?.(error)
    }
  }

  const stop = useCallback(() => {
    sourceRef.current?.abort()
  }, [])

  const retry = useCallback(() => {
    setMessages(prev => {
      if (prev.length < 2) return prev
      const lastAssistant = prev[prev.length - 1]
      const lastUser = prev[prev.length - 2]
      if (lastAssistant.role !== 'assistant' || lastUser.role !== 'user') return prev

      const withoutLast = prev.slice(0, -1)
      const newAssistant: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        status: 'streaming',
        createdAt: new Date(),
      }
      const updated = [...withoutLast, newAssistant]
      startStream(updated, newAssistant.id)
      return updated
    })
    setStatus('streaming')
  }, [])

  return { messages, send, stop, retry, status, input, setInput }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/core/useChat.test.ts
```

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/useChat.ts tests/core/useChat.test.ts
git commit -m "feat: implement useChat hook with send, stop, retry, and streaming"
```

---

### Task 6: Core Index & Exports

**Files:**
- Create: `src/core/index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Create src/core/index.ts**

```ts
export { useStream } from './useStream'
export { useReactive } from './useReactive'
export { useChat } from './useChat'
export type {
  StreamStatus,
  MessageRole,
  MessageStatus,
  ToolCallStatus,
  ToolCall,
  Message,
  StreamChunk,
  StreamSource,
  UseStreamOptions,
  UseStreamReturn,
  ChatConfig,
  ChatReturn,
  AdapterFactory,
} from './types'
```

- [ ] **Step 2: Update src/index.ts**

```ts
export * from './core'
export * from './components'
```

- [ ] **Step 3: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/core/index.ts src/index.ts
git commit -m "feat: wire up core exports and main entry point"
```

---

### Task 7: Adapter System — createAdapter & generic

**Files:**
- Create: `src/adapters/types.ts`
- Create: `src/adapters/createAdapter.ts`
- Create: `src/adapters/generic.ts`
- Create: `src/adapters/index.ts`
- Create: `tests/adapters/createAdapter.test.ts`
- Create: `tests/adapters/generic.test.ts`

- [ ] **Step 1: Write failing tests for createAdapter**

```ts
// tests/adapters/createAdapter.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createAdapter } from '../../src/adapters/createAdapter'
import type { Message, StreamChunk } from '../../src/core/types'

describe('createAdapter', () => {
  it('creates an AdapterFactory from send/parse/abort functions', () => {
    const send = vi.fn().mockResolvedValue(new ReadableStream())
    const parse = vi.fn()
    const abort = vi.fn()

    const adapter = createAdapter({ send, parse, abort })
    expect(adapter).toHaveProperty('createSource')
    expect(typeof adapter.createSource).toBe('function')
  })

  it('createSource returns a StreamSource with stream and abort', () => {
    const send = vi.fn().mockResolvedValue(new ReadableStream())
    const parse = vi.fn(async function* () { yield { type: 'done' as const } })
    const abort = vi.fn()

    const adapter = createAdapter({ send, parse, abort })
    const source = adapter.createSource([])
    expect(typeof source.stream).toBe('function')
    expect(typeof source.abort).toBe('function')
  })
})
```

- [ ] **Step 2: Write failing tests for generic adapter**

```ts
// tests/adapters/generic.test.ts
import { describe, it, expect } from 'vitest'
import { generic } from '../../src/adapters/generic'
import type { Message } from '../../src/core/types'

describe('generic adapter', () => {
  it('converts a ReadableStream from send() into StreamChunks', async () => {
    const encoder = new TextEncoder()
    const adapter = generic({
      send: async (_messages: Message[]) => {
        return new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('Hello'))
            controller.enqueue(encoder.encode(' world'))
            controller.close()
          },
        })
      },
    })

    const source = adapter.createSource([])
    const chunks: Array<{ type: string; content?: string }> = []
    for await (const chunk of source.stream()) {
      chunks.push(chunk)
    }

    expect(chunks).toEqual([
      { type: 'text', content: 'Hello' },
      { type: 'text', content: ' world' },
      { type: 'done' },
    ])
  })

  it('yields error chunk when send() throws', async () => {
    const adapter = generic({
      send: async () => { throw new Error('network failure') },
    })

    const source = adapter.createSource([])
    const chunks: Array<{ type: string; content?: string }> = []
    for await (const chunk of source.stream()) {
      chunks.push(chunk)
    }

    expect(chunks).toEqual([
      { type: 'error', content: 'network failure' },
    ])
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run tests/adapters/
```

Expected: FAIL — modules don't exist.

- [ ] **Step 4: Implement adapter types**

```ts
// src/adapters/types.ts
import type { Message, StreamChunk } from '../core/types'

export interface CreateAdapterConfig {
  send: (messages: Message[]) => Promise<ReadableStream | Response>
  parse: (stream: ReadableStream) => AsyncIterableIterator<StreamChunk>
  abort?: () => void
}

export interface GenericAdapterConfig {
  send: (messages: Message[]) => Promise<ReadableStream>
}
```

- [ ] **Step 5: Implement createAdapter**

```ts
// src/adapters/createAdapter.ts
import type { AdapterFactory, Message, StreamSource, StreamChunk } from '../core/types'
import type { CreateAdapterConfig } from './types'

export function createAdapter(config: CreateAdapterConfig): AdapterFactory {
  return {
    createSource: (messages: Message[]): StreamSource => {
      let abortController: AbortController | null = new AbortController()

      return {
        stream: async function* (): AsyncIterableIterator<StreamChunk> {
          try {
            const result = await config.send(messages)
            const stream = result instanceof Response
              ? result.body!
              : result
            yield* config.parse(stream)
          } catch (err) {
            yield {
              type: 'error',
              content: err instanceof Error ? err.message : String(err),
            }
          }
        },
        abort: () => {
          config.abort?.()
          abortController?.abort()
          abortController = null
        },
      }
    },
  }
}
```

- [ ] **Step 6: Implement generic adapter**

```ts
// src/adapters/generic.ts
import type { AdapterFactory, Message, StreamSource, StreamChunk } from '../core/types'
import type { GenericAdapterConfig } from './types'

export function generic(config: GenericAdapterConfig): AdapterFactory {
  return {
    createSource: (messages: Message[]): StreamSource => {
      let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
      const decoder = new TextDecoder()

      return {
        stream: async function* (): AsyncIterableIterator<StreamChunk> {
          try {
            const stream = await config.send(messages)
            reader = stream.getReader()

            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              const text = decoder.decode(value, { stream: true })
              yield { type: 'text', content: text }
            }

            yield { type: 'done' }
          } catch (err) {
            yield {
              type: 'error',
              content: err instanceof Error ? err.message : String(err),
            }
          } finally {
            reader?.releaseLock()
          }
        },
        abort: () => {
          reader?.cancel()
        },
      }
    },
  }
}
```

- [ ] **Step 7: Create adapters index**

```ts
// src/adapters/index.ts
export { createAdapter } from './createAdapter'
export { generic } from './generic'
export type { CreateAdapterConfig, GenericAdapterConfig } from './types'
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npx vitest run tests/adapters/
```

Expected: all 4 tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/adapters/ tests/adapters/
git commit -m "feat: implement adapter system with createAdapter factory and generic adapter"
```

---

### Task 8: AI Provider Adapters (Anthropic, OpenAI, Vercel AI)

**Files:**
- Create: `src/adapters/anthropic.ts`
- Create: `src/adapters/openai.ts`
- Create: `src/adapters/vercel-ai.ts`
- Modify: `src/adapters/index.ts`

- [ ] **Step 1: Implement Anthropic adapter**

```ts
// src/adapters/anthropic.ts
import type { AdapterFactory, Message, StreamSource, StreamChunk } from '../core/types'

export interface AnthropicConfig {
  apiKey: string
  model: string
  baseUrl?: string
  maxTokens?: number
}

export function anthropic(config: AnthropicConfig): AdapterFactory {
  const { apiKey, model, baseUrl = 'https://api.anthropic.com', maxTokens = 4096 } = config

  return {
    createSource: (messages: Message[]): StreamSource => {
      let abortController: AbortController | null = new AbortController()

      return {
        stream: async function* (): AsyncIterableIterator<StreamChunk> {
          try {
            const body = {
              model,
              max_tokens: maxTokens,
              messages: messages
                .filter(m => m.role !== 'system')
                .map(m => ({ role: m.role, content: m.content })),
              system: messages.find(m => m.role === 'system')?.content,
              stream: true,
            }

            const response = await fetch(`${baseUrl}/v1/messages`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify(body),
              signal: abortController?.signal,
            })

            if (!response.ok) {
              yield { type: 'error', content: `Anthropic API error: ${response.status}` }
              return
            }

            const reader = response.body!.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() ?? ''

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue
                const data = line.slice(6)
                if (data === '[DONE]') continue

                try {
                  const event = JSON.parse(data)
                  if (event.type === 'content_block_delta' && event.delta?.text) {
                    yield { type: 'text', content: event.delta.text }
                  } else if (event.type === 'message_stop') {
                    yield { type: 'done' }
                    return
                  }
                } catch {
                  // skip malformed JSON lines
                }
              }
            }

            yield { type: 'done' }
          } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return
            yield {
              type: 'error',
              content: err instanceof Error ? err.message : String(err),
            }
          }
        },
        abort: () => {
          abortController?.abort()
          abortController = null
        },
      }
    },
  }
}
```

- [ ] **Step 2: Implement OpenAI adapter**

```ts
// src/adapters/openai.ts
import type { AdapterFactory, Message, StreamSource, StreamChunk } from '../core/types'

export interface OpenAIConfig {
  apiKey: string
  model: string
  baseUrl?: string
}

export function openai(config: OpenAIConfig): AdapterFactory {
  const { apiKey, model, baseUrl = 'https://api.openai.com' } = config

  return {
    createSource: (messages: Message[]): StreamSource => {
      let abortController: AbortController | null = new AbortController()

      return {
        stream: async function* (): AsyncIterableIterator<StreamChunk> {
          try {
            const body = {
              model,
              messages: messages.map(m => ({ role: m.role, content: m.content })),
              stream: true,
            }

            const response = await fetch(`${baseUrl}/v1/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify(body),
              signal: abortController?.signal,
            })

            if (!response.ok) {
              yield { type: 'error', content: `OpenAI API error: ${response.status}` }
              return
            }

            const reader = response.body!.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() ?? ''

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue
                const data = line.slice(6)
                if (data === '[DONE]') {
                  yield { type: 'done' }
                  return
                }

                try {
                  const event = JSON.parse(data)
                  const delta = event.choices?.[0]?.delta?.content
                  if (delta) {
                    yield { type: 'text', content: delta }
                  }
                } catch {
                  // skip malformed JSON lines
                }
              }
            }

            yield { type: 'done' }
          } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return
            yield {
              type: 'error',
              content: err instanceof Error ? err.message : String(err),
            }
          }
        },
        abort: () => {
          abortController?.abort()
          abortController = null
        },
      }
    },
  }
}
```

- [ ] **Step 3: Implement Vercel AI adapter**

```ts
// src/adapters/vercel-ai.ts
import type { AdapterFactory, Message, StreamSource, StreamChunk } from '../core/types'

export interface VercelAIConfig {
  api: string
  headers?: Record<string, string>
}

export function vercelAI(config: VercelAIConfig): AdapterFactory {
  const { api, headers = {} } = config

  return {
    createSource: (messages: Message[]): StreamSource => {
      let abortController: AbortController | null = new AbortController()

      return {
        stream: async function* (): AsyncIterableIterator<StreamChunk> {
          try {
            const response = await fetch(api, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...headers,
              },
              body: JSON.stringify({
                messages: messages.map(m => ({ role: m.role, content: m.content })),
              }),
              signal: abortController?.signal,
            })

            if (!response.ok) {
              yield { type: 'error', content: `API error: ${response.status}` }
              return
            }

            const reader = response.body!.getReader()
            const decoder = new TextDecoder()

            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              const text = decoder.decode(value, { stream: true })
              if (text) {
                yield { type: 'text', content: text }
              }
            }

            yield { type: 'done' }
          } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return
            yield {
              type: 'error',
              content: err instanceof Error ? err.message : String(err),
            }
          }
        },
        abort: () => {
          abortController?.abort()
          abortController = null
        },
      }
    },
  }
}
```

- [ ] **Step 4: Update adapters/index.ts**

```ts
// src/adapters/index.ts
export { createAdapter } from './createAdapter'
export { generic } from './generic'
export { anthropic } from './anthropic'
export { openai } from './openai'
export { vercelAI } from './vercel-ai'
export type { CreateAdapterConfig, GenericAdapterConfig } from './types'
export type { AnthropicConfig } from './anthropic'
export type { OpenAIConfig } from './openai'
export type { VercelAIConfig } from './vercel-ai'
```

- [ ] **Step 5: Verify types compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/adapters/
git commit -m "feat: add Anthropic, OpenAI, and Vercel AI streaming adapters"
```

---

### Task 9: Headless Components — ChatContainer, Message, InputBar

**Files:**
- Create: `src/components/ChatContainer.tsx`
- Create: `src/components/Message.tsx`
- Create: `src/components/InputBar.tsx`
- Create: `tests/components/ChatContainer.test.tsx`
- Create: `tests/components/Message.test.tsx`
- Create: `tests/components/InputBar.test.tsx`

- [ ] **Step 1: Write failing tests for ChatContainer**

```tsx
// tests/components/ChatContainer.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { ChatContainer } from '../../src/components/ChatContainer'

describe('ChatContainer', () => {
  it('renders a scrollable container with data-ra-chat-container attribute', () => {
    render(
      <ChatContainer>
        <div>message</div>
      </ChatContainer>
    )
    const container = screen.getByTestId('ra-chat-container')
    expect(container).toBeInTheDocument()
    expect(container).toHaveAttribute('data-ra-chat-container')
  })

  it('accepts and applies className prop', () => {
    render(
      <ChatContainer className="custom-class">
        <div>message</div>
      </ChatContainer>
    )
    const container = screen.getByTestId('ra-chat-container')
    expect(container).toHaveClass('custom-class')
  })
})
```

- [ ] **Step 2: Write failing tests for Message**

```tsx
// tests/components/Message.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Message as MessageComponent } from '../../src/components/Message'
import type { Message } from '../../src/core/types'

const userMessage: Message = {
  id: '1',
  role: 'user',
  content: 'Hello there',
  status: 'complete',
  createdAt: new Date(),
}

const assistantMessage: Message = {
  id: '2',
  role: 'assistant',
  content: 'Hi! How can I help?',
  status: 'complete',
  createdAt: new Date(),
}

describe('Message', () => {
  it('renders message content', () => {
    render(<MessageComponent message={userMessage} />)
    expect(screen.getByText('Hello there')).toBeInTheDocument()
  })

  it('sets data-ra-role attribute based on message role', () => {
    const { container } = render(<MessageComponent message={userMessage} />)
    const el = container.firstElementChild!
    expect(el).toHaveAttribute('data-ra-role', 'user')
  })

  it('sets data-ra-status attribute', () => {
    const streamingMsg: Message = { ...assistantMessage, status: 'streaming' }
    const { container } = render(<MessageComponent message={streamingMsg} />)
    const el = container.firstElementChild!
    expect(el).toHaveAttribute('data-ra-status', 'streaming')
  })

  it('renders avatar when provided', () => {
    render(<MessageComponent message={userMessage} avatar={<span>👤</span>} />)
    expect(screen.getByText('👤')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Write failing tests for InputBar**

```tsx
// tests/components/InputBar.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { InputBar } from '../../src/components/InputBar'
import type { ChatReturn } from '../../src/core/types'

function mockChat(overrides?: Partial<ChatReturn>): ChatReturn {
  return {
    messages: [],
    send: vi.fn(),
    stop: vi.fn(),
    retry: vi.fn(),
    status: 'idle',
    input: '',
    setInput: vi.fn(),
    ...overrides,
  }
}

describe('InputBar', () => {
  it('renders an input and submit button', () => {
    render(<InputBar chat={mockChat()} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls setInput on input change', () => {
    const chat = mockChat()
    render(<InputBar chat={chat} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hi' } })
    expect(chat.setInput).toHaveBeenCalledWith('Hi')
  })

  it('calls send on form submit', () => {
    const chat = mockChat({ input: 'Hello' })
    render(<InputBar chat={chat} />)
    fireEvent.submit(screen.getByRole('textbox').closest('form')!)
    expect(chat.send).toHaveBeenCalledWith('Hello')
  })

  it('disables input when disabled prop is true', () => {
    render(<InputBar chat={mockChat()} disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('applies custom placeholder', () => {
    render(<InputBar chat={mockChat()} placeholder="Ask anything..." />)
    expect(screen.getByPlaceholderText('Ask anything...')).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
npx vitest run tests/components/ChatContainer.test.tsx tests/components/Message.test.tsx tests/components/InputBar.test.tsx
```

Expected: FAIL — modules don't exist.

- [ ] **Step 5: Implement ChatContainer**

```tsx
// src/components/ChatContainer.tsx
import React, { useRef, useEffect, type ReactNode } from 'react'

export interface ChatContainerProps {
  children: ReactNode
  className?: string
}

export function ChatContainer({ children, className }: ChatContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new MutationObserver(() => {
      el.scrollTop = el.scrollHeight
    })

    observer.observe(el, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      data-ra-chat-container
      data-testid="ra-chat-container"
      className={className}
      style={{ overflow: 'auto' }}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 6: Implement Message**

```tsx
// src/components/Message.tsx
import React, { type ReactNode } from 'react'
import type { Message as MessageType } from '../core/types'

export interface MessageProps {
  message: MessageType
  avatar?: ReactNode
  actions?: ReactNode
}

export function Message({ message, avatar, actions }: MessageProps) {
  return (
    <div
      data-ra-message
      data-ra-role={message.role}
      data-ra-status={message.status}
    >
      {avatar && <div data-ra-avatar>{avatar}</div>}
      <div data-ra-content>{message.content}</div>
      {actions && <div data-ra-actions>{actions}</div>}
    </div>
  )
}
```

- [ ] **Step 7: Implement InputBar**

```tsx
// src/components/InputBar.tsx
import React, { type FormEvent, type KeyboardEvent } from 'react'
import type { ChatReturn } from '../core/types'

export interface InputBarProps {
  chat: ChatReturn
  placeholder?: string
  disabled?: boolean
}

export function InputBar({ chat, placeholder = 'Type a message...', disabled = false }: InputBarProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (chat.input.trim()) {
      chat.send(chat.input)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (chat.input.trim()) {
        chat.send(chat.input)
      }
    }
  }

  return (
    <form data-ra-input-bar onSubmit={handleSubmit}>
      <textarea
        role="textbox"
        value={chat.input}
        onChange={(e) => chat.setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        data-ra-input
        rows={1}
      />
      <button type="submit" disabled={disabled || !chat.input.trim()} data-ra-send>
        Send
      </button>
    </form>
  )
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npx vitest run tests/components/ChatContainer.test.tsx tests/components/Message.test.tsx tests/components/InputBar.test.tsx
```

Expected: all 11 tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/ChatContainer.tsx src/components/Message.tsx src/components/InputBar.tsx tests/components/
git commit -m "feat: implement ChatContainer, Message, and InputBar headless components"
```

---

### Task 10: Components — Markdown, CodeBlock, ToolCallView, ThinkingIndicator

**Files:**
- Create: `src/components/Markdown.tsx`
- Create: `src/components/CodeBlock.tsx`
- Create: `src/components/ToolCallView.tsx`
- Create: `src/components/ThinkingIndicator.tsx`
- Create: `tests/components/Markdown.test.tsx`
- Create: `tests/components/CodeBlock.test.tsx`
- Create: `tests/components/ToolCallView.test.tsx`
- Create: `tests/components/ThinkingIndicator.test.tsx`

- [ ] **Step 1: Write failing tests for all four components**

```tsx
// tests/components/Markdown.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Markdown } from '../../src/components/Markdown'

describe('Markdown', () => {
  it('renders plain text content', () => {
    render(<Markdown content="Hello world" />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('sets data-ra-markdown attribute', () => {
    const { container } = render(<Markdown content="test" />)
    expect(container.firstElementChild).toHaveAttribute('data-ra-markdown')
  })

  it('sets data-ra-streaming attribute when streaming', () => {
    const { container } = render(<Markdown content="partial..." streaming />)
    expect(container.firstElementChild).toHaveAttribute('data-ra-streaming', 'true')
  })
})
```

```tsx
// tests/components/CodeBlock.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { CodeBlock } from '../../src/components/CodeBlock'

describe('CodeBlock', () => {
  it('renders code content in a pre > code structure', () => {
    render(<CodeBlock code="const x = 1" />)
    expect(screen.getByText('const x = 1')).toBeInTheDocument()
    const code = screen.getByText('const x = 1')
    expect(code.tagName).toBe('CODE')
    expect(code.parentElement?.tagName).toBe('PRE')
  })

  it('sets data-ra-language attribute when language is provided', () => {
    const { container } = render(<CodeBlock code="x = 1" language="python" />)
    expect(container.querySelector('[data-ra-code-block]')).toHaveAttribute('data-ra-language', 'python')
  })

  it('renders copy button when copyable is true', () => {
    render(<CodeBlock code="test" copyable />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

```tsx
// tests/components/ToolCallView.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { ToolCallView } from '../../src/components/ToolCallView'
import type { ToolCall } from '../../src/core/types'

const toolCall: ToolCall = {
  id: 'tc-1',
  name: 'search',
  args: { query: 'react arrow' },
  result: '3 results found',
  status: 'complete',
}

describe('ToolCallView', () => {
  it('renders the tool name', () => {
    render(<ToolCallView toolCall={toolCall} />)
    expect(screen.getByText('search')).toBeInTheDocument()
  })

  it('sets data-ra-tool-status attribute', () => {
    const { container } = render(<ToolCallView toolCall={toolCall} />)
    expect(container.firstElementChild).toHaveAttribute('data-ra-tool-status', 'complete')
  })

  it('shows args and result when expanded', () => {
    render(<ToolCallView toolCall={toolCall} />)
    fireEvent.click(screen.getByText('search'))
    expect(screen.getByText(/"query"/)).toBeInTheDocument()
    expect(screen.getByText('3 results found')).toBeInTheDocument()
  })
})
```

```tsx
// tests/components/ThinkingIndicator.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { ThinkingIndicator } from '../../src/components/ThinkingIndicator'

describe('ThinkingIndicator', () => {
  it('renders nothing when visible is false', () => {
    const { container } = render(<ThinkingIndicator visible={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders indicator when visible is true', () => {
    render(<ThinkingIndicator visible />)
    expect(screen.getByTestId('ra-thinking')).toBeInTheDocument()
  })

  it('renders custom label', () => {
    render(<ThinkingIndicator visible label="Generating..." />)
    expect(screen.getByText('Generating...')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/components/Markdown.test.tsx tests/components/CodeBlock.test.tsx tests/components/ToolCallView.test.tsx tests/components/ThinkingIndicator.test.tsx
```

Expected: FAIL — modules don't exist.

- [ ] **Step 3: Implement Markdown**

```tsx
// src/components/Markdown.tsx
import React from 'react'

export interface MarkdownProps {
  content: string
  streaming?: boolean
}

export function Markdown({ content, streaming = false }: MarkdownProps) {
  return (
    <div data-ra-markdown data-ra-streaming={streaming ? 'true' : undefined}>
      {content}
    </div>
  )
}
```

Note: This is a minimal headless implementation. Rich markdown parsing (bold, lists, headings) can be added later via a markdown parser dependency (e.g., `marked` or `react-markdown`). The headless component provides the structure and attributes — users can wrap it or swap in their own renderer.

- [ ] **Step 4: Implement CodeBlock**

```tsx
// src/components/CodeBlock.tsx
import React, { useCallback } from 'react'

export interface CodeBlockProps {
  code: string
  language?: string
  copyable?: boolean
}

export function CodeBlock({ code, language, copyable = false }: CodeBlockProps) {
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
  }, [code])

  return (
    <div data-ra-code-block data-ra-language={language}>
      <pre>
        <code>{code}</code>
      </pre>
      {copyable && (
        <button onClick={handleCopy} data-ra-copy type="button">
          Copy
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Implement ToolCallView**

```tsx
// src/components/ToolCallView.tsx
import React, { useState } from 'react'
import type { ToolCall } from '../core/types'

export interface ToolCallViewProps {
  toolCall: ToolCall
}

export function ToolCallView({ toolCall }: ToolCallViewProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div data-ra-tool-call data-ra-tool-status={toolCall.status}>
      <button
        onClick={() => setExpanded(!expanded)}
        data-ra-tool-toggle
        type="button"
      >
        {toolCall.name}
      </button>
      {expanded && (
        <div data-ra-tool-details>
          <pre data-ra-tool-args>
            {JSON.stringify(toolCall.args, null, 2)}
          </pre>
          {toolCall.result && (
            <div data-ra-tool-result>{toolCall.result}</div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Implement ThinkingIndicator**

```tsx
// src/components/ThinkingIndicator.tsx
import React from 'react'

export interface ThinkingIndicatorProps {
  visible: boolean
  label?: string
}

export function ThinkingIndicator({ visible, label = 'Thinking...' }: ThinkingIndicatorProps) {
  if (!visible) return null

  return (
    <div data-ra-thinking data-testid="ra-thinking">
      <span data-ra-thinking-dots>
        <span>•</span><span>•</span><span>•</span>
      </span>
      <span data-ra-thinking-label>{label}</span>
    </div>
  )
}
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
npx vitest run tests/components/Markdown.test.tsx tests/components/CodeBlock.test.tsx tests/components/ToolCallView.test.tsx tests/components/ThinkingIndicator.test.tsx
```

Expected: all 12 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/Markdown.tsx src/components/CodeBlock.tsx src/components/ToolCallView.tsx src/components/ThinkingIndicator.tsx tests/components/
git commit -m "feat: implement Markdown, CodeBlock, ToolCallView, and ThinkingIndicator components"
```

---

### Task 11: Components Index & Main Entry

**Files:**
- Create: `src/components/index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Create components index**

```ts
// src/components/index.ts
export { ChatContainer } from './ChatContainer'
export { Message } from './Message'
export { InputBar } from './InputBar'
export { Markdown } from './Markdown'
export { CodeBlock } from './CodeBlock'
export { ToolCallView } from './ToolCallView'
export { ThinkingIndicator } from './ThinkingIndicator'
export type { ChatContainerProps } from './ChatContainer'
export type { MessageProps } from './Message'
export type { InputBarProps } from './InputBar'
export type { MarkdownProps } from './Markdown'
export type { CodeBlockProps } from './CodeBlock'
export type { ToolCallViewProps } from './ToolCallView'
export type { ThinkingIndicatorProps } from './ThinkingIndicator'
```

- [ ] **Step 2: Update src/index.ts**

```ts
// src/index.ts
export * from './core'
export * from './components'
```

- [ ] **Step 3: Verify full build**

```bash
npx tsup
npx tsc --noEmit
```

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/index.ts src/index.ts
git commit -m "feat: wire up component exports and verify full build"
```

---

### Task 12: Default Theme

**Files:**
- Create: `src/theme/tokens.css`
- Create: `src/theme/default.css`

- [ ] **Step 1: Create CSS tokens**

```css
/* src/theme/tokens.css */
:root {
  --ra-color-bg: #ffffff;
  --ra-color-surface: #f9fafb;
  --ra-color-border: #e5e7eb;
  --ra-color-text: #111827;
  --ra-color-text-muted: #6b7280;
  --ra-color-bubble-user: #2563eb;
  --ra-color-bubble-user-text: #ffffff;
  --ra-color-bubble-assistant: #f3f4f6;
  --ra-color-bubble-assistant-text: #111827;
  --ra-color-input-bg: #ffffff;
  --ra-color-input-border: #d1d5db;
  --ra-color-input-focus: #2563eb;
  --ra-color-button: #2563eb;
  --ra-color-button-text: #ffffff;
  --ra-color-code-bg: #1f2937;
  --ra-color-code-text: #e5e7eb;
  --ra-color-tool-bg: #fef3c7;
  --ra-color-tool-border: #f59e0b;
  --ra-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --ra-font-size: 14px;
  --ra-font-size-sm: 12px;
  --ra-font-size-lg: 16px;
  --ra-line-height: 1.5;
  --ra-radius: 8px;
  --ra-radius-lg: 12px;
  --ra-spacing-xs: 4px;
  --ra-spacing-sm: 8px;
  --ra-spacing-md: 12px;
  --ra-spacing-lg: 16px;
  --ra-spacing-xl: 24px;
  --ra-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --ra-transition: 150ms ease;
}

[data-theme="dark"],
.dark {
  --ra-color-bg: #111827;
  --ra-color-surface: #1f2937;
  --ra-color-border: #374151;
  --ra-color-text: #f9fafb;
  --ra-color-text-muted: #9ca3af;
  --ra-color-bubble-user: #3b82f6;
  --ra-color-bubble-user-text: #ffffff;
  --ra-color-bubble-assistant: #1f2937;
  --ra-color-bubble-assistant-text: #f9fafb;
  --ra-color-input-bg: #1f2937;
  --ra-color-input-border: #4b5563;
  --ra-color-input-focus: #3b82f6;
  --ra-color-button: #3b82f6;
  --ra-color-button-text: #ffffff;
  --ra-color-code-bg: #0f172a;
  --ra-color-code-text: #e2e8f0;
  --ra-color-tool-bg: #451a03;
  --ra-color-tool-border: #d97706;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --ra-color-bg: #111827;
    --ra-color-surface: #1f2937;
    --ra-color-border: #374151;
    --ra-color-text: #f9fafb;
    --ra-color-text-muted: #9ca3af;
    --ra-color-bubble-user: #3b82f6;
    --ra-color-bubble-user-text: #ffffff;
    --ra-color-bubble-assistant: #1f2937;
    --ra-color-bubble-assistant-text: #f9fafb;
    --ra-color-input-bg: #1f2937;
    --ra-color-input-border: #4b5563;
    --ra-color-input-focus: #3b82f6;
    --ra-color-button: #3b82f6;
    --ra-color-button-text: #ffffff;
    --ra-color-code-bg: #0f172a;
    --ra-color-code-text: #e2e8f0;
    --ra-color-tool-bg: #451a03;
    --ra-color-tool-border: #d97706;
  }
}
```

- [ ] **Step 2: Create default theme**

```css
/* src/theme/default.css */
@import './tokens.css';

/* Chat Container */
[data-ra-chat-container] {
  display: flex;
  flex-direction: column;
  gap: var(--ra-spacing-md);
  padding: var(--ra-spacing-lg);
  background: var(--ra-color-bg);
  font-family: var(--ra-font-family);
  font-size: var(--ra-font-size);
  line-height: var(--ra-line-height);
  color: var(--ra-color-text);
  height: 100%;
  overflow-y: auto;
}

/* Messages */
[data-ra-message] {
  display: flex;
  gap: var(--ra-spacing-sm);
  max-width: 80%;
  animation: ra-fade-in var(--ra-transition);
}

[data-ra-role="user"] {
  align-self: flex-end;
  flex-direction: row-reverse;
}

[data-ra-role="assistant"] {
  align-self: flex-start;
}

[data-ra-content] {
  padding: var(--ra-spacing-md) var(--ra-spacing-lg);
  border-radius: var(--ra-radius-lg);
  word-break: break-word;
}

[data-ra-role="user"] [data-ra-content] {
  background: var(--ra-color-bubble-user);
  color: var(--ra-color-bubble-user-text);
  border-bottom-right-radius: var(--ra-spacing-xs);
}

[data-ra-role="assistant"] [data-ra-content] {
  background: var(--ra-color-bubble-assistant);
  color: var(--ra-color-bubble-assistant-text);
  border-bottom-left-radius: var(--ra-spacing-xs);
}

[data-ra-avatar] {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--ra-color-surface);
  border: 1px solid var(--ra-color-border);
}

/* Streaming cursor */
[data-ra-status="streaming"] [data-ra-content]::after {
  content: '▊';
  animation: ra-blink 1s step-end infinite;
  color: var(--ra-color-text-muted);
}

/* Input Bar */
[data-ra-input-bar] {
  display: flex;
  gap: var(--ra-spacing-sm);
  padding: var(--ra-spacing-md);
  background: var(--ra-color-surface);
  border-top: 1px solid var(--ra-color-border);
}

[data-ra-input] {
  flex: 1;
  padding: var(--ra-spacing-sm) var(--ra-spacing-md);
  border: 1px solid var(--ra-color-input-border);
  border-radius: var(--ra-radius);
  background: var(--ra-color-input-bg);
  color: var(--ra-color-text);
  font-family: var(--ra-font-family);
  font-size: var(--ra-font-size);
  resize: none;
  outline: none;
  transition: border-color var(--ra-transition);
}

[data-ra-input]:focus {
  border-color: var(--ra-color-input-focus);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ra-color-input-focus) 20%, transparent);
}

[data-ra-send] {
  padding: var(--ra-spacing-sm) var(--ra-spacing-lg);
  background: var(--ra-color-button);
  color: var(--ra-color-button-text);
  border: none;
  border-radius: var(--ra-radius);
  cursor: pointer;
  font-family: var(--ra-font-family);
  font-size: var(--ra-font-size);
  font-weight: 500;
  transition: opacity var(--ra-transition);
}

[data-ra-send]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Markdown */
[data-ra-markdown] {
  line-height: var(--ra-line-height);
}

/* Code Block */
[data-ra-code-block] {
  position: relative;
  border-radius: var(--ra-radius);
  overflow: hidden;
}

[data-ra-code-block] pre {
  margin: 0;
  padding: var(--ra-spacing-lg);
  background: var(--ra-color-code-bg);
  color: var(--ra-color-code-text);
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: var(--ra-font-size-sm);
  line-height: 1.6;
  overflow-x: auto;
}

[data-ra-copy] {
  position: absolute;
  top: var(--ra-spacing-sm);
  right: var(--ra-spacing-sm);
  padding: var(--ra-spacing-xs) var(--ra-spacing-sm);
  background: rgba(255, 255, 255, 0.1);
  color: var(--ra-color-code-text);
  border: none;
  border-radius: var(--ra-spacing-xs);
  cursor: pointer;
  font-size: var(--ra-font-size-sm);
  opacity: 0;
  transition: opacity var(--ra-transition);
}

[data-ra-code-block]:hover [data-ra-copy] {
  opacity: 1;
}

/* Tool Call */
[data-ra-tool-call] {
  border: 1px solid var(--ra-color-tool-border);
  border-radius: var(--ra-radius);
  background: var(--ra-color-tool-bg);
  overflow: hidden;
}

[data-ra-tool-toggle] {
  display: block;
  width: 100%;
  padding: var(--ra-spacing-sm) var(--ra-spacing-md);
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-family: var(--ra-font-family);
  font-size: var(--ra-font-size-sm);
  font-weight: 600;
  color: inherit;
}

[data-ra-tool-details] {
  padding: var(--ra-spacing-sm) var(--ra-spacing-md);
  border-top: 1px solid var(--ra-color-tool-border);
}

[data-ra-tool-args] {
  margin: 0;
  font-size: var(--ra-font-size-sm);
  font-family: monospace;
}

/* Thinking Indicator */
[data-ra-thinking] {
  display: flex;
  align-items: center;
  gap: var(--ra-spacing-sm);
  padding: var(--ra-spacing-sm) var(--ra-spacing-md);
  color: var(--ra-color-text-muted);
  font-size: var(--ra-font-size-sm);
}

[data-ra-thinking-dots] span {
  animation: ra-blink 1.4s infinite both;
}

[data-ra-thinking-dots] span:nth-child(2) {
  animation-delay: 0.2s;
}

[data-ra-thinking-dots] span:nth-child(3) {
  animation-delay: 0.4s;
}

/* Animations */
@keyframes ra-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes ra-blink {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}
```

- [ ] **Step 3: Verify CSS is copied by build**

```bash
npx tsup
ls -la dist/theme/
```

Note: tsup doesn't copy CSS by default. Add a postbuild script or modify tsup.config.ts to handle CSS:

Update `tsup.config.ts` to add:
```ts
import { defineConfig } from 'tsup'
import { copyFileSync, mkdirSync } from 'fs'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'adapters/index': 'src/adapters/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  splitting: true,
  treeshake: true,
  onSuccess: async () => {
    mkdirSync('dist/theme', { recursive: true })
    copyFileSync('src/theme/tokens.css', 'dist/theme/tokens.css')
    copyFileSync('src/theme/default.css', 'dist/theme/default.css')
  },
})
```

- [ ] **Step 4: Rebuild and verify**

```bash
npx tsup
ls dist/theme/default.css
```

Expected: `dist/theme/default.css` exists.

- [ ] **Step 5: Commit**

```bash
git add src/theme/ tsup.config.ts
git commit -m "feat: add default theme with CSS custom properties and light/dark mode"
```

---

### Task 13: Docusaurus Documentation Site Scaffold

**Files:**
- Create: `docs/` directory (Docusaurus project)

- [ ] **Step 1: Scaffold Docusaurus**

```bash
cd /Users/rebecabraun/workspace/EmersonBraun/lib
npx create-docusaurus@latest docs classic --typescript
```

- [ ] **Step 2: Clean up default content**

Remove default blog and docs pages that come with the scaffold:

```bash
rm -rf docs/blog
rm -f docs/docs/intro.md docs/docs/tutorial-basics/*.md docs/docs/tutorial-extras/*.md
rmdir docs/docs/tutorial-basics docs/docs/tutorial-extras 2>/dev/null || true
```

- [ ] **Step 3: Update docusaurus.config.ts with React Arrow branding**

Edit `docs/docusaurus.config.ts`:

```ts
import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

const config: Config = {
  title: 'React Arrow',
  tagline: 'A hooks-first React library for the agentic era',
  favicon: 'img/favicon.ico',
  url: 'https://emersonbraun.github.io',
  baseUrl: '/lib/',
  organizationName: 'EmersonBraun',
  projectName: 'lib',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: { defaultLocale: 'en', locales: ['en'] },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/EmersonBraun/lib/tree/main/docs/',
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'React Arrow',
      items: [
        { type: 'docSidebar', sidebarId: 'docsSidebar', position: 'left', label: 'Docs' },
        { href: 'https://github.com/EmersonBraun/lib', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Quick Start', to: '/docs/getting-started/quick-start' },
            { label: 'API Reference', to: '/docs/api-reference' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'GitHub', href: 'https://github.com/EmersonBraun/lib' },
            { label: 'Arrow.js (inspiration)', href: 'https://arrow-js.com/' },
          ],
        },
      ],
      copyright: `Inspired by Arrow.js. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'tsx', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
}

export default config
```

- [ ] **Step 4: Verify docs site builds**

```bash
cd /Users/rebecabraun/workspace/EmersonBraun/lib/docs && npm install && npm run build
```

- [ ] **Step 5: Commit**

```bash
cd /Users/rebecabraun/workspace/EmersonBraun/lib
git add docs/
git commit -m "feat: scaffold Docusaurus documentation site with React Arrow branding"
```

---

### Task 14: Documentation Content — Getting Started

**Files:**
- Create: `docs/docs/getting-started/installation.md`
- Create: `docs/docs/getting-started/quick-start.md`
- Create: `docs/docs/getting-started/for-ai-agents.md`

- [ ] **Step 1: Create installation page**

```md
---
sidebar_position: 1
---

# Installation

Install React Arrow with your package manager:

\`\`\`bash
npm install react-arrow
\`\`\`

\`\`\`bash
yarn add react-arrow
\`\`\`

\`\`\`bash
pnpm add react-arrow
\`\`\`

## Peer Dependencies

React Arrow requires React 18 or later:

\`\`\`bash
npm install react react-dom
\`\`\`

## Optional: Default Theme

Import the default theme CSS for a polished chat UI out of the box:

\`\`\`tsx
import 'react-arrow/theme'
\`\`\`

The theme uses CSS custom properties, so you can override any token without ejecting.
```

- [ ] **Step 2: Create quick start page**

```md
---
sidebar_position: 2
---

# Quick Start

Build a working AI chat in under 10 lines.

## Basic Chat

\`\`\`tsx
import { useChat, ChatContainer, Message, InputBar } from 'react-arrow'
import { anthropic } from 'react-arrow/adapters'
import 'react-arrow/theme'

function App() {
  const chat = useChat({
    adapter: anthropic({ apiKey: 'your-key', model: 'claude-sonnet-4-6' }),
  })

  return (
    <ChatContainer>
      {chat.messages.map(msg => (
        <Message key={msg.id} message={msg} />
      ))}
      <InputBar chat={chat} />
    </ChatContainer>
  )
}
\`\`\`

## What's happening?

1. **`useChat`** creates a chat session connected to an AI adapter
2. **`ChatContainer`** provides a scrollable layout that auto-scrolls on new messages
3. **`Message`** renders each message with streaming support
4. **`InputBar`** handles text input and sends messages on Enter

## Using a different provider

Swap the adapter — everything else stays the same:

\`\`\`tsx
import { openai } from 'react-arrow/adapters'

const chat = useChat({
  adapter: openai({ apiKey: 'your-key', model: 'gpt-4o' }),
})
\`\`\`

## Headless mode

Skip the theme import and style everything yourself:

\`\`\`tsx
import { useChat, ChatContainer, Message, InputBar } from 'react-arrow'
// No theme import — components render with data-ra-* attributes only

function App() {
  const chat = useChat({ adapter: myAdapter })
  return (
    <ChatContainer className="my-chat">
      {chat.messages.map(msg => (
        <Message key={msg.id} message={msg} />
      ))}
      <InputBar chat={chat} />
    </ChatContainer>
  )
}
\`\`\`
```

- [ ] **Step 3: Create for-ai-agents page**

```md
---
sidebar_position: 3
---

# For AI Agents

The entire React Arrow API in one page. Paste this into your LLM context.

## Hooks

\`\`\`tsx
// Stream any async source
const { text, status, error, stop } = useStream(source)

// Reactive state (proxy-based, minimal re-renders)
const state = useReactive({ count: 0 })
state.count++ // triggers re-render

// Full chat session
const chat = useChat({ adapter })
chat.send('message')    // send and stream response
chat.stop()             // abort stream
chat.retry()            // retry last
chat.messages           // Message[]
chat.status             // 'idle' | 'streaming' | 'error'
chat.input / setInput   // controlled input
\`\`\`

## Adapters

\`\`\`tsx
import { anthropic, openai, vercelAI, generic } from 'react-arrow/adapters'

anthropic({ apiKey, model })
openai({ apiKey, model })
vercelAI({ api: '/api/chat' })
generic({ send: async (msgs) => ReadableStream })
\`\`\`

## Components

\`\`\`tsx
<ChatContainer>        {/* scrollable chat layout */}
<Message message={m} /> {/* chat bubble */}
<InputBar chat={chat} /> {/* input + send */}
<Markdown content={s} /> {/* markdown text */}
<CodeBlock code={s} language="ts" copyable />
<ToolCallView toolCall={tc} />
<ThinkingIndicator visible />
\`\`\`

## Theme

\`\`\`tsx
import 'react-arrow/theme' // optional default CSS
\`\`\`

All components use `data-ra-*` attributes. Override with CSS custom properties (`--ra-color-*`, `--ra-font-*`, `--ra-spacing-*`).

## Types

\`\`\`ts
Message { id, role, content, status, toolCalls?, metadata?, createdAt }
ToolCall { id, name, args, result?, status }
StreamChunk { type: 'text'|'tool_call'|'error'|'done', content?, toolCall? }
\`\`\`
```

- [ ] **Step 4: Commit**

```bash
git add docs/docs/getting-started/
git commit -m "docs: add installation, quick start, and AI agents reference pages"
```

---

### Task 15: Documentation Content — Core Hooks & Components

**Files:**
- Create: `docs/docs/hooks/use-stream.md`
- Create: `docs/docs/hooks/use-reactive.md`
- Create: `docs/docs/hooks/use-chat.md`
- Create: `docs/docs/components/overview.md`
- Create: `docs/docs/adapters/overview.md`
- Create: `docs/docs/theming/overview.md`

- [ ] **Step 1: Create useStream docs**

```md
---
sidebar_position: 1
---

# useStream

The fundamental streaming primitive. Consumes any async stream and returns reactive state.

## Usage

\`\`\`tsx
import { useStream } from 'react-arrow'

function StreamViewer({ source }) {
  const { text, status, error, stop } = useStream(source)

  return (
    <div>
      <p>{text}</p>
      {status === 'streaming' && <button onClick={stop}>Stop</button>}
      {status === 'error' && <p>Error: {error.message}</p>}
    </div>
  )
}
\`\`\`

## API

\`\`\`ts
const { data, text, status, error, stop } = useStream(source, options?)
\`\`\`

### Parameters

| Param | Type | Description |
|-------|------|-------------|
| `source` | `StreamSource` | A stream source from an adapter or custom source |
| `options.onChunk` | `(chunk: StreamChunk) => void` | Called for each chunk received |
| `options.onComplete` | `(text: string) => void` | Called when stream finishes |
| `options.onError` | `(error: Error) => void` | Called on stream error |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `data` | `StreamChunk \| null` | Latest chunk received |
| `text` | `string` | Accumulated full text |
| `status` | `StreamStatus` | `'idle' \| 'streaming' \| 'complete' \| 'error'` |
| `error` | `Error \| null` | Error if status is `'error'` |
| `stop` | `() => void` | Abort the stream |
```

- [ ] **Step 2: Create useReactive docs**

```md
---
sidebar_position: 2
---

# useReactive

Proxy-based fine-grained reactive state. Mutations trigger re-renders only for components that read the changed properties.

## Usage

\`\`\`tsx
import { useReactive } from 'react-arrow'

function Counter() {
  const state = useReactive({ count: 0 })

  return (
    <button onClick={() => state.count++}>
      Count: {state.count}
    </button>
  )
}
\`\`\`

## API

\`\`\`ts
const state = useReactive(initialState)
\`\`\`

### Parameters

| Param | Type | Description |
|-------|------|-------------|
| `initialState` | `Record<string, unknown>` | Initial state object |

### Returns

A proxied version of the state object. Read and write properties directly — writes trigger re-renders.

## How It Works

Internally uses `useSyncExternalStore` to bridge proxy-based tracking with React's reconciliation model. The proxy intercepts property writes and notifies React to re-render.
```

- [ ] **Step 3: Create useChat docs**

```md
---
sidebar_position: 3
---

# useChat

High-level chat session orchestrator. Manages messages, streaming, and input state.

## Usage

\`\`\`tsx
import { useChat } from 'react-arrow'
import { anthropic } from 'react-arrow/adapters'

function Chat() {
  const chat = useChat({
    adapter: anthropic({ apiKey: 'key', model: 'claude-sonnet-4-6' }),
    onMessage: (msg) => console.log('Received:', msg.content),
  })

  return (
    <div>
      {chat.messages.map(msg => (
        <div key={msg.id}>{msg.role}: {msg.content}</div>
      ))}
      <input value={chat.input} onChange={e => chat.setInput(e.target.value)} />
      <button onClick={() => chat.send(chat.input)}>Send</button>
      {chat.status === 'streaming' && <button onClick={chat.stop}>Stop</button>}
    </div>
  )
}
\`\`\`

## API

\`\`\`ts
const chat = useChat(config)
\`\`\`

### Config

| Param | Type | Description |
|-------|------|-------------|
| `adapter` | `AdapterFactory` | AI provider adapter |
| `onMessage` | `(msg: Message) => void` | Called when assistant message completes |
| `onError` | `(err: Error) => void` | Called on stream error |
| `initialMessages` | `Message[]` | Pre-populate chat history |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `messages` | `Message[]` | All messages in the conversation |
| `send` | `(text: string) => void` | Send a user message and stream response |
| `stop` | `() => void` | Abort current stream |
| `retry` | `() => void` | Retry last assistant message |
| `status` | `StreamStatus` | Current streaming status |
| `input` | `string` | Current input value |
| `setInput` | `(value: string) => void` | Update input value |
```

- [ ] **Step 4: Create components overview**

```md
---
sidebar_position: 1
---

# Components Overview

React Arrow ships headless components that render semantic HTML with `data-ra-*` attributes. Import the default theme for instant styling, or target the attributes with your own CSS.

## Available Components

| Component | Purpose |
|-----------|---------|
| `ChatContainer` | Scrollable chat layout with auto-scroll |
| `Message` | Chat bubble with streaming support |
| `Markdown` | Text/markdown renderer |
| `CodeBlock` | Syntax-highlighted code with copy button |
| `ToolCallView` | Expandable tool invocation display |
| `ThinkingIndicator` | Animated thinking/loading state |
| `InputBar` | Text input with send button |

## Headless Philosophy

Components render minimal HTML with `data-ra-*` attributes:

\`\`\`html
<div data-ra-message data-ra-role="user" data-ra-status="complete">
  <div data-ra-content>Hello!</div>
</div>
\`\`\`

Style with attribute selectors:

\`\`\`css
[data-ra-role="user"] [data-ra-content] {
  background: blue;
  color: white;
}
\`\`\`

Or import the default theme:

\`\`\`tsx
import 'react-arrow/theme'
\`\`\`
```

- [ ] **Step 5: Create adapters overview**

```md
---
sidebar_position: 1
---

# Adapters Overview

Adapters normalize AI provider streaming APIs into a common interface that React Arrow hooks consume.

## Built-in Adapters

\`\`\`tsx
import { anthropic, openai, vercelAI, generic } from 'react-arrow/adapters'

// Anthropic
const adapter = anthropic({ apiKey: 'key', model: 'claude-sonnet-4-6' })

// OpenAI
const adapter = openai({ apiKey: 'key', model: 'gpt-4o' })

// Vercel AI SDK (route handler)
const adapter = vercelAI({ api: '/api/chat' })

// Generic (any ReadableStream)
const adapter = generic({
  send: async (messages) => {
    const res = await fetch('/api/chat', { body: JSON.stringify(messages) })
    return res.body
  },
})
\`\`\`

## Custom Adapters

\`\`\`tsx
import { createAdapter } from 'react-arrow/adapters'

const myAdapter = createAdapter({
  send: async (messages) => fetch('/api', { body: JSON.stringify(messages) }),
  parse: async function* (stream) {
    const reader = stream.getReader()
    // ... yield StreamChunk objects
    yield { type: 'done' }
  },
  abort: () => { /* cleanup */ },
})
\`\`\`
```

- [ ] **Step 6: Create theming overview**

```md
---
sidebar_position: 1
---

# Theming

React Arrow components are headless by default. Import the optional theme for a polished chat UI.

## Default Theme

\`\`\`tsx
import 'react-arrow/theme'
\`\`\`

Includes light and dark mode support via `prefers-color-scheme` or `data-theme` attribute.

## CSS Custom Properties

Override any token to customize the theme:

\`\`\`css
:root {
  --ra-color-bubble-user: #10b981;
  --ra-color-button: #10b981;
  --ra-radius: 16px;
  --ra-font-family: 'Inter', sans-serif;
}
\`\`\`

### Available Tokens

| Token | Default (light) | Description |
|-------|-----------------|-------------|
| `--ra-color-bg` | `#ffffff` | Page background |
| `--ra-color-surface` | `#f9fafb` | Surface/card background |
| `--ra-color-border` | `#e5e7eb` | Border color |
| `--ra-color-text` | `#111827` | Primary text |
| `--ra-color-text-muted` | `#6b7280` | Secondary text |
| `--ra-color-bubble-user` | `#2563eb` | User message bubble |
| `--ra-color-bubble-assistant` | `#f3f4f6` | Assistant message bubble |
| `--ra-color-button` | `#2563eb` | Button background |
| `--ra-font-family` | System font stack | Font family |
| `--ra-font-size` | `14px` | Base font size |
| `--ra-radius` | `8px` | Border radius |
| `--ra-spacing-*` | `4-24px` | Spacing scale (xs, sm, md, lg, xl) |

## Dark Mode

Automatic via `prefers-color-scheme`, or force it:

\`\`\`html
<div data-theme="dark">
  <ChatContainer>...</ChatContainer>
</div>
\`\`\`

## Fully Custom Styling

Skip the theme entirely and style using `data-ra-*` attribute selectors:

\`\`\`css
[data-ra-chat-container] { /* your styles */ }
[data-ra-role="user"] [data-ra-content] { /* user bubble */ }
[data-ra-role="assistant"] [data-ra-content] { /* assistant bubble */ }
\`\`\`
```

- [ ] **Step 7: Update Docusaurus sidebars**

Edit `docs/sidebars.ts`:

```ts
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/for-ai-agents',
      ],
    },
    {
      type: 'category',
      label: 'Core Hooks',
      items: [
        'hooks/use-stream',
        'hooks/use-reactive',
        'hooks/use-chat',
      ],
    },
    {
      type: 'category',
      label: 'Components',
      items: ['components/overview'],
    },
    {
      type: 'category',
      label: 'Adapters',
      items: ['adapters/overview'],
    },
    {
      type: 'category',
      label: 'Theming',
      items: ['theming/overview'],
    },
  ],
}

export default sidebars
```

- [ ] **Step 8: Verify docs build**

```bash
cd /Users/rebecabraun/workspace/EmersonBraun/lib/docs && npm run build
```

- [ ] **Step 9: Commit**

```bash
cd /Users/rebecabraun/workspace/EmersonBraun/lib
git add docs/
git commit -m "docs: add core hooks, components, adapters, and theming documentation"
```

---

### Task 16: Custom Landing Page

**Files:**
- Create: `docs/src/pages/index.tsx`
- Create: `docs/src/css/custom.css`

- [ ] **Step 1: Create custom landing page**

```tsx
// docs/src/pages/index.tsx
import React from 'react'
import Layout from '@theme/Layout'
import Link from '@docusaurus/Link'

function StreamingDemo() {
  const [text, setText] = React.useState('')
  const fullText = `import { useChat, ChatContainer, Message, InputBar } from 'react-arrow'
import 'react-arrow/theme'

function App() {
  const chat = useChat({ adapter: anthropic({ model: 'claude-sonnet-4-6' }) })
  return (
    <ChatContainer>
      {chat.messages.map(msg => <Message key={msg.id} message={msg} />)}
      <InputBar chat={chat} />
    </ChatContainer>
  )
}`

  React.useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setText(fullText.slice(0, i))
        i++
      } else {
        clearInterval(interval)
      }
    }, 25)
    return () => clearInterval(interval)
  }, [])

  return (
    <pre style={{
      background: 'var(--ifm-color-emphasis-100)',
      padding: '1.5rem',
      borderRadius: '8px',
      fontSize: '13px',
      lineHeight: 1.6,
      overflow: 'auto',
      minHeight: '280px',
    }}>
      <code>{text}<span style={{ animation: 'blink 1s step-end infinite' }}>▊</span></code>
    </pre>
  )
}

export default function Home(): React.JSX.Element {
  return (
    <Layout title="React Arrow" description="A hooks-first React library for the agentic era">
      <main style={{ padding: '4rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800 }}>
            React Arrow <span style={{ opacity: 0.5 }}>→</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--ifm-color-emphasis-700)' }}>
            A hooks-first React library for the agentic era.
          </p>
          <p style={{ fontSize: '0.95rem', color: 'var(--ifm-color-emphasis-600)' }}>
            Inspired by <a href="https://arrow-js.com/" target="_blank" rel="noopener">Arrow.js</a>
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <Link className="button button--primary button--lg" to="/docs/getting-started/quick-start">
              Get Started
            </Link>
            <Link className="button button--secondary button--lg" to="/docs/getting-started/for-ai-agents">
              For AI Agents
            </Link>
          </div>
        </div>

        <StreamingDemo />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginTop: '3rem',
        }}>
          <div style={{ padding: '1.5rem', borderRadius: '8px', background: 'var(--ifm-color-emphasis-100)' }}>
            <h3>3 Hooks</h3>
            <p>useStream, useReactive, useChat — that's the whole API. Simple enough for agents, powerful enough for production.</p>
          </div>
          <div style={{ padding: '1.5rem', borderRadius: '8px', background: 'var(--ifm-color-emphasis-100)' }}>
            <h3>Stream-Native</h3>
            <p>Built around async streams. Works with Anthropic, OpenAI, Vercel AI SDK, or any ReadableStream.</p>
          </div>
          <div style={{ padding: '1.5rem', borderRadius: '8px', background: 'var(--ifm-color-emphasis-100)' }}>
            <h3>Headless + Theme</h3>
            <p>Components ship unstyled with data attributes. Import the optional theme or style your own way.</p>
          </div>
        </div>
      </main>
    </Layout>
  )
}
```

- [ ] **Step 2: Create custom CSS**

```css
/* docs/src/css/custom.css */
:root {
  --ifm-color-primary: #2563eb;
  --ifm-color-primary-dark: #1d4ed8;
  --ifm-color-primary-darker: #1e40af;
  --ifm-color-primary-darkest: #1e3a8a;
  --ifm-color-primary-light: #3b82f6;
  --ifm-color-primary-lighter: #60a5fa;
  --ifm-color-primary-lightest: #93c5fd;
  --ifm-font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --ifm-code-font-size: 90%;
}

[data-theme='dark'] {
  --ifm-color-primary: #3b82f6;
  --ifm-color-primary-dark: #2563eb;
  --ifm-color-primary-darker: #1d4ed8;
  --ifm-color-primary-darkest: #1e40af;
  --ifm-color-primary-light: #60a5fa;
  --ifm-color-primary-lighter: #93c5fd;
  --ifm-color-primary-lightest: #bfdbfe;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
```

- [ ] **Step 3: Verify landing page**

```bash
cd /Users/rebecabraun/workspace/EmersonBraun/lib/docs && npm run build
```

- [ ] **Step 4: Commit**

```bash
cd /Users/rebecabraun/workspace/EmersonBraun/lib
git add docs/src/
git commit -m "feat: add custom landing page with streaming demo and branding"
```

---

### Task 17: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/docs.yml`

- [ ] **Step 1: Create CI workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

- [ ] **Step 2: Create docs deploy workflow**

```yaml
# .github/workflows/docs.yml
name: Deploy Docs

on:
  push:
    branches: [main]
    paths: ['docs/**']

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: docs/package-lock.json
      - run: cd docs && npm ci && npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/build
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Commit**

```bash
git add .github/
git commit -m "ci: add GitHub Actions for CI and docs deployment"
```

---

### Task 18: Final Integration — Verify Everything

**Files:** No new files. Integration verification only.

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/rebecabraun/workspace/EmersonBraun/lib
npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 2: Run full build**

```bash
npx tsup
```

Expected: `dist/` contains `index.js`, `index.cjs`, `index.d.ts`, `adapters/`, `theme/`.

- [ ] **Step 3: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Build docs**

```bash
cd /Users/rebecabraun/workspace/EmersonBraun/lib/docs && npm run build
```

Expected: docs build succeeds.

- [ ] **Step 5: Commit any remaining changes and tag**

```bash
cd /Users/rebecabraun/workspace/EmersonBraun/lib
git add -A
git commit -m "chore: finalize v0.1.0 release"
git tag v0.1.0
```
