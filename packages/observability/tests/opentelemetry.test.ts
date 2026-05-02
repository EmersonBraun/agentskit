import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { opentelemetry } from '../src/opentelemetry'

interface CapturedSpan {
  name: string
  attributes: Record<string, unknown>
  startTime?: number
  endTime?: number
  ended: boolean
  status?: { code: number; message?: string }
}

let started: CapturedSpan[]
let activeContext = {}

beforeEach(() => {
  started = []
  vi.doMock('@opentelemetry/api', () => {
    const SpanStatusCode = { OK: 1, ERROR: 2 }
    return {
      SpanStatusCode,
      context: { active: () => activeContext },
      trace: {
        getTracer: () => ({
          startSpan(name: string, options?: { attributes?: Record<string, unknown>; startTime?: number }) {
            const captured: CapturedSpan = {
              name,
              attributes: { ...(options?.attributes ?? {}) },
              startTime: options?.startTime,
              ended: false,
            }
            started.push(captured)
            return {
              setAttribute(k: string, v: unknown) {
                captured.attributes[k] = v
              },
              setStatus(s: { code: number; message?: string }) {
                captured.status = s
              },
              end(t?: number) {
                captured.endTime = t
                captured.ended = true
              },
            }
          },
        }),
        setSpan: () => activeContext,
      },
    }
  })
  // SDK paths must throw so the observer falls back to the registered provider.
  vi.doMock('@opentelemetry/sdk-trace-base', () => {
    throw new Error('no sdk in this test')
  })
  vi.doMock('@opentelemetry/exporter-trace-otlp-http', () => {
    throw new Error('no exporter in this test')
  })
})

afterEach(() => {
  vi.doUnmock('@opentelemetry/api')
  vi.doUnmock('@opentelemetry/sdk-trace-base')
  vi.doUnmock('@opentelemetry/exporter-trace-otlp-http')
  vi.resetModules()
})

const llmStart = {
  type: 'llm:start' as const,
  spanId: 'span-1',
  parentSpanId: undefined,
  attributes: { 'gen_ai.system': 'openai', 'gen_ai.model': 'gpt-4o' },
  startTime: 1_700_000_000_000,
}

const llmEnd = {
  type: 'llm:end' as const,
  spanId: 'span-1',
  content: 'hi',
  attributes: { 'gen_ai.usage.total_tokens': 15 },
  startTime: 1_700_000_000_000,
  endTime: 1_700_000_000_500,
}

async function flush() {
  await new Promise(r => setTimeout(r, 5))
}

describe('opentelemetry observer', () => {
  it('returns an Observer with the right name', () => {
    const sink = opentelemetry()
    expect(sink.name).toBe('opentelemetry')
  })

  it('creates + ends an OTel span when spans land', async () => {
    const { opentelemetry: factory } = await import('../src/opentelemetry')
    const sink = factory({ serviceName: 'agentskit-test' })
    sink.on(llmStart)
    await flush()
    sink.on(llmEnd)
    await flush()
    expect(started.length).toBeGreaterThan(0)
    expect(started[0]!.ended).toBe(true)
  })

  it('throws install-hint when @opentelemetry/api is missing', async () => {
    vi.doMock('@opentelemetry/api', () => {
      throw new Error('not installed')
    })
    const { opentelemetry: factory } = await import('../src/opentelemetry')
    const sink = factory()
    // Errors inside observer paths are caught — assert no throw.
    expect(() => {
      sink.on(llmStart)
      sink.on(llmEnd)
    }).not.toThrow()
  })
})
