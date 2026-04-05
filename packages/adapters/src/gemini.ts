import type { AdapterFactory, AdapterRequest, StreamChunk, StreamSource } from '@agentskit/core'

export interface GeminiConfig {
  apiKey: string
  model: string
  baseUrl?: string
}

export function gemini(config: GeminiConfig): AdapterFactory {
  const { apiKey, model, baseUrl = 'https://generativelanguage.googleapis.com' } = config

  return {
    createSource: (request: AdapterRequest): StreamSource => {
      let abortController: AbortController | null = new AbortController()

      return {
        stream: async function* (): AsyncIterableIterator<StreamChunk> {
          try {
            const response = await fetch(
              `${baseUrl}/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  contents: request.messages
                    .filter(message => message.role !== 'system')
                    .map(message => ({
                      role: message.role === 'assistant' ? 'model' : 'user',
                      parts: [{ text: message.content }],
                    })),
                  systemInstruction: request.messages.find(message => message.role === 'system')
                    ? {
                        role: 'system',
                        parts: [{ text: request.messages.find(message => message.role === 'system')!.content }],
                      }
                    : undefined,
                }),
                signal: abortController?.signal,
              }
            )

            if (!response.ok || !response.body) {
              yield { type: 'error', content: `Gemini API error: ${response.status}` }
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
                if (!line.startsWith('data: ')) continue
                const data = line.slice(6)
                if (!data) continue

                try {
                  const event = JSON.parse(data)
                  const text = event.candidates?.[0]?.content?.parts
                    ?.map((part: { text?: string }) => part.text ?? '')
                    .join('')
                  if (text) yield { type: 'text', content: text }
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
