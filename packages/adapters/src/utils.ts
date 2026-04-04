import type { AdapterRequest, Message, StreamChunk } from '@agentskit/core'

export function toProviderMessages(messages: Message[]) {
  return messages.map(message => ({
    role: message.role,
    content: message.content,
  }))
}

export async function* parseSSEStream(stream: ReadableStream): AsyncIterableIterator<StreamChunk> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (!data || data === '[DONE]') {
          if (data === '[DONE]') {
            yield { type: 'done' }
            return
          }
          continue
        }

        try {
          const event = JSON.parse(data)
          const delta = event.choices?.[0]?.delta

          if (typeof delta?.content === 'string') {
            yield { type: 'text', content: delta.content }
          } else if (Array.isArray(delta?.tool_calls)) {
            for (const toolCall of delta.tool_calls) {
              if (toolCall?.function?.name) {
                yield {
                  type: 'tool_call',
                  toolCall: {
                    id: toolCall.id ?? `${toolCall.function.name}-${Date.now()}`,
                    name: toolCall.function.name,
                    args: toolCall.function.arguments ?? '{}',
                  },
                }
              }
            }
          } else if (event.type === 'content_block_delta' && event.delta?.text) {
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
          } else if (event.type === 'message_delta' && event.delta?.stop_reason === 'tool_use') {
            continue
          } else if (event.type === 'message_stop') {
            yield { type: 'done' }
            return
          }
        } catch {
          // Ignore malformed events from providers.
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  yield { type: 'done' }
}

export function withAbortController<T extends object>(builder: (abortController: AbortController) => T): T {
  const abortController = new AbortController()
  const target = builder(abortController)

  return Object.assign(target, {
    abort: () => {
      abortController.abort()
    },
  })
}

export function getRequestMessages(request: AdapterRequest): Message[] {
  return request.messages
}
