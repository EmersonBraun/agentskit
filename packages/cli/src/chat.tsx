import React, { useMemo } from 'react'
import { Box, Text } from 'ink'
import { createFileMemory } from '@agentskit/core'
import { ChatContainer, InputBar, Message, ThinkingIndicator, ToolCallView, useChat } from '@agentskit/ink'
import { resolveChatProvider } from './providers'

export interface ChatCommandOptions {
  provider: string
  model?: string
  system?: string
  memoryPath?: string
  apiKey?: string
  baseUrl?: string
}

export function ChatApp(options: ChatCommandOptions) {
  const adapter = useMemo(
    () => resolveChatProvider(options).adapter,
    [options.apiKey, options.baseUrl, options.model, options.provider]
  )
  const memory = useMemo(
    () => createFileMemory(options.memoryPath ?? '.agentskit-history.json'),
    [options.memoryPath]
  )

  const chat = useChat({
    adapter,
    memory,
    systemPrompt: options.system,
  })

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        AgentsKit CLI
      </Text>
      <Text dimColor>
        Press Enter to send. Live providers use env vars or --api-key, and demo mode stays available for zero-config usage.
      </Text>
      <ChatContainer>
        {chat.messages.map(message => (
          <Box key={message.id} flexDirection="column" marginBottom={1}>
            <Message message={message} />
            {message.toolCalls?.map(toolCall => (
              <ToolCallView key={toolCall.id} toolCall={toolCall} />
            ))}
          </Box>
        ))}
      </ChatContainer>
      <ThinkingIndicator visible={chat.status === 'streaming'} />
      <InputBar chat={chat} placeholder="Type a message and press Enter..." />
    </Box>
  )
}

export function renderChatHeader(options: ChatCommandOptions): string {
  const runtime = resolveChatProvider(options)
  return `provider=${runtime.provider}${runtime.model ? ` model=${runtime.model}` : ''} mode=${runtime.mode}`
}
