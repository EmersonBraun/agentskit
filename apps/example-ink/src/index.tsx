import React from 'react'
import { render, Box, Text } from 'ink'
import { ChatContainer, InputBar, Message, ThinkingIndicator, ToolCallView, useChat } from '@agentskit/ink'
import { createFileMemory } from '@agentskit/core'
import type { AdapterFactory, ToolDefinition } from '@agentskit/core'

const getTimeTool: ToolDefinition = {
  name: 'get_time',
  description: 'Returns the current time as a string.',
  execute: () => new Date().toLocaleTimeString(),
}

let callCount = 0

function createDemoAdapter(): AdapterFactory {
  return {
    createSource: () => {
      let cancelled = false
      const call = ++callCount

      return {
        stream: async function* () {
          if (call % 3 === 1) {
            yield { type: 'tool_call' as const, toolCall: { id: 'tc1', name: 'get_time', args: '{}' } }
            yield { type: 'done' as const }
          } else if (call % 3 === 2) {
            const chunks = ['The current time has been retrieved. ', 'Is there anything else I can help with?']
            for (const chunk of chunks) {
              if (cancelled) return
              await new Promise(resolve => setTimeout(resolve, 45))
              yield { type: 'text' as const, content: chunk }
            }
            yield { type: 'done' as const }
          } else {
            const chunks = ['This is the AgentsKit Ink example with tools and memory. ', 'Ask me about the time!']
            for (const chunk of chunks) {
              if (cancelled) return
              await new Promise(resolve => setTimeout(resolve, 45))
              yield { type: 'text' as const, content: chunk }
            }
            yield { type: 'done' as const }
          }
        },
        abort: () => { cancelled = true },
      }
    },
  }
}

const memory = createFileMemory('.example-ink-history.json')

function App() {
  const chat = useChat({
    adapter: createDemoAdapter(),
    systemPrompt: 'You are the AgentsKit Ink example assistant.',
    tools: [getTimeTool],
    memory,
  })

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">AgentsKit Ink Example — Tools + Memory</Text>
      <Text dimColor>Shared core, terminal renderer, file memory, demo adapter.</Text>
      <ChatContainer>
        {chat.messages.map(message => (
          <Box key={message.id} flexDirection="column">
            <Message message={message} />
            {message.toolCalls?.map(tc => (
              <ToolCallView key={tc.id} toolCall={tc} expanded />
            ))}
          </Box>
        ))}
      </ChatContainer>
      <ThinkingIndicator visible={chat.status === 'streaming'} />
      <InputBar chat={chat} placeholder="Type in the terminal and press Enter..." />
    </Box>
  )
}

render(<App />)
