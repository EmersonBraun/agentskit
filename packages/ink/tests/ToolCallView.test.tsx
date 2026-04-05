import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { ToolCallView } from '../src/components/ToolCallView'
import type { ToolCall } from '@agentskit/core'

const baseToolCall: ToolCall = {
  id: 'tc-1',
  name: 'weather',
  args: { city: 'São Paulo' },
  status: 'complete',
  result: 'Sunny, 28°C',
}

describe('ToolCallView', () => {
  it('renders tool name and status', () => {
    const { lastFrame } = render(<ToolCallView toolCall={baseToolCall} />)
    const output = lastFrame()
    expect(output).toContain('weather')
    expect(output).toContain('complete')
  })

  it('hides args and result when not expanded', () => {
    const { lastFrame } = render(<ToolCallView toolCall={baseToolCall} />)
    const output = lastFrame()
    expect(output).not.toContain('São Paulo')
    expect(output).not.toContain('Sunny')
  })

  it('shows args and result when expanded', () => {
    const { lastFrame } = render(<ToolCallView toolCall={baseToolCall} expanded />)
    const output = lastFrame()
    expect(output).toContain('São Paulo')
    expect(output).toContain('Sunny, 28°C')
  })

  it('shows error when expanded and tool errored', () => {
    const errorCall: ToolCall = {
      ...baseToolCall,
      status: 'error',
      result: undefined,
      error: 'API timeout',
    }
    const { lastFrame } = render(<ToolCallView toolCall={errorCall} expanded />)
    const output = lastFrame()
    expect(output).toContain('API timeout')
    expect(output).toContain('error')
  })

  it('shows pending status', () => {
    const pendingCall: ToolCall = {
      ...baseToolCall,
      status: 'pending',
      result: undefined,
    }
    const { lastFrame } = render(<ToolCallView toolCall={pendingCall} />)
    expect(lastFrame()).toContain('pending')
  })

  it('shows running status', () => {
    const runningCall: ToolCall = {
      ...baseToolCall,
      status: 'running',
      result: undefined,
    }
    const { lastFrame } = render(<ToolCallView toolCall={runningCall} />)
    expect(lastFrame()).toContain('running')
  })
})
