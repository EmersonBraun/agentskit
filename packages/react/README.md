# @agentskit/react

React hooks and headless UI components for [AgentsKit](https://github.com/EmersonBraun/agentskit).

## Install

```bash
npm install @agentskit/react @agentskit/adapters
```

## Quick example

```tsx
import { useChat, ChatContainer, Message, InputBar } from '@agentskit/react'
import { anthropic } from '@agentskit/adapters'
import '@agentskit/react/theme'

function Chat() {
  const chat = useChat({
    adapter: anthropic({ apiKey: 'your-key', model: 'claude-sonnet-4-6' }),
  })
  return (
    <ChatContainer>
      {chat.messages.map(msg => <Message key={msg.id} message={msg} />)}
      <InputBar chat={chat} />
    </ChatContainer>
  )
}
```

## Hooks

- `useChat` — full chat with streaming, tools, memory
- `useStream` — low-level stream consumption
- `useReactive` — reactive state from external store

## Components

`ChatContainer`, `Message`, `InputBar`, `Markdown`, `CodeBlock`, `ToolCallView`, `ThinkingIndicator` — all headless with `data-ak-*` attributes. Optional theme via `@agentskit/react/theme`.

## Docs

[Full documentation](https://emersonbraun.github.io/agentskit/)
