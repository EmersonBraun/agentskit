import { formatRetrievedDocuments } from './rag'
import type {
  AdapterRequest,
  ChatConfig,
  ChatController,
  ChatState,
  Message,
  StreamChunk,
  StreamSource,
  ToolCall,
  ToolDefinition,
} from './types'

let nextId = 0

function generateId(): string {
  return `msg-${Date.now()}-${nextId++}`
}

function safeParseArgs(args: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(args)
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

function createSystemMessage(content: string): Message {
  return {
    id: generateId(),
    role: 'system',
    content,
    status: 'complete',
    createdAt: new Date(),
  }
}

function mergeSystemMessages(messages: Message[], systemPrompt?: string): Message[] {
  if (!systemPrompt) return messages
  if (messages.some(message => message.role === 'system' && message.content === systemPrompt)) {
    return messages
  }
  return [createSystemMessage(systemPrompt), ...messages]
}

function buildRetrievalMessage(documentsText: string): Message | null {
  if (!documentsText) return null

  return createSystemMessage(
    `Use the retrieved context below when it is relevant.\n\n${documentsText}`
  )
}

export function createChatController(initialConfig: ChatConfig): ChatController {
  let config = initialConfig
  let source: StreamSource | null = null
  let state: ChatState = {
    messages: initialConfig.initialMessages ?? [],
    status: 'idle',
    input: '',
    error: null,
  }
  const listeners = new Set<() => void>()
  let hydrated = false

  const emit = () => {
    for (const listener of listeners) listener()
  }

  const setState = (updater: ChatState | ((current: ChatState) => ChatState)) => {
    state = typeof updater === 'function'
      ? updater(state)
      : updater
    void persistMessages(state.messages)
    emit()
  }

  const persistMessages = async (messages: Message[]) => {
    try {
      await config.memory?.save(messages)
    } catch {
      // Memory failures should not break chat usage.
    }
  }

  const hydrateMemory = async () => {
    if (hydrated || !config.memory) return
    hydrated = true

    try {
      const loaded = await config.memory.load()
      if (loaded.length > 0 && state.messages.length === 0) {
        state = { ...state, messages: loaded }
        emit()
      }
    } catch {
      // Ignore hydration failures and continue with in-memory state.
    }
  }

  void hydrateMemory()

  const setAssistantMessage = (assistantId: string, updater: (message: Message) => Message) => {
    setState(current => ({
      ...current,
      messages: current.messages.map(message => (
        message.id === assistantId ? updater(message) : message
      )),
    }))
  }

  const findTool = (name: string): ToolDefinition | undefined => (
    config.tools?.find(tool => tool.name === name)
  )

  const handleToolCall = async (assistantId: string, chunk: StreamChunk) => {
    if (!chunk.toolCall) return

    const args = safeParseArgs(chunk.toolCall.args)
    const tool = findTool(chunk.toolCall.name)
    const toolCall: ToolCall = {
      id: chunk.toolCall.id,
      name: chunk.toolCall.name,
      args,
      result: chunk.toolCall.result,
      status: tool?.requiresConfirmation ? 'requires_confirmation' : 'pending',
    }

    setAssistantMessage(assistantId, message => ({
      ...message,
      toolCalls: [...(message.toolCalls ?? []), toolCall],
    }))

    await config.onToolCall?.(toolCall, {
      messages: state.messages,
      tool,
    })

    if (!tool?.execute || tool.requiresConfirmation) {
      if (chunk.toolCall.result) {
        setAssistantMessage(assistantId, message => ({
          ...message,
          toolCalls: (message.toolCalls ?? []).map(call => (
            call.id === toolCall.id
              ? { ...call, result: chunk.toolCall?.result, status: 'complete' }
              : call
          )),
        }))
      }
      return
    }

    setAssistantMessage(assistantId, message => ({
      ...message,
      toolCalls: (message.toolCalls ?? []).map(call => (
        call.id === toolCall.id
          ? { ...call, status: 'running' }
          : call
      )),
    }))

    try {
      const result = await tool.execute(args, {
        messages: state.messages,
        call: toolCall,
      })
      setAssistantMessage(assistantId, message => ({
        ...message,
        toolCalls: (message.toolCalls ?? []).map(call => (
          call.id === toolCall.id
            ? { ...call, status: 'complete', result: result == null ? '' : String(result) }
            : call
        )),
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setAssistantMessage(assistantId, nextMessage => ({
        ...nextMessage,
        toolCalls: (nextMessage.toolCalls ?? []).map(call => (
          call.id === toolCall.id
            ? { ...call, status: 'error', error: message }
            : call
        )),
      }))
    }
  }

  const buildAdapterRequest = async (messages: Message[], text: string): Promise<AdapterRequest> => {
    const withSystem = mergeSystemMessages(messages, config.systemPrompt)
    const retrievedDocuments = config.retriever
      ? await config.retriever.retrieve({ query: text, messages })
      : []
    const retrievalMessage = buildRetrievalMessage(formatRetrievedDocuments(retrievedDocuments))

    return {
      messages: retrievalMessage ? [retrievalMessage, ...withSystem] : withSystem,
      context: {
        systemPrompt: config.systemPrompt,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        tools: config.tools,
        metadata: retrievedDocuments.length > 0 ? { retrievedDocuments } : undefined,
      },
    }
  }

  const startStream = async (messages: Message[], assistantId: string, text: string) => {
    const request = await buildAdapterRequest(messages, text)
    source = config.adapter.createSource(request)

    let accumulated = ''

    try {
      const iterator = source.stream()
      for await (const chunk of iterator) {
        if (chunk.type === 'text' && chunk.content) {
          accumulated += chunk.content
          setAssistantMessage(assistantId, message => ({
            ...message,
            content: accumulated,
          }))
        } else if (chunk.type === 'reasoning' && chunk.content) {
          setAssistantMessage(assistantId, message => ({
            ...message,
            metadata: {
              ...message.metadata,
              reasoning: `${message.metadata?.reasoning ?? ''}${chunk.content}`,
            },
          }))
        } else if (chunk.type === 'tool_call') {
          await handleToolCall(assistantId, chunk)
        } else if (chunk.type === 'tool_result' && chunk.content) {
          setAssistantMessage(assistantId, message => ({
            ...message,
            metadata: {
              ...message.metadata,
              toolResult: chunk.content,
            },
          }))
        } else if (chunk.type === 'error') {
          const error = new Error(chunk.content ?? 'Stream error')
          setAssistantMessage(assistantId, message => ({ ...message, status: 'error' }))
          setState(current => ({ ...current, status: 'error', error }))
          config.onError?.(error)
          return
        } else if (chunk.type === 'done') {
          break
        }
      }

      let completedMessage: Message | undefined
      setState(current => {
        const messages = current.messages.map(message => {
          if (message.id !== assistantId) return message
          completedMessage = { ...message, status: 'complete' }
          return completedMessage
        })

        return {
          ...current,
          messages,
          status: 'idle',
          error: null,
        }
      })
      if (completedMessage) config.onMessage?.(completedMessage)
    } catch (error) {
      const nextError = error instanceof Error ? error : new Error(String(error))
      setAssistantMessage(assistantId, message => ({ ...message, status: 'error' }))
      setState(current => ({ ...current, status: 'error', error: nextError }))
      config.onError?.(nextError)
    }
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    async send(text) {
      if (!text.trim()) return

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: text,
        status: 'complete',
        createdAt: new Date(),
      }
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        status: 'streaming',
        createdAt: new Date(),
      }

      setState(current => ({
        ...current,
        messages: [...current.messages, userMessage, assistantMessage],
        status: 'streaming',
        input: '',
        error: null,
      }))

      await startStream([...state.messages], assistantMessage.id, text)
    },
    stop() {
      source?.abort()
      setState(current => ({ ...current, status: 'idle' }))
    },
    async retry() {
      const messages = [...state.messages]
      if (messages.length < 2) return

      const lastAssistant = messages[messages.length - 1]
      const lastUser = messages[messages.length - 2]
      if (lastAssistant.role !== 'assistant' || lastUser.role !== 'user') return

      const withoutLast = messages.slice(0, -1)
      const replacementAssistant: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        status: 'streaming',
        createdAt: new Date(),
      }

      setState(current => ({
        ...current,
        messages: [...withoutLast, replacementAssistant],
        status: 'streaming',
        error: null,
      }))

      await startStream([...withoutLast, replacementAssistant], replacementAssistant.id, lastUser.content)
    },
    setInput(value) {
      setState(current => ({ ...current, input: value }))
    },
    setMessages(messages) {
      setState(current => ({ ...current, messages }))
    },
    async clear() {
      setState(current => ({
        ...current,
        messages: [],
        status: 'idle',
        error: null,
      }))
      await config.memory?.clear?.()
    },
    updateConfig(nextConfig) {
      config = { ...config, ...nextConfig }
      void hydrateMemory()
    },
  }
}
