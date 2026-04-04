import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import type { ToolCall } from '@agentskit/core'

export interface ToolCallViewProps {
  toolCall: ToolCall
}

export function ToolCallView({ toolCall }: ToolCallViewProps) {
  const [expanded, setExpanded] = useState(false)

  useInput((input) => {
    if (input.toLowerCase() === 't') {
      setExpanded(current => !current)
    }
  })

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text color="magenta">
        Tool: {toolCall.name} [{toolCall.status}]
      </Text>
      {expanded ? (
        <>
          <Text dimColor>{JSON.stringify(toolCall.args)}</Text>
          {toolCall.result ? <Text>{toolCall.result}</Text> : null}
          {toolCall.error ? <Text color="red">{toolCall.error}</Text> : null}
        </>
      ) : (
        <Text dimColor>Press "t" to toggle tool details.</Text>
      )}
    </Box>
  )
}
