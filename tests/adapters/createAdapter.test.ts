import { describe, it, expect, vi } from 'vitest'
import { createAdapter } from '../../src/adapters/createAdapter'

describe('createAdapter', () => {
  it('creates an AdapterFactory from send/parse/abort functions', () => {
    const send = vi.fn().mockResolvedValue(new ReadableStream())
    const parse = vi.fn()
    const abort = vi.fn()

    const adapter = createAdapter({ send, parse, abort })
    expect(adapter).toHaveProperty('createSource')
    expect(typeof adapter.createSource).toBe('function')
  })

  it('createSource returns a StreamSource with stream and abort', () => {
    const send = vi.fn().mockResolvedValue(new ReadableStream())
    const parse = vi.fn(async function* () { yield { type: 'done' as const } })
    const abort = vi.fn()

    const adapter = createAdapter({ send, parse, abort })
    const source = adapter.createSource([])
    expect(typeof source.stream).toBe('function')
    expect(typeof source.abort).toBe('function')
  })
})
