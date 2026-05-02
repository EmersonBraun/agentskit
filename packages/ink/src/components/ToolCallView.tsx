import React, { useEffect, useState } from 'react'
import { Box, Text } from 'ink'
import type { ToolCall } from '@agentskit/core'
import { useInkTheme } from './theme'

export interface ToolCallViewProps {
  toolCall: ToolCall
  expanded?: boolean
  /** Max characters rendered from result/error. Default 500. */
  resultPreviewChars?: number
  /** Max characters rendered from args. Default 120. */
  argsPreviewChars?: number
}

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}

function previewArgs(args: unknown, max: number): string {
  try {
    const serialized = typeof args === 'string' ? args : JSON.stringify(args)
    return truncate(serialized ?? '', max)
  } catch {
    return '[unserializable]'
  }
}

export function ToolCallView({
  toolCall,
  expanded = false,
  resultPreviewChars = 500,
  argsPreviewChars = 120,
}: ToolCallViewProps) {
  const theme = useInkTheme()
  const meta = theme.toolStatus[toolCall.status] ?? theme.toolStatus.pending
  const [frame, setFrame] = useState(0)
  const isRunning = toolCall.status === 'running'

  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(() => setFrame(f => (f + 1) % SPINNER.length), 80)
    return () => clearInterval(id)
  }, [isRunning])

  const icon = isRunning ? SPINNER[frame] : meta.icon

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={meta.color} paddingX={1}>
      <Box>
        <Text color={meta.color} bold>
          {icon} {toolCall.name}
        </Text>
        <Text dimColor>  · {meta.label}</Text>
      </Box>

      {expanded ? (
        <Box flexDirection="column" marginTop={0}>
          <Text dimColor>args: {previewArgs(toolCall.args, argsPreviewChars)}</Text>
          {toolCall.result ? (
            <Text>{truncate(toolCall.result, resultPreviewChars)}</Text>
          ) : null}
          {toolCall.error ? (
            <Text color={theme.toolStatus.error.color}>{truncate(toolCall.error, resultPreviewChars)}</Text>
          ) : null}
        </Box>
      ) : null}
    </Box>
  )
}
