# React Arrow

> A hooks-first React library for the agentic era. Inspired by [Arrow.js](https://arrow-js.com/).

React Arrow provides a minimal, agent-friendly API for building AI chat interfaces with streaming support in React.

## Install

```bash
npm install react-arrow
```

## Quick Start

```tsx
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
```

## Core API

| Hook | Purpose |
|------|---------|
| `useStream(source)` | Consume any async stream reactively |
| `useReactive(state)` | Proxy-based fine-grained reactive state |
| `useChat(config)` | Full chat session management |

## License

MIT
