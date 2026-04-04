import type { AdapterFactory, AdapterRequest, StreamChunk, StreamSource } from '@agentskit/core'
import type { GenericAdapterConfig } from './types'

export function generic(config: GenericAdapterConfig): AdapterFactory {
  return {
    createSource: (request: AdapterRequest): StreamSource => {
      let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
      const decoder = new TextDecoder()

      return {
        stream: async function* (): AsyncIterableIterator<StreamChunk> {
          try {
            const stream = await config.send(request)
            reader = stream.getReader()

            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              const text = decoder.decode(value, { stream: true })
              yield { type: 'text', content: text }
            }

            yield { type: 'done' }
          } catch (err) {
            yield {
              type: 'error',
              content: err instanceof Error ? err.message : String(err),
            }
          } finally {
            reader?.releaseLock()
          }
        },
        abort: () => {
          void reader?.cancel()
        },
      }
    },
  }
}
