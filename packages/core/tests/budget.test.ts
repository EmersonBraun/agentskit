import { describe, expect, it } from 'vitest'
import { approximateCounter, compileBudget } from '../src/budget'
import type { Message } from '../src/types/message'
import type { ToolDefinition } from '../src/types/tool'

function msg(role: Message['role'], content: string, id = `${role}-${content.length}`): Message {
  return { id, role, content, status: 'complete', createdAt: new Date(0) }
}

describe('approximateCounter', () => {
  it('counts roughly chars / 4 with per-message overhead', () => {
    const n = approximateCounter.count([msg('user', 'hello world')])
    expect(n).toBeGreaterThan(0)
  })

  it('exposes countDetailed with per-message breakdown', () => {
    const r = approximateCounter.countDetailed!([msg('user', 'a'), msg('assistant', 'b')]) as {
      total: number
      perMessage: number[]
    }
    expect(r.perMessage).toHaveLength(2)
    expect(r.total).toBe(r.perMessage.reduce((a, b) => a + b, 0))
  })
})

describe('compileBudget', () => {
  const big = 'x'.repeat(400) // ~100 tokens per message

  it('passes through when messages fit budget', async () => {
    const r = await compileBudget({
      budget: 10_000,
      messages: [msg('user', 'hi'), msg('assistant', 'hey')],
    })
    expect(r.fits).toBe(true)
    expect(r.dropped).toHaveLength(0)
    expect(r.messages).toHaveLength(2)
  })

  it('drops oldest messages until it fits', async () => {
    const r = await compileBudget({
      budget: 250,
      messages: [msg('user', big), msg('assistant', big), msg('user', big), msg('assistant', 'short')],
      strategy: 'drop-oldest',
    })
    expect(r.fits).toBe(true)
    expect(r.dropped.length).toBeGreaterThan(0)
    expect(r.messages[r.messages.length - 1]!.content).toBe('short')
  })

  it('sliding-window trims oldest to fit', async () => {
    const r = await compileBudget({
      budget: 120,
      messages: [msg('user', big), msg('assistant', big), msg('user', 'recent')],
      strategy: 'sliding-window',
      keepRecent: 1,
    })
    expect(r.strategy).toBe('sliding-window')
    expect(r.fits).toBe(true)
    expect(r.dropped.length).toBeGreaterThan(0)
  })

  it('keepRecent protects last turn even when over budget', async () => {
    const r = await compileBudget({
      budget: 50,
      messages: [msg('user', big), msg('assistant', big)],
      keepRecent: 1,
    })
    expect(r.messages).toHaveLength(1)
    expect(r.fits).toBe(false)
  })

  it('summarize strategy folds dropped messages into a summary', async () => {
    const r = await compileBudget({
      budget: 150,
      messages: [msg('user', big), msg('assistant', big), msg('user', 'now')],
      strategy: 'summarize',
      summarizer: dropped => msg('system', `summary of ${dropped.length} msgs`, 'sum'),
    })
    expect(r.messages[0]!.content).toContain('summary of')
    expect(r.dropped.length).toBeGreaterThan(0)
  })

  it('summarize requires a summarizer', async () => {
    await expect(
      compileBudget({
        budget: 10,
        messages: [msg('user', big)],
        strategy: 'summarize',
      }),
    ).rejects.toThrow(/summarizer/)
  })

  it('accounts for system prompt in the floor', async () => {
    const r = await compileBudget({
      budget: 10_000,
      messages: [msg('user', 'hi')],
      systemPrompt: 'You are helpful.',
    })
    expect(r.tokens.system).toBeGreaterThan(0)
    expect(r.tokens.total).toBe(r.tokens.system + r.tokens.messages + r.tokens.tools)
  })

  it('accounts for tool definitions in the floor', async () => {
    const tool: ToolDefinition = {
      name: 'search',
      description: 'search the web',
      schema: { type: 'object' },
      execute: async () => ({ content: '' }),
    }
    const r = await compileBudget({
      budget: 10_000,
      messages: [msg('user', 'hi')],
      tools: [tool],
    })
    expect(r.tokens.tools).toBeGreaterThan(0)
  })

  it('throws when system + tools exceed budget', async () => {
    await expect(
      compileBudget({
        budget: 5,
        messages: [],
        systemPrompt: big,
      }),
    ).rejects.toThrow(/exceed budget/)
  })

  it('throws when reserveForOutput meets or exceeds budget', async () => {
    await expect(
      compileBudget({
        budget: 100,
        messages: [],
        reserveForOutput: 100,
      }),
    ).rejects.toThrow(/exceed reserveForOutput/)
  })

  it('reserveForOutput reduces effective budget', async () => {
    const r = await compileBudget({
      budget: 10_000,
      reserveForOutput: 1_000,
      messages: [msg('user', 'hi')],
    })
    expect(r.tokens.budget).toBe(9_000)
  })

  it('accepts a custom counter', async () => {
    const fixed = {
      name: 'fixed',
      count: () => 10,
    }
    const r = await compileBudget({
      budget: 100,
      counter: fixed,
      messages: [msg('user', 'whatever')],
    })
    expect(r.tokens.messages).toBe(10)
  })

  it('handles async counter', async () => {
    const asyncCounter = {
      name: 'async',
      count: async () => 5,
    }
    const r = await compileBudget({
      budget: 100,
      counter: asyncCounter,
      messages: [msg('user', 'x')],
    })
    expect(r.tokens.messages).toBe(5)
  })
})
