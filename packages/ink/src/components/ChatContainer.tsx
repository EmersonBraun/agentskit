import React, { type ReactNode } from 'react'
import { Box } from 'ink'

export interface ChatContainerProps {
  children: ReactNode
}

export function ChatContainer({ children }: ChatContainerProps) {
  return (
    <Box flexDirection="column" gap={1}>
      {children}
    </Box>
  )
}
