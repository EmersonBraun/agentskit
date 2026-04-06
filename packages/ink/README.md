# @agentskit/ink

Build terminal AI chat interfaces with the exact same API as `@agentskit/react`.

## Why

- **No context switching** — if you know `@agentskit/react`, you already know this; same hooks, same component names, different renderer
- **Real terminal UX** — keyboard navigation, ANSI colors, and proper TTY streaming so your CLI feels native, not like a web app in a box
- **Any local or cloud model** — pair with Ollama for fully offline CLI tools, or any other provider via `@agentskit/adapters`

## Install

```bash
npm install @agentskit/ink @agentskit/adapters
```

## Quick example

```tsx
import React from 'react'
import { render } from 'ink'
import { ChatContainer, InputBar, Message, useChat } from '@agentskit/ink'
import { ollama } from '@agentskit/adapters'

function App() {
  const chat = useChat({ adapter: ollama({ model: 'llama3.1' }) })
  return (
    <ChatContainer>
      {chat.messages.map(msg => <Message key={msg.id} message={msg} />)}
      <InputBar chat={chat} />
    </ChatContainer>
  )
}

render(<App />)
```

## Docs

[Full documentation](https://emersonbraun.github.io/agentskit/)
