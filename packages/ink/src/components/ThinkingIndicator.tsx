import React from 'react'
import { Text } from 'ink'

export interface ThinkingIndicatorProps {
  visible: boolean
  label?: string
}

export function ThinkingIndicator({ visible, label = 'Thinking...' }: ThinkingIndicatorProps) {
  if (!visible) return null
  return <Text color="yellow">{label}</Text>
}
