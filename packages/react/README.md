# @agentskit/react

Add streaming AI chat to any React app in 10 lines of code.

## Why

- **Ship faster** — streaming chat with tool calls, memory, and markdown rendering works out of the box, no wiring required
- **Works with your design system** — completely headless; style it with Tailwind, MUI, shadcn, or plain CSS via `data-ak-*` attributes
- **Agent-ready by default** — built-in support for tool calls, thinking indicators, and multi-turn memory so you never hit a wall as your product grows

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
    adapter: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-sonnet-4-6' }),
  })
  return (
    <ChatContainer>
      {chat.messages.map(msg => <Message key={msg.id} message={msg} />)}
      <InputBar chat={chat} />
    </ChatContainer>
  )
}
```

## Docs

[Full documentation](https://emersonbraun.github.io/agentskit/)
