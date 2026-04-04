import type { AdapterFactory, AdapterRequest, StreamChunk, StreamSource } from '@agentskit/core'

export interface VercelAIConfig {
  api: string
  headers?: Record<string, string>
}

export function vercelAI(config: VercelAIConfig): AdapterFactory {
  const { api, headers = {} } = config

  return {
    createSource: (request: AdapterRequest): StreamSource => {
      let abortController: AbortController | null = new AbortController()

      return {
        stream: async function* (): AsyncIterableIterator<StreamChunk> {
          try {
            const response = await fetch(api, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...headers,
              },
              body: JSON.stringify({
                messages: request.messages.map(message => ({ role: message.role, content: message.content })),
                tools: request.context?.tools,
                systemPrompt: request.context?.systemPrompt,
              }),
              signal: abortController?.signal,
            })

            if (!response.ok || !response.body) {
              yield { type: 'error', content: `API error: ${response.status}` }
              return
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()

            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              const text = decoder.decode(value, { stream: true })
              if (text) yield { type: 'text', content: text }
            }

            yield { type: 'done' }
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
