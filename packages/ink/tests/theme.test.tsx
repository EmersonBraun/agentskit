import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { InkThemeProvider, useInkTheme, defaultInkTheme } from '../src/components/theme'

function Probe() {
  const theme = useInkTheme()
  return <Text>{`role-user=${theme.roles.user.color}|prompt=${theme.prompt.active}|header=${theme.header.border}`}</Text>
}

describe('Ink theme', () => {
  it('exposes default colors when no provider wraps consumer', () => {
    const { lastFrame } = render(<Probe />)
    expect(lastFrame()).toContain('role-user=green')
    expect(lastFrame()).toContain('prompt=cyan')
    expect(lastFrame()).toContain('header=cyan')
  })

  it('merges partial overrides with defaults via InkThemeProvider', () => {
    const { lastFrame } = render(
      <InkThemeProvider theme={{ prompt: { active: 'magenta', busy: 'gray' } }}>
        <Probe />
      </InkThemeProvider>,
    )
    expect(lastFrame()).toContain('prompt=magenta')
    // unrelated keys still come from defaults
    expect(lastFrame()).toContain('role-user=green')
    expect(lastFrame()).toContain('header=cyan')
  })

  it('defaultInkTheme covers every MessageRole and ToolCallStatus', () => {
    expect(Object.keys(defaultInkTheme.roles).sort()).toEqual(
      ['assistant', 'system', 'tool', 'user'],
    )
    expect(Object.keys(defaultInkTheme.toolStatus).sort()).toEqual(
      ['complete', 'error', 'pending', 'requires_confirmation', 'running'],
    )
  })
})
