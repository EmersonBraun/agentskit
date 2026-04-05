import type { AdapterFactory, AdapterRequest, StreamChunk, StreamSource } from '@agentskit/core'
import type { CreateAdapterConfig } from './types'

export function createAdapter(config: CreateAdapterConfig): AdapterFactory {
  return {
    createSource: (request: AdapterRequest): StreamSource => ({
      stream: async function* (): AsyncIterableIterator<StreamChunk> {
        try {
          const result = await config.send(request)
          const stream = result instanceof Response
            ? result.body!
            : result
          yield* config.parse(stream)
        } catch (err) {
          yield {
            type: 'error',
            content: err instanceof Error ? err.message : String(err),
          }
        }
      },
      abort: () => {
        config.abort?.()
      },
    }),
  }
}
