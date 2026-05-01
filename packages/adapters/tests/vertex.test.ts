import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { vertex, vertexAdapter } from '../src/vertex'

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

async function drain(factory: ReturnType<typeof vertex>, request?: unknown): Promise<void> {
  const source = factory.createSource((request as never) ?? {
    messages: [{ id: '1', role: 'user', content: 'hi', status: 'complete', createdAt: new Date(0) }],
  })
  const iter = source.stream()[Symbol.asyncIterator]()
  try { while (!(await iter.next()).done) { /* drain */ } } catch { /* expected */ }
}

const baseCfg = {
  project: 'my-gcp-project',
  region: 'us-central1',
  model: 'gemini-2.5-pro',
  accessToken: 'ya29.test-token',
}

describe('vertexAdapter', () => {
  it('declares capabilities (reasoning on pro models)', () => {
    expect(vertex(baseCfg).capabilities).toEqual({
      streaming: true, tools: true, multiModal: true, usage: true, reasoning: true,
    })
  })

  it('reasoning false for non-pro models', () => {
    expect(vertex({ ...baseCfg, model: 'gemini-2.5-flash' }).capabilities?.reasoning).toBe(false)
  })

  it('exports as vertexAdapter alias', () => {
    expect(vertexAdapter).toBe(vertex)
  })

  it('routes to region-aiplatform endpoint with project + model', async () => {
    const cap: Capture = {}
    mockFetch(cap)
    await drain(vertex(baseCfg))
    expect(cap.url).toBe(
      'https://us-central1-aiplatform.googleapis.com/v1/projects/my-gcp-project/locations/us-central1/publishers/google/models/gemini-2.5-pro:streamGenerateContent?alt=sse',
    )
  })

  it('uses Bearer token from string accessToken', async () => {
    const cap: Capture = {}
    mockFetch(cap)
    await drain(vertex(baseCfg))
    expect(cap.authorization).toBe('Bearer ya29.test-token')
  })

  it('uses Bearer token from async accessToken function', async () => {
    const cap: Capture = {}
    mockFetch(cap)
    await drain(vertex({ ...baseCfg, accessToken: async () => 'ya29.dynamic' }))
    expect(cap.authorization).toBe('Bearer ya29.dynamic')
  })

  it('forwards tools as functionDeclarations', async () => {
    const cap: Capture = {}
    mockFetch(cap)
    await drain(vertex(baseCfg), {
      messages: [{ id: '1', role: 'user', content: 'hi', status: 'complete', createdAt: new Date(0) }],
      context: { tools: [{ name: 'lookup', description: 'lookup', schema: { type: 'object' } }] },
    })
    const body = JSON.parse(String(cap.body)) as {
      tools: Array<{ functionDeclarations: Array<{ name: string }> }>
    }
    expect(body.tools[0].functionDeclarations[0].name).toBe('lookup')
  })

  it('honours custom publisher', async () => {
    const cap: Capture = {}
    mockFetch(cap)
    await drain(vertex({ ...baseCfg, publisher: 'anthropic', model: 'claude-3-5-sonnet@20240620' }))
    expect(cap.url).toContain('/publishers/anthropic/')
  })
})
