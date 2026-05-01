import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { bail, bailAdapter, qwen } from '../src/bail'

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

async function drain(factory: ReturnType<typeof bail>): Promise<void> {
  const source = factory.createSource({
    messages: [{ id: '1', role: 'user', content: 'hi', status: 'complete', createdAt: new Date(0) }],
  })
  const iter = source.stream()[Symbol.asyncIterator]()
  try { while (!(await iter.next()).done) { /* drain */ } } catch { /* expected */ }
}

describe('bailAdapter', () => {
  it('declares capabilities', () => {
    expect(bail({ apiKey: 'k' }).capabilities).toEqual({
      streaming: true, tools: true, multiModal: true, usage: true,
    })
  })

  it('exports as bailAdapter and qwen aliases', () => {
    expect(bailAdapter).toBe(bail)
    expect(qwen).toBe(bail)
  })

  it('targets dashscope compatibility endpoint', async () => {
    const cap: Capture = {}
    mockFetch(cap)
    await drain(bail({ apiKey: 'k' }))
    expect(cap.url).toContain('https://dashscope.aliyuncs.com/compatible-mode/v1')
  })

  it('defaults to qwen-max', async () => {
    const cap: Capture = {}
    mockFetch(cap)
    await drain(bail({ apiKey: 'k' }))
    expect((JSON.parse(String(cap.body)) as { model: string }).model).toBe('qwen-max')
  })

  it('honours model override (qwen-vl-plus)', async () => {
    const cap: Capture = {}
    mockFetch(cap)
    await drain(bail({ apiKey: 'k', model: 'qwen-vl-plus' }))
    expect((JSON.parse(String(cap.body)) as { model: string }).model).toBe('qwen-vl-plus')
  })

  it('passes API key as Bearer', async () => {
    const cap: Capture = {}
    mockFetch(cap)
    await drain(bail({ apiKey: 'sk-bail-test' }))
    expect(cap.authorization).toBe('Bearer sk-bail-test')
  })
})
