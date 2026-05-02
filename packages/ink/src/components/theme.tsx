import React, { createContext, useContext } from 'react'
import type { MessageRole, ToolCallStatus } from '@agentskit/core'

export interface InkTheme {
  roles: Record<MessageRole, { icon: string; label: string; color: string }>
  toolStatus: Record<ToolCallStatus, { icon: string; color: string; label: string }>
  prompt: { active: string; busy: string }
  inputText: { active: string; busy: string }
  header: { border: string; title: string }
  usage: { prompt: string; completion: string }
  segment: {
    provider: string
    model: string
    modeLive: string
    modeDemo: string
    tools: string
    muted: string
  }
}

export const defaultInkTheme: InkTheme = {
  roles: {
    user: { icon: '❯', label: 'you', color: 'green' },
    assistant: { icon: '✦', label: 'assistant', color: 'cyan' },
    system: { icon: '◆', label: 'system', color: 'yellow' },
    tool: { icon: '⚙', label: 'tool', color: 'magenta' },
  },
  toolStatus: {
    pending: { icon: '○', color: 'gray', label: 'pending' },
    running: { icon: '⠋', color: 'cyan', label: 'running' },
    complete: { icon: '✓', color: 'green', label: 'complete' },
    error: { icon: '✗', color: 'red', label: 'error' },
    requires_confirmation: { icon: '?', color: 'yellow', label: 'requires_confirmation' },
  },
  prompt: { active: 'cyan', busy: 'gray' },
  inputText: { active: 'white', busy: 'gray' },
  header: { border: 'cyan', title: 'cyan' },
  usage: { prompt: 'green', completion: 'yellow' },
  segment: {
    provider: 'cyan',
    model: 'magenta',
    modeLive: 'green',
    modeDemo: 'yellow',
    tools: 'blue',
    muted: 'gray',
  },
}

const ThemeContext = createContext<InkTheme>(defaultInkTheme)

export function InkThemeProvider({
  theme,
  children,
}: {
  theme?: Partial<InkTheme>
  children: React.ReactNode
}) {
  const merged: InkTheme = theme ? { ...defaultInkTheme, ...theme } : defaultInkTheme
  return <ThemeContext.Provider value={merged}>{children}</ThemeContext.Provider>
}

export function useInkTheme(): InkTheme {
  return useContext(ThemeContext)
}
