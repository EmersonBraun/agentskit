import { describe, expect, it, vi } from 'vitest'
import { createAutoSummarizingMemory } from '../src/auto-summarize'
import { createInMemoryMemory } from '../src/memory'
import type { Message } from '../src/types/message'

function msg(role: Message['role'], content: string, id = `${role}-${content.length}`): Message {
  return { id, role, content, status: 'complete', createdAt: new Date(0) }
}

describe('createAutoSummarizingMemory', () => {
  it('passes through when under budget', async () => {
    const backing = createInMemoryMemory()
    const summarizer = vi.fn(async () => msg('system', 'summary'))
    const mem = createAutoSummarizingMemory(backing, { maxTokens: 10_000, summarizer })
    await mem.save([msg('user', 'hi'), msg('assistant', 'hey')])
    expect(summarizer).not.toHaveBeenCalled()
    const loaded = await mem.load()
    expect(loaded).toHaveLength(2)
  })

  it('summarizes oldest messages once over budget', async () => {
    const backing = createInMemoryMemory()
    const summarizer = vi.fn(async dropped => msg('system', `summary-of-${dropped.length}`, 'sum1'))
    const mem = createAutoSummarizingMemory(backing, {
      maxTokens: 80,
      keepRecent: 2,
      summarizer,
    })
    const big = 'x'.repeat(400)
    await mem.save([
      msg('user', big),
      msg('assistant', big),
      msg('user', big),
      msg('assistant', 'recent'),
    ])
    expect(summarizer).toHaveBeenCalledTimes(1)
    const out = await mem.load()
    expect(out[0]!.content).toContain('summary-of-')
    expect(out[out.length - 1]!.content).toBe('recent')
  })

  it('existing summary metadata is preserved and not re-summarized', async () => {
    const backing = createInMemoryMemory()
    const summarizer = vi.fn(async () => msg('system', 'new summary'))
    const mem = createAutoSummarizingMemory(backing, {
      maxTokens: 50,
      keepRecent: 2,
      summarizer,
    })
    const big = 'x'.repeat(400)
    const existingSummary: Message = {
      ...msg('system', 'prior', 'prior-sum'),
      metadata: { agentskitSummary: true },
    }
    await mem.save([
      existingSummary,
      msg('user', big),
      msg('assistant', big),
      msg('user', 'now'),
    ])
    const loaded = await mem.load()
    expect(loaded.find(m => m.id === 'prior-sum')).toBeDefined()
    const fresh = loaded.find(m => m.content === 'new summary')
    expect(fresh?.metadata?.agentskitSummary).toBe(true)
  })

  it('onCompact fires with droppedCount and token delta', async () => {
    const backing = createInMemoryMemory()
    const onCompact = vi.fn()
    const mem = createAutoSummarizingMemory(backing, {
      maxTokens: 50,
      keepRecent: 1,
      summarizer: async () => msg('system', 'S'),
      onCompact,
    })
    const big = 'x'.repeat(400)
    await mem.save([msg('user', big), msg('assistant', big), msg('user', 'now')])
    expect(onCompact).toHaveBeenCalledOnce()
    const info = onCompact.mock.calls[0]![0]
    expect(info.droppedCount).toBeGreaterThan(0)
    expect(info.afterTokens).toBeLessThan(info.beforeTokens)
  })

  it('keepRecent protects most recent turns', async () => {
    const backing = createInMemoryMemory()
    const mem = createAutoSummarizingMemory(backing, {
      maxTokens: 50,
      keepRecent: 3,
      summarizer: async () => msg('system', 'S'),
    })
    const big = 'x'.repeat(400)
    await mem.save([
      msg('user', big),
      msg('user', 'keep-1'),
      msg('assistant', 'keep-2'),
      msg('user', 'keep-3'),
    ])
    const out = await mem.load()
    expect(out.slice(-3).map(m => m.content)).toEqual(['keep-1', 'keep-2', 'keep-3'])
  })

  it('clear delegates to backing', async () => {
    const backing = createInMemoryMemory([msg('user', 'x')])
    const mem = createAutoSummarizingMemory(backing, {
      maxTokens: 100,
      summarizer: async () => msg('system', 'x'),
    })
    await mem.clear?.()
    expect(await backing.load()).toHaveLength(0)
  })

  it('load returns whatever backing has', async () => {
    const backing = createInMemoryMemory([msg('user', 'a')])
    const mem = createAutoSummarizingMemory(backing, {
      maxTokens: 100,
      summarizer: async () => msg('system', 'x'),
    })
    expect(await mem.load()).toHaveLength(1)
  })

  it('no-op when only droppable messages are already summaries', async () => {
    const backing = createInMemoryMemory()
    const summarizer = vi.fn(async () => msg('system', 'new'))
    const mem = createAutoSummarizingMemory(backing, {
      maxTokens: 10,
      keepRecent: 1,
      summarizer,
    })
    const big = 'x'.repeat(400)
    const onlySummaries: Message = { ...msg('system', big, 's1'), metadata: { agentskitSummary: true } }
    const onlySummaries2: Message = { ...msg('system', big, 's2'), metadata: { agentskitSummary: true } }
    await mem.save([onlySummaries, onlySummaries2, msg('user', 'now')])
    expect(summarizer).not.toHaveBeenCalled()
  })
})
