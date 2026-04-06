---
sidebar_position: 2
---

# @agentskit/ink

Terminal chat UI built with [Ink](https://github.com/vadimdemedes/ink). Uses the same `@agentskit/core` controller as `@agentskit/react`, so the chat logic is identical — only the renderer differs.

## Install

```bash
npm install @agentskit/ink @agentskit/core ink react
# optional: real AI providers
npm install @agentskit/adapters
```

## Hook

### `useChat`

Identical API to `@agentskit/react`'s `useChat`. The same `ChatReturn` object is returned.

```tsx
import { useChat } from '@agentskit/ink'

const chat = useChat({
  adapter: myAdapter,
  systemPrompt: 'You are...',
})
```

See the [`useChat` reference](../hooks/use-chat.md) for the full return type.

## Complete example (demo adapter — no API key needed)

```tsx
import React from 'react'
import { render, Box, Text } from 'ink'
import {
  ChatContainer,
  Message,
  InputBar,
  ThinkingIndicator,
  useChat,
} from '@agentskit/ink'
import type { AdapterFactory } from '@agentskit/ink'

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
            await new Promise(r => setTimeout(r, 45))
            yield { type: 'text' as const, content: chunk }
          }
          yield { type: 'done' as const }
        },
        abort: () => { cancelled = true },
      }
    },
  }
}

function App() {
  const chat = useChat({
    adapter: createDemoAdapter(),
    systemPrompt: 'You are a helpful terminal assistant.',
  })

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">AgentsKit Terminal Chat</Text>
      <ChatContainer>
        {chat.messages.map(msg => (
          <Message key={msg.id} message={msg} />
        ))}
      </ChatContainer>
      <ThinkingIndicator visible={chat.status === 'streaming'} />
      <InputBar chat={chat} placeholder="Type and press Enter..." />
    </Box>
  )
}

render(<App />)
```

## Swap to a real provider

```tsx
import { anthropic } from '@agentskit/adapters'

const chat = useChat({
  adapter: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-sonnet-4-6' }),
})
```

## Keyboard navigation

`InputBar` uses Ink's `useInput` hook. The following keys are handled automatically:

| Key | Action |
|---|---|
| Any character | Appended to input |
| `Enter` | Send message |
| `Backspace` / `Delete` | Remove last character |
| `Ctrl+C` | Exit (Ink default) |

Input is disabled while `chat.status === 'streaming'`.

## Terminal colours

`Message` applies a fixed colour per role using Ink's `color` prop:

| Role | Colour |
|---|---|
| `assistant` | `cyan` |
| `user` | `green` |
| `system` | `yellow` |
| `tool` | `magenta` |

`ToolCallView` renders in a rounded box with magenta text. `ThinkingIndicator` renders in yellow.

## Differences from @agentskit/react

| Feature | `@agentskit/react` | `@agentskit/ink` |
|---|---|---|
| Renderer | DOM | Ink (terminal) |
| Theme / CSS | `data-ak-*` + CSS variables | Terminal colours |
| `Markdown` component | Yes | No |
| `CodeBlock` component | Yes | No |
| `useStream` hook | Yes | No |
| `useReactive` hook | Yes | No |
| `InputBar` multiline | Shift+Enter | No (single line) |

## Related

- [@agentskit/react](./react.md)
- [Components reference](./components.md)
