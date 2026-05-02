import React from 'react'
import { Box, Text } from 'ink'
import { useInkTheme } from './theme'

export interface StatusHeaderProps {
  title?: string
  provider?: string
  model?: string
  tools?: string[]
  mode?: 'demo' | 'live'
  messageCount?: number
  sessionId?: string
}

export function StatusHeader({
  title = 'AgentsKit CLI',
  provider,
  model,
  tools,
  mode,
  messageCount,
  sessionId,
}: StatusHeaderProps) {
  const theme = useInkTheme()
  const segments: Array<{ label: string; value: string; color?: string }> = []

  if (provider) segments.push({ label: 'provider', value: provider, color: theme.segment.provider })
  if (model) segments.push({ label: 'model', value: model, color: theme.segment.model })
  if (mode) segments.push({ label: 'mode', value: mode, color: mode === 'live' ? theme.segment.modeLive : theme.segment.modeDemo })
  if (tools && tools.length > 0) {
    segments.push({ label: 'tools', value: tools.join(','), color: theme.segment.tools })
  }
  if (typeof messageCount === 'number') {
    segments.push({ label: 'msgs', value: String(messageCount), color: theme.segment.muted })
  }
  if (sessionId) {
    segments.push({ label: 'session', value: sessionId.slice(0, 12), color: theme.segment.muted })
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.header.border} paddingX={1}>
      <Text color={theme.header.title} bold>
        ✦ {title}
      </Text>
      {segments.length > 0 ? (
        <Text wrap="truncate-end">
          {segments.map((seg, i) => (
            <React.Fragment key={seg.label}>
              {i > 0 ? <Text dimColor>  ·  </Text> : null}
              <Text dimColor>{seg.label}=</Text>
              <Text color={seg.color ?? 'white'}>{seg.value}</Text>
            </React.Fragment>
          ))}
        </Text>
      ) : null}
    </Box>
  )
}
