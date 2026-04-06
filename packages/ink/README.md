# @agentskit/ink

Terminal UI components using [Ink](https://github.com/vadimdemedes/ink) for [AgentsKit](https://github.com/EmersonBraun/agentskit).

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

## Components

`ChatContainer`, `Message`, `InputBar`, `ToolCallView`, `ThinkingIndicator` — terminal equivalents of the React package with keyboard navigation and ANSI theming.

## Docs

[Full documentation](https://emersonbraun.github.io/agentskit/)
