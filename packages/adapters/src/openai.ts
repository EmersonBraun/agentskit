import type { AdapterFactory, AdapterRequest, StreamChunk, StreamSource } from '@agentskit/core'
import { parseSSEStream, toProviderMessages } from './utils'

export interface OpenAIConfig {
  apiKey: string
  model: string
  baseUrl?: string
}

export function openai(config: OpenAIConfig): AdapterFactory {
  const { apiKey, model, baseUrl = 'https://api.openai.com' } = config

  return {
    createSource: (request: AdapterRequest): StreamSource => {
      let abortController: AbortController | null = new AbortController()

      return {
        stream: async function* (): AsyncIterableIterator<StreamChunk> {
          try {
            const body = {
              model,
              messages: toProviderMessages(request.messages),
              tools: request.context?.tools?.map(tool => ({
                type: 'function',
                function: {
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.schema,
                },
              })),
              temperature: request.context?.temperature,
              max_tokens: request.context?.maxTokens,
              stream: true,
            }

            const response = await fetch(`${baseUrl}/v1/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify(body),
              signal: abortController?.signal,
            })

            if (!response.ok || !response.body) {
              yield { type: 'error', content: `OpenAI API error: ${response.status}` }
              return
            }

            yield* parseSSEStream(response.body)
          } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return
            yield {
              type: 'error',
              content: err instanceof Error ? err.message : String(err),
            }
          }
        },
        abort: () => {
          abortController?.abort()
          abortController = null
        },
      }
    },
  }
}
