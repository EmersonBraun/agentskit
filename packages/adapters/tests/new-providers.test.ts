import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  mistral,
  cohere,
  together,
  groq,
  fireworks,
  openrouter,
  huggingface,
  lmstudio,
  vllm,
  llamacpp,
} from '../src'

/**
 * Each adapter is a thin `createOpenAICompatibleAdapter(baseUrl)`
 * wrapper around the shared OpenAI adapter. We don't want to verify
 * the OpenAI adapter (covered elsewhere) — just that every new
 * wrapper targets the right default baseUrl and honours caller
 * overrides.
 */

interface Capture {
  url?: string
  body?: unknown
  authorization?: string
}

async function capture(factory: ReturnType<typeof mistral>): Promise<Capture> {
  const cap: Capture = {}
  const source = factory.createSource({
    messages: [{ id: '1', role: 'user', content: 'hi', status: 'complete', createdAt: new Date(0) }],
  })
  const iter = source.stream()[Symbol.asyncIterator]()
  // drain until error or done — fetch is mocked to capture + reject
  try {
    while (true) {
      const next = await iter.next()
      if (next.done) break
    }
  } catch {
    // expected — our mock rejects
  }
  return cap
}

let originalFetch: typeof globalThis.fetch

beforeEach(() => {
  originalFetch = globalThis.fetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

function mockFetch(cap: Capture): void {
  globalThis.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    cap.url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
    cap.body = init?.body
    const authHeader = (init?.headers as Record<string, string> | undefined)?.authorization
      ?? (init?.headers as Record<string, string> | undefined)?.Authorization
    cap.authorization = authHeader
    throw new Error('stub')
  }) as typeof globalThis.fetch
}

describe.each([
  ['mistral', mistral, 'https://api.mistral.ai/v1'],
  ['cohere', cohere, 'https://api.cohere.com/compatibility/v1'],
  ['together', together, 'https://api.together.xyz/v1'],
  ['groq', groq, 'https://api.groq.com/openai/v1'],
  ['fireworks', fireworks, 'https://api.fireworks.ai/inference/v1'],
  ['openrouter', openrouter, 'https://openrouter.ai/api/v1'],
  ['huggingface', huggingface, 'https://router.huggingface.co/v1'],
  ['lmstudio', lmstudio, 'http://localhost:1234/v1'],
  ['vllm', vllm, 'http://localhost:8000/v1'],
  ['llamacpp', llamacpp, 'http://localhost:8080/v1'],
])('%s adapter', (name, factory, defaultBaseUrl) => {
  it('uses the default baseUrl when none is given', async () => {
    const cap: Capture = {}
    mockFetch(cap)
    await capture(factory({ apiKey: 'test', model: 'm' }))
    expect(cap.url).toContain(defaultBaseUrl)
  })

  it('lets the caller override baseUrl', async () => {
    const cap: Capture = {}
    mockFetch(cap)
    await capture(factory({ apiKey: 'test', model: 'm', baseUrl: 'http://custom.local/v1' }))
    expect(cap.url).toContain('http://custom.local/v1')
    expect(cap.url).not.toContain(defaultBaseUrl)
  })

  it('passes the API key as a bearer header', async () => {
    const cap: Capture = {}
    mockFetch(cap)
    await capture(factory({ apiKey: `key-${name}`, model: 'm' }))
    expect(cap.authorization).toBe(`Bearer key-${name}`)
  })
})
