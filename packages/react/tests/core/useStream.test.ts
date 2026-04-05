import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStream } from '../../src/useStream'
import type { StreamSource, StreamChunk } from '@agentskit/core'

function createMockSource(chunks: StreamChunk[]): StreamSource {
  let aborted = false
  return {
    stream: async function* () {
      for (const chunk of chunks) {
        if (aborted) return
        yield chunk
      }
    },
    abort: () => { aborted = true },
  }
}

describe('useStream', () => {
  it('completes with empty text when source has no chunks', async () => {
    const source = createMockSource([])
    const { result } = renderHook(() => useStream(source))

    await waitFor(() => {
      expect(result.current.status).toBe('complete')
    })

    expect(result.current.text).toBe('')
    expect(result.current.error).toBeNull()
  })

  it('streams text chunks and accumulates text', async () => {
    const source = createMockSource([
      { type: 'text', content: 'Hello' },
      { type: 'text', content: ' world' },
      { type: 'done' },
    ])
    const { result } = renderHook(() => useStream(source))

    await waitFor(() => {
      expect(result.current.status).toBe('complete')
    })

    expect(result.current.text).toBe('Hello world')
  })

  it('sets error status on error chunk', async () => {
    const source = createMockSource([
      { type: 'text', content: 'partial' },
      { type: 'error', content: 'connection lost' },
    ])
    const { result } = renderHook(() => useStream(source))

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('connection lost')
  })

  it('calls onChunk callback for each chunk', async () => {
    const onChunk = vi.fn()
    const source = createMockSource([
      { type: 'text', content: 'Hi' },
      { type: 'done' },
    ])
    const { result } = renderHook(() => useStream(source, { onChunk }))

    await waitFor(() => {
      expect(result.current.status).toBe('complete')
    })

    expect(onChunk).toHaveBeenCalledTimes(2)
    expect(onChunk).toHaveBeenCalledWith({ type: 'text', content: 'Hi' })
  })

  it('stop() aborts the stream', async () => {
    let yieldCount = 0
    const source: StreamSource = {
      stream: async function* () {
        while (true) {
          yieldCount++
          yield { type: 'text' as const, content: `chunk${yieldCount}` }
          await new Promise(r => setTimeout(r, 10))
        }
      },
      abort: vi.fn(),
    }

    const { result } = renderHook(() => useStream(source))

    await waitFor(() => {
      expect(result.current.status).toBe('streaming')
    })

    act(() => {
      result.current.stop()
    })

    expect(source.abort).toHaveBeenCalled()
  })
})
