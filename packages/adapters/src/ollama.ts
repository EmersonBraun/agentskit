import type { AdapterFactory, AdapterRequest, StreamChunk, StreamSource } from '@agentskit/core'

export interface OllamaConfig {
  model: string
  baseUrl?: string
}

export function ollama(config: OllamaConfig): AdapterFactory {
  const { model, baseUrl = 'http://localhost:11434' } = config

  return {
    createSource: (request: AdapterRequest): StreamSource => {
      let abortController: AbortController | null = new AbortController()

      return {
        stream: async function* (): AsyncIterableIterator<StreamChunk> {
          try {
            const response = await fetch(`${baseUrl}/api/chat`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model,
                stream: true,
                messages: request.messages.map(message => ({
                  role: message.role,
                  content: message.content,
                })),
              }),
              signal: abortController?.signal,
            })

            if (!response.ok || !response.body) {
              yield { type: 'error', content: `Ollama API error: ${response.status}` }
              return
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() ?? ''

              for (const line of lines) {
                if (!line.trim()) continue
                try {
                  const event = JSON.parse(line)
                  if (event.message?.content) {
                    yield { type: 'text', content: event.message.content }
                  }
                  if (event.done) {
                    yield { type: 'done' }
                    return
                  }
                } catch {
                  // Ignore malformed JSON lines.
                }
              }
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
