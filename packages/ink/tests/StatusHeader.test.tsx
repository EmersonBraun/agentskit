import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { StatusHeader } from '../src/components/StatusHeader'

describe('StatusHeader', () => {
  it('renders default title when no props are given', () => {
    const { lastFrame } = render(<StatusHeader />)
    expect(lastFrame()).toContain('AgentsKit CLI')
  })

  it('renders custom title', () => {
    const { lastFrame } = render(<StatusHeader title="Demo" />)
    expect(lastFrame()).toContain('Demo')
  })

  it('renders provider, model, and tools segments', () => {
    const { lastFrame } = render(
      <StatusHeader
        provider="openai"
        model="gpt-4o-mini"
        tools={['web_search', 'fetch_url']}
        mode="live"
        messageCount={4}
      />,
    )
    const output = lastFrame()
    expect(output).toContain('provider=')
    expect(output).toContain('openai')
    expect(output).toContain('model=')
    expect(output).toContain('gpt-4o-mini')
    expect(output).toContain('tools=')
    expect(output).toContain('web_search,fetch_url')
    expect(output).toContain('mode=')
    expect(output).toContain('live')
    expect(output).toContain('msgs=')
    expect(output).toContain('4')
  })

  it('renders session id truncated to 12 chars', () => {
    const { lastFrame } = render(
      <StatusHeader sessionId="2026-04-17T23-50-00-abcdef" />,
    )
    const output = lastFrame()
    expect(output).toContain('session=')
    expect(output).toContain('2026-04-17T2')
    expect(output).not.toContain('abcdef')
  })

  it('renders mode in different colors per value', () => {
    const live = render(<StatusHeader mode="live" />).lastFrame()
    const demo = render(<StatusHeader mode="demo" />).lastFrame()
    expect(live).toContain('live')
    expect(demo).toContain('demo')
  })

  it('omits optional segments when their values are absent', () => {
    const { lastFrame } = render(<StatusHeader provider="openai" />)
    const output = lastFrame()
    expect(output).toContain('provider=')
    expect(output).not.toContain('model=')
    expect(output).not.toContain('tools=')
    expect(output).not.toContain('session=')
  })
})
