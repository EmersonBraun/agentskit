import type {
  AgentEvent,
  Message,
  MessageRole,
  MessageStatus,
  Observer,
  StreamChunk,
  StreamSource,
  ToolDefinition,
  ToolExecutionContext,
} from './types'

let nextId = 0

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${nextId++}`
}

export function createEventEmitter() {
  const observers = new Set<Observer>()

  return {
    addObserver(observer: Observer): () => void {
      observers.add(observer)
      return () => { observers.delete(observer) }
    },
    emit(event: AgentEvent): void {
      for (const observer of observers) {
        try {
          const result = observer.on(event)
          if (result && typeof (result as Promise<void>).catch === 'function') {
            (result as Promise<void>).catch(() => {})
          }
        } catch {
          // Observer errors must never break the main loop.
        }
      }
    },
  }
}

export function buildMessage(params: {
  role: MessageRole
  content: string
  status?: MessageStatus
  metadata?: Record<string, unknown>
}): Message {
  return {
    id: generateId('msg'),
    role: params.role,
    content: params.content,
    status: params.status ?? 'complete',
    metadata: params.metadata,
    createdAt: new Date(),
  }
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return value != null && typeof value === 'object' && Symbol.asyncIterator in value
}

export async function executeToolCall(
  tool: ToolDefinition,
  args: Record<string, unknown>,
  context: ToolExecutionContext,
  onPartialResult?: (accumulated: string) => void,
): Promise<string> {
  const raw = tool.execute?.(args, context)

  if (isAsyncIterable(raw)) {
    let accumulated = ''
    for await (const chunk of raw) {
      accumulated += String(chunk)
      onPartialResult?.(accumulated)
    }
    return accumulated
  }

  const result = await raw
  return result == null ? '' : String(result)
}

export interface ConsumeStreamHandlers {
  onText?: (accumulated: string) => void
  onReasoning?: (accumulated: string) => void
  onToolCall?: (chunk: StreamChunk) => Promise<void> | void
  onToolResult?: (content: string) => void
  onError?: (error: Error) => void
  onDone: (accumulatedText: string) => void
}

export async function consumeStream(
  source: StreamSource,
  handlers: ConsumeStreamHandlers,
): Promise<void> {
  let accumulatedText = ''
  let accumulatedReasoning = ''

  try {
    const iterator = source.stream()
    for await (const chunk of iterator) {
      if (chunk.type === 'text' && chunk.content) {
        accumulatedText += chunk.content
        handlers.onText?.(accumulatedText)
      } else if (chunk.type === 'reasoning' && chunk.content) {
        accumulatedReasoning += chunk.content
        handlers.onReasoning?.(accumulatedReasoning)
      } else if (chunk.type === 'tool_call') {
        await handlers.onToolCall?.(chunk)
      } else if (chunk.type === 'tool_result' && chunk.content) {
        handlers.onToolResult?.(chunk.content)
      } else if (chunk.type === 'error') {
        handlers.onError?.(new Error(chunk.content ?? 'Stream error'))
        return
      } else if (chunk.type === 'done') {
        break
      }
    }
    handlers.onDone(accumulatedText)
  } catch (error) {
    handlers.onError?.(error instanceof Error ? error : new Error(String(error)))
  }
}
