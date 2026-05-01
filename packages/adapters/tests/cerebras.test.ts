import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cerebras, cerebrasAdapter } from '../src/cerebras'

interface Capture { url?: string; body?: unknown; authorization?: string }

let originalFetch: typeof globalThis.fetch
beforeEach(() => { originalFetch = globalThis.fetch })
afterEach(() => { globalThis.fetch = originalFetch })

function mockFetch(cap: Capture): void {
  globalThis.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    cap.url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
    cap.body = init?.body
    const headers = init?.headers as Record<string, string> | undefined
    cap.authorization = headers?.authorization ?? headers?.Authorization
    throw new Error('stub')
  }) as typeof globalThis.fetch
}

async function drain(factory: ReturnType<typeof cerebras>): Promise<void> {
  const source = factory.createSource({
    messages: [{ id: '1', role: 'user', content: 'hi', status: 'complete', createdAt: new Date(0) }],
  })
  const iter = source.stream()[Symbol.asyncIterator]()
  try { while (!(await iter.next()).done) { /* drain */ } } catch { /* expected */ }
}

describe('cerebrasAdapter', () => {
  it('declares capabilities', () => {
    expect(cerebras({ apiKey: 'k' }).capabilities).toEqual({ streaming: true, tools: true, usage: true })
  })

  it('exports as cerebrasAdapter alias', () => {
    expect(cerebrasAdapter).toBe(cerebras)
  })

  it('targets api.cerebras.ai by default', async () => {
    const cap: Capture = {}
    mockFetch(cap)
    await drain(cerebras({ apiKey: 'k' }))
    expect(cap.url).toContain('https://api.cerebras.ai/v1')
  })

  it('defaults to llama-3.3-70b', async () => {
    const cap: Capture = {}
    mockFetch(cap)
    await drain(cerebras({ apiKey: 'k' }))
    expect((JSON.parse(String(cap.body)) as { model: string }).model).toBe('llama-3.3-70b')
  })

  it('honours model override', async () => {
    const cap: Capture = {}
    mockFetch(cap)
    await drain(cerebras({ apiKey: 'k', model: 'qwen3-32b' }))
    expect((JSON.parse(String(cap.body)) as { model: string }).model).toBe('qwen3-32b')
  })

  it('passes API key as Bearer', async () => {
    const cap: Capture = {}
    mockFetch(cap)
    await drain(cerebras({ apiKey: 'csk_test' }))
    expect(cap.authorization).toBe('Bearer csk_test')
  })
})
