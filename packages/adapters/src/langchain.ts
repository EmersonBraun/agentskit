import type { AdapterFactory, AdapterRequest, StreamChunk, StreamSource } from '@agentskit/core'

type LangChainRunnable = {
  stream?: (input: unknown, config?: Record<string, unknown>) => AsyncIterable<unknown> | Promise<AsyncIterable<unknown>>
  streamEvents?: (input: unknown, config?: Record<string, unknown>) => AsyncIterable<Record<string, unknown>> | Promise<AsyncIterable<Record<string, unknown>>>
}

export interface LangChainConfig {
  runnable: LangChainRunnable
  mode?: 'stream' | 'events'
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'content' in value) {
    const content = (value as { content?: unknown }).content
    if (typeof content === 'string') return content
  }
  return ''
}

export function langchain(config: LangChainConfig): AdapterFactory {
  const { runnable, mode = 'stream' } = config

  return {
    createSource: (request: AdapterRequest): StreamSource => ({
      stream: async function* (): AsyncIterableIterator<StreamChunk> {
        try {
          if (mode === 'events' && runnable.streamEvents) {
            const events = await runnable.streamEvents(
              { messages: request.messages },
              { version: 'v2' }
            )

            for await (const event of events) {
              const eventName = String(event.event ?? '')
              if (eventName.endsWith('_stream')) {
                const chunk = asText(event.data)
                if (chunk) yield { type: 'text', content: chunk }
              } else if (eventName.endsWith('_start') && event.name) {
                yield {
                  type: 'tool_call',
                  toolCall: {
                    id: String(event.run_id ?? `${event.name}-${Date.now()}`),
                    name: String(event.name),
                    args: JSON.stringify(event.data ?? {}),
                  },
                }
              } else if (eventName.endsWith('_end')) {
                continue
              }
            }
          } else if (runnable.stream) {
            const stream = await runnable.stream({ messages: request.messages })
            for await (const value of stream) {
              const chunk = asText(value)
              if (chunk) yield { type: 'text', content: chunk }
            }
          } else {
            yield { type: 'error', content: 'Runnable does not implement stream() or streamEvents()' }
            return
          }

          yield { type: 'done' }
        } catch (error) {
          yield {
            type: 'error',
            content: error instanceof Error ? error.message : String(error),
          }
        }
      },
      abort: () => {},
    }),
  }
}

export interface LangGraphConfig {
  graph: LangChainRunnable
}

export function langgraph(config: LangGraphConfig): AdapterFactory {
  return langchain({
    runnable: config.graph,
    mode: 'events',
  })
}
