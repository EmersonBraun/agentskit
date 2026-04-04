import type { AdapterFactory, AdapterRequest, StreamChunk, StreamSource } from '@agentskit/core'

export interface AnthropicConfig {
  apiKey: string
  model: string
  baseUrl?: string
  maxTokens?: number
}

export function anthropic(config: AnthropicConfig): AdapterFactory {
  const { apiKey, model, baseUrl = 'https://api.anthropic.com', maxTokens = 4096 } = config

  return {
    createSource: (request: AdapterRequest): StreamSource => {
      let abortController: AbortController | null = new AbortController()

      return {
        stream: async function* (): AsyncIterableIterator<StreamChunk> {
          try {
            const body = {
              model,
              max_tokens: request.context?.maxTokens ?? maxTokens,
              messages: request.messages
                .filter(message => message.role !== 'system')
                .map(message => ({ role: message.role, content: message.content })),
              system: request.messages.find(message => message.role === 'system')?.content,
              tools: request.context?.tools?.map(tool => ({
                name: tool.name,
                description: tool.description,
                input_schema: tool.schema,
              })),
              stream: true,
            }

            const response = await fetch(`${baseUrl}/v1/messages`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify(body),
              signal: abortController?.signal,
            })

            if (!response.ok || !response.body) {
              yield { type: 'error', content: `Anthropic API error: ${response.status}` }
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
                if (data === '[DONE]') continue

                try {
                  const event = JSON.parse(data)
                  if (event.type === 'content_block_delta' && event.delta?.text) {
                    yield { type: 'text', content: event.delta.text }
                  } else if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
                    yield {
                      type: 'tool_call',
                      toolCall: {
                        id: event.content_block.id,
                        name: event.content_block.name,
                        args: JSON.stringify(event.content_block.input ?? {}),
                      },
                    }
                  } else if (event.type === 'message_stop') {
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
