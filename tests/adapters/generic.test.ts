import { describe, it, expect } from 'vitest'
import { generic } from '../../src/adapters/generic'
import type { Message } from '../../src/core/types'

describe('generic adapter', () => {
  it('converts a ReadableStream from send() into StreamChunks', async () => {
    const encoder = new TextEncoder()
    const adapter = generic({
      send: async (_messages: Message[]) => {
        return new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('Hello'))
            controller.enqueue(encoder.encode(' world'))
            controller.close()
          },
        })
      },
    })

    const source = adapter.createSource([])
    const chunks: Array<{ type: string; content?: string }> = []
    for await (const chunk of source.stream()) {
      chunks.push(chunk)
    }

    expect(chunks).toEqual([
      { type: 'text', content: 'Hello' },
      { type: 'text', content: ' world' },
      { type: 'done' },
    ])
  })

  it('yields error chunk when send() throws', async () => {
    const adapter = generic({
      send: async () => { throw new Error('network failure') },
    })

    const source = adapter.createSource([])
    const chunks: Array<{ type: string; content?: string }> = []
    for await (const chunk of source.stream()) {
      chunks.push(chunk)
    }

    expect(chunks).toEqual([
      { type: 'error', content: 'network failure' },
    ])
  })
})
