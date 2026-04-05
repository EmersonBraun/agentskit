import React from 'react'
import { render, Box, Text } from 'ink'
import { ChatContainer, InputBar, Message, ThinkingIndicator, useChat } from '@agentskit/ink'
import type { AdapterFactory } from '@agentskit/ink'

function createDemoAdapter(): AdapterFactory {
  return {
    createSource: ({ messages }) => {
      let cancelled = false

      return {
        stream: async function* () {
          const lastUser = [...messages].reverse().find(message => message.role === 'user')
          const text = [
            'This is the official Ink example app.',
            'It reuses the same core controller as the React package.',
            `Latest prompt: "${lastUser?.content ?? ''}"`,
          ].join(' ')

          for (const chunk of text.match(/.{1,20}/g) ?? []) {
            if (cancelled) return
            await new Promise(resolve => setTimeout(resolve, 45))
            yield { type: 'text' as const, content: chunk }
          }

          yield { type: 'done' as const }
        },
        abort: () => {
          cancelled = true
        },
      }
    },
  }
}

function App() {
  const chat = useChat({
    adapter: createDemoAdapter(),
    systemPrompt: 'You are the AgentsKit Ink example assistant.',
  })

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">AgentsKit Ink Example</Text>
      <Text dimColor>Shared core, terminal renderer, local demo adapter.</Text>
      <ChatContainer>
        {chat.messages.map(message => (
          <Message key={message.id} message={message} />
        ))}
      </ChatContainer>
      <ThinkingIndicator visible={chat.status === 'streaming'} />
      <InputBar chat={chat} placeholder="Type in the terminal and press Enter..." />
    </Box>
  )
}

render(<App />)
