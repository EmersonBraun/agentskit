import React from 'react'
import { Box, Text } from 'ink'
import type { Message as MessageType } from '@agentskit/core'

export interface MessageProps {
  message: MessageType
}

function roleColor(role: MessageType['role']) {
  switch (role) {
    case 'assistant':
      return 'cyan'
    case 'user':
      return 'green'
    case 'system':
      return 'yellow'
    case 'tool':
      return 'magenta'
    default:
      return 'white'
  }
}

export function Message({ message }: MessageProps) {
  return (
    <Box flexDirection="column">
      <Text bold color={roleColor(message.role)}>
        {message.role.toUpperCase()}
      </Text>
      <Text>{message.content || (message.status === 'streaming' ? '...' : '')}</Text>
    </Box>
  )
}
