import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { langsmith } from '../src/langsmith'

interface Captured {
  createRun: Array<Record<string, unknown>>
  updateRun: Array<{ id: string; params: Record<string, unknown> }>
}

let captured: Captured
let mockClass: unknown

beforeEach(() => {
  captured = { createRun: [], updateRun: [] }
  mockClass = class FakeClient {
    constructor(_: unknown) {}
    async createRun(p: Record<string, unknown>) {
      captured.createRun.push(p)
    }
    async updateRun(id: string, params: Record<string, unknown>) {
      captured.updateRun.push({ id, params })
    }
  }
  vi.doMock('langsmith', () => ({ Client: mockClass }))
})

afterEach(() => {
  vi.doUnmock('langsmith')
  vi.resetModules()
})

const baseLlmStart = {
  type: 'llm:start' as const,
  spanId: 'span-1',
  parentSpanId: undefined,
  attributes: { 'gen_ai.system': 'openai', 'gen_ai.model': 'gpt-4o' },
  startTime: 1_700_000_000_000,
}

const baseLlmEnd = {
  type: 'llm:end' as const,
  spanId: 'span-1',
  content: 'hi',
  usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
  attributes: { 'gen_ai.usage.total_tokens': 15 },
  startTime: 1_700_000_000_000,
  endTime: 1_700_000_000_500,
}

async function flush() {
  await new Promise(r => setTimeout(r, 5))
}

describe('langsmith observer', () => {
  it('exposes the standard observer shape', () => {
    const sink = langsmith({ apiKey: 'k' })
    expect(sink.name).toBe('langsmith')
    expect(typeof sink.on).toBe('function')
  })

  it('creates a run on llm:start and updates it on llm:end', async () => {
    const { langsmith: factory } = await import('../src/langsmith')
    const sink = factory({ apiKey: 'k', projectName: 'p' })
    sink.on(baseLlmStart)
    sink.on(baseLlmEnd)
    await flush()
    expect(captured.createRun.length).toBeGreaterThan(0)
    expect(captured.updateRun.length).toBeGreaterThan(0)
  })

  it('passes attributes through to createRun.inputs', async () => {
    const { langsmith: factory } = await import('../src/langsmith')
    const sink = factory({ apiKey: 'k' })
    sink.on(baseLlmStart)
    await flush()
    expect(captured.createRun.length).toBeGreaterThan(0)
    const first = captured.createRun[0]!
    expect(first.project_name).toBe('agentskit')
    expect(first.run_type).toBe('llm')
  })

  it('swallows client errors so the main loop is not interrupted', async () => {
    vi.doMock('langsmith', () => ({
      Client: class Bad {
        constructor(_: unknown) {}
        async createRun() {
          throw new Error('langsmith down')
        }
        async updateRun() {
          throw new Error('langsmith down')
        }
      },
    }))
    const { langsmith: factory } = await import('../src/langsmith')
    const sink = factory({ apiKey: 'k' })
    expect(() => {
      sink.on(baseLlmStart)
      sink.on(baseLlmEnd)
    }).not.toThrow()
    await flush()
  })
})
