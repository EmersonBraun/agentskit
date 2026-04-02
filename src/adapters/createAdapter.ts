import type { AdapterFactory, Message, StreamSource, StreamChunk } from '../core/types'
import type { CreateAdapterConfig } from './types'

export function createAdapter(config: CreateAdapterConfig): AdapterFactory {
  return {
    createSource: (messages: Message[]): StreamSource => {
      let abortController: AbortController | null = new AbortController()

      return {
        stream: async function* (): AsyncIterableIterator<StreamChunk> {
          try {
            const result = await config.send(messages)
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
          abortController?.abort()
          abortController = null
        },
      }
    },
  }
}
