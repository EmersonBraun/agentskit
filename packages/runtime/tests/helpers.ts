import type { AdapterFactory, AdapterRequest, StreamChunk } from '@agentskit/core'

export function createMockAdapter(chunks: StreamChunk[]): AdapterFactory {
  return {
    createSource: (_request: AdapterRequest) => {
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
    },
  }
}

/**
 * Creates an adapter that returns different chunks on each call.
 * Useful for multi-step ReAct loop testing.
 */
export function createSequentialAdapter(calls: StreamChunk[][]): AdapterFactory {
  let callIndex = 0
  return {
    createSource: (_request: AdapterRequest) => {
      const chunks = calls[callIndex] ?? [{ type: 'text' as const, content: 'no more calls' }, { type: 'done' as const }]
      callIndex++
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
    },
  }
}
