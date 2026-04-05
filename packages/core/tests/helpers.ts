import type { AdapterFactory, AdapterRequest, StreamChunk } from '../src/types'

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
