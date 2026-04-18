import { describe, expect, it } from 'vitest'
import type { AdapterFactory, AdapterRequest, StreamChunk } from '@agentskit/core'
import { speculate } from '../src/speculate'

function req(text: string): AdapterRequest {
  return {
    messages: [
      { id: '1', role: 'user', content: text, status: 'complete', createdAt: new Date(0) },
    ],
  }
}

function adapter(
  chunks: StreamChunk[],
  opts: { delayMs?: number; onAbort?: () => void; throwAfter?: number } = {},
): AdapterFactory {
  return {
    createSource: () => {
      let aborted = false
      return {
        abort: () => {
          aborted = true
          opts.onAbort?.()
        },
        stream: async function* () {
          let i = 0
          for (const c of chunks) {
            if (aborted) return
            if (opts.delayMs !== undefined) {
              await new Promise(r => setTimeout(r, opts.delayMs))
            }
            if (opts.throwAfter !== undefined && i >= opts.throwAfter) {
              throw new Error('boom')
            }
            i++
            yield c
          }
        },
      }
    },
  }
}

describe('speculate', () => {
  it('picks first successful candidate by default', async () => {
    const fast = adapter([{ type: 'text', content: 'fast' }, { type: 'done' }], { delayMs: 0 })
    const slow = adapter([{ type: 'text', content: 'slow' }, { type: 'done' }], { delayMs: 50 })

    const r = await speculate({
      candidates: [
        { id: 'fast', adapter: fast },
        { id: 'slow', adapter: slow },
      ],
      request: req('hi'),
    })
    expect(r.winner.id).toBe('fast')
    expect(r.losers.map(l => l.id)).toContain('slow')
    expect(r.all).toHaveLength(2)
  })

  it('aborts losers when first finishes (abortOnLoser default true)', async () => {
    let slowAborted = false
    const fast = adapter([{ type: 'text', content: 'a' }, { type: 'done' }])
    const slow = adapter([{ type: 'text', content: 'b' }, { type: 'done' }], {
      delayMs: 50,
      onAbort: () => {
        slowAborted = true
      },
    })
    await speculate({
      candidates: [
        { id: 'f', adapter: fast },
        { id: 's', adapter: slow },
      ],
      request: req('x'),
    })
    expect(slowAborted).toBe(true)
  })

  it('does not abort losers when abortOnLoser is false', async () => {
    let slowAborted = false
    const fast = adapter([{ type: 'text', content: 'a' }, { type: 'done' }])
    const slow = adapter([{ type: 'text', content: 'b' }, { type: 'done' }], {
      delayMs: 20,
      onAbort: () => {
        slowAborted = true
      },
    })
    await speculate({
      candidates: [
        { id: 'f', adapter: fast },
        { id: 's', adapter: slow, abortOnLoser: false },
      ],
      request: req('x'),
    })
    expect(slowAborted).toBe(false)
  })

  it('longest picker wins by output length', async () => {
    const a = adapter([
      { type: 'text', content: 'hi' },
      { type: 'done' },
    ])
    const b = adapter([
      { type: 'text', content: 'hello world' },
      { type: 'done' },
    ])
    const r = await speculate({
      candidates: [
        { id: 'a', adapter: a },
        { id: 'b', adapter: b },
      ],
      request: req('x'),
      pick: 'longest',
    })
    expect(r.winner.id).toBe('b')
  })

  it('custom picker receives all results', async () => {
    const a = adapter([{ type: 'text', content: 'x' }, { type: 'done' }])
    const b = adapter([{ type: 'text', content: 'y' }, { type: 'done' }])
    const r = await speculate({
      candidates: [
        { id: 'a', adapter: a },
        { id: 'b', adapter: b },
      ],
      request: req('q'),
      pick: async results => {
        expect(results).toHaveLength(2)
        return 'b'
      },
    })
    expect(r.winner.id).toBe('b')
  })

  it('rejects empty candidate list', async () => {
    await expect(speculate({ candidates: [], request: req('x') })).rejects.toThrow(/at least one/)
  })

  it('all-failed rejects with error', async () => {
    const bad = adapter([{ type: 'done' }], { throwAfter: 0 })
    await expect(
      speculate({
        candidates: [{ id: 'a', adapter: bad }, { id: 'b', adapter: bad }],
        request: req('x'),
      }),
    ).rejects.toThrow(/all speculative candidates failed/)
  })

  it('tolerates one failing candidate when another succeeds (first picker)', async () => {
    const bad = adapter([{ type: 'done' }], { throwAfter: 0 })
    const ok = adapter([{ type: 'text', content: 'ok' }, { type: 'done' }], { delayMs: 5 })
    const r = await speculate({
      candidates: [{ id: 'bad', adapter: bad }, { id: 'ok', adapter: ok }],
      request: req('x'),
    })
    expect(r.winner.id).toBe('ok')
  })

  it('timeoutMs aborts a slow candidate', async () => {
    const slow = adapter(
      [
        { type: 'text', content: 'too slow' },
        { type: 'done' },
      ],
      { delayMs: 200 },
    )
    const ok = adapter([{ type: 'text', content: 'ok' }, { type: 'done' }])
    const r = await speculate({
      candidates: [{ id: 'slow', adapter: slow }, { id: 'ok', adapter: ok }],
      request: req('x'),
      timeoutMs: 10,
    })
    expect(r.winner.id).toBe('ok')
    const slowResult = r.all.find(x => x.id === 'slow')!
    expect(slowResult.error?.message).toMatch(/timeout|aborted/i)
  })

  it('custom picker rejects on unknown id', async () => {
    const a = adapter([{ type: 'done' }])
    await expect(
      speculate({
        candidates: [{ id: 'a', adapter: a }],
        request: req('x'),
        pick: () => 'nope',
      }),
    ).rejects.toThrow(/unknown id/)
  })
})
