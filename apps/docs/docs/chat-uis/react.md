---
sidebar_position: 1
---

# @agentskit/react

React chat UI built on `@agentskit/core`. Provides three hooks and seven headless components styled via CSS variables.

## Install

```bash
npm install @agentskit/react @agentskit/core
# optional: real AI providers
npm install @agentskit/adapters
```

## Hooks

### `useChat`

The primary hook. Creates and manages a full chat session.

```tsx
import { useChat } from '@agentskit/react'

const chat = useChat({
  adapter: myAdapter,          // required — AdapterFactory
  systemPrompt: 'You are...', // optional
  memory: myMemory,           // optional — ChatMemory
  tools: [...],               // optional — ToolDefinition[]
})
```

Returns a `ChatReturn` object:

| Property | Type | Description |
|---|---|---|
| `messages` | `Message[]` | Full conversation history |
| `input` | `string` | Current input field value |
| `status` | `'idle' \| 'streaming' \| 'error'` | Session status |
| `error` | `Error \| null` | Last error, if any |
| `send(text)` | `(text: string) => void` | Send a message |
| `stop()` | `() => void` | Abort the current stream |
| `retry()` | `() => void` | Retry the last request |
| `setInput(val)` | `(val: string) => void` | Update the input value |
| `clear()` | `() => void` | Clear the conversation |

### `useStream`

Lower-level hook for consuming a single `StreamSource` directly.

```tsx
import { useStream } from '@agentskit/react'

const { text, status, error, stop } = useStream(source, {
  onChunk: (chunk) => console.log(chunk),
  onComplete: (full) => console.log('done', full),
  onError: (err) => console.error(err),
})
```

### `useReactive`

Reactive state container that triggers re-renders on property mutations.

```tsx
import { useReactive } from '@agentskit/react'

const state = useReactive({ count: 0, label: 'hello' })
// Mutate directly — component re-renders automatically
state.count++
```

## Complete example (demo adapter — no API key needed)

```tsx
import { useChat, ChatContainer, Message, InputBar, ThinkingIndicator } from '@agentskit/react'
import type { AdapterFactory } from '@agentskit/react'
import '@agentskit/react/theme'

function createDemoAdapter(): AdapterFactory {
  return {
    createSource: ({ messages }) => {
      let cancelled = false
      return {
        stream: async function* () {
          const last = [...messages].reverse().find(m => m.role === 'user')
          const reply = `You said: "${last?.content ?? ''}". This is a demo response.`
          for (const chunk of reply.match(/.{1,20}/g) ?? []) {
            if (cancelled) return
            await new Promise(r => setTimeout(r, 40))
            yield { type: 'text' as const, content: chunk }
          }
          yield { type: 'done' as const }
        },
        abort: () => { cancelled = true },
      }
    },
  }
}

export default function App() {
  const chat = useChat({
    adapter: createDemoAdapter(),
    systemPrompt: 'You are a helpful assistant.',
  })

  return (
    <ChatContainer>
      {chat.messages.map(msg => (
        <Message key={msg.id} message={msg} />
      ))}
      <ThinkingIndicator visible={chat.status === 'streaming'} />
      <InputBar chat={chat} placeholder="Say something..." />
    </ChatContainer>
  )
}
```

## Swap to a real provider

Replace the adapter — nothing else changes:

```tsx
import { anthropic } from '@agentskit/adapters'

const chat = useChat({
  adapter: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-sonnet-4-6' }),
})
```

```tsx
import { openai } from '@agentskit/adapters'

const chat = useChat({
  adapter: openai({ apiKey: process.env.OPENAI_API_KEY, model: 'gpt-4o' }),
})
```

## `data-ak-*` attributes

Every component emits `data-ak-*` attributes so you can style or target them without class names:

| Attribute | Element | Values |
|---|---|---|
| `data-ak-chat-container` | wrapper `<div>` | — |
| `data-ak-message` | message wrapper | — |
| `data-ak-role` | message wrapper | `user`, `assistant`, `system`, `tool` |
| `data-ak-status` | message wrapper | `idle`, `streaming`, `done`, `error` |
| `data-ak-content` | message body | — |
| `data-ak-avatar` | avatar slot | — |
| `data-ak-actions` | actions slot | — |
| `data-ak-input-bar` | form wrapper | — |
| `data-ak-input` | textarea | — |
| `data-ak-send` | submit button | — |
| `data-ak-thinking` | thinking div | — |
| `data-ak-markdown` | markdown wrapper | — |
| `data-ak-streaming` | markdown wrapper | `true` when streaming |
| `data-ak-code-block` | code block wrapper | — |
| `data-ak-language` | code block wrapper | language string |
| `data-ak-copy` | copy button | — |
| `data-ak-tool-call` | tool call wrapper | — |
| `data-ak-tool-status` | tool call wrapper | `pending`, `running`, `done`, `error` |

See [Theming](./theming.md) for full CSS variable reference.

## Related

- [Components reference](./components.md)
- [Theming](./theming.md)
- [@agentskit/ink](./ink.md)
