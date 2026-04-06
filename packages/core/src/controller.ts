import { formatRetrievedDocuments } from './rag'
import { buildMessage, consumeStream, executeToolCall, createEventEmitter, safeParseArgs, createToolLifecycle } from './primitives'
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

function mergeSystemMessages(messages: Message[], systemPrompt?: string): Message[] {
  if (!systemPrompt) return messages
  if (messages.some(message => message.role === 'system' && message.content === systemPrompt)) {
    return messages
  }
  return [buildMessage({ role: 'system', content: systemPrompt }), ...messages]
}

function buildRetrievalMessage(documentsText: string): Message | null {
  if (!documentsText) return null
  return buildMessage({
    role: 'system',
    content: `Use the retrieved context below when it is relevant.\n\n${documentsText}`,
  })
}

async function activateSkills(config: ChatConfig): Promise<{
  systemPrompt: string | undefined
  skillTools: ToolDefinition[]
}> {
  const skills = config.skills ?? []
  if (skills.length === 0) return { systemPrompt: config.systemPrompt, skillTools: [] }

  const skillPrompts = skills.map(s => `--- ${s.name} ---\n${s.systemPrompt}`)
  const basePrompt = config.systemPrompt ? `${config.systemPrompt}\n\n` : ''
  const systemPrompt = `${basePrompt}${skillPrompts.join('\n\n')}`

  const skillTools: ToolDefinition[] = []
  for (const skill of skills) {
    if (skill.onActivate) {
      const activation = await skill.onActivate()
      skillTools.push(...(activation.tools ?? []))
    }
  }

  return { systemPrompt, skillTools }
}

export function createChatController(initialConfig: ChatConfig): ChatController {
  let config = initialConfig
  let effectiveSystemPrompt = config.systemPrompt
  let source: StreamSource | null = null
  let state: ChatState = {
    messages: initialConfig.initialMessages ?? [],
    status: 'idle',
    input: '',
    error: null,
  }
  const listeners = new Set<() => void>()
  const emitter = createEventEmitter()
  const toolMap = new Map<string, ToolDefinition>()
  let lifecycle = createToolLifecycle(toolMap)
  let hydrated = false
  let skillsActivated = false

  const rebuildToolMap = (extraTools: ToolDefinition[] = []) => {
    toolMap.clear()
    for (const tool of config.tools ?? []) toolMap.set(tool.name, tool)
    for (const tool of extraTools) toolMap.set(tool.name, tool)
  }
  rebuildToolMap()

  const ensureSkillsActivated = async () => {
    if (skillsActivated) return
    skillsActivated = true
    const { systemPrompt, skillTools } = await activateSkills(config)
    effectiveSystemPrompt = systemPrompt
    if (skillTools.length > 0) rebuildToolMap(skillTools)
  }
  void ensureSkillsActivated()

  for (const observer of config.observers ?? []) {
    emitter.addObserver(observer)
  }

  const emit = () => {
    for (const listener of listeners) listener()
  }

  const setState = (updater: ChatState | ((current: ChatState) => ChatState)) => {
    state = typeof updater === 'function' ? updater(state) : updater
    void persistMessages(state.messages)
    emit()
  }

  const persistMessages = async (messages: Message[]) => {
    try {
      await config.memory?.save(messages)
      if (config.memory) {
        emitter.emit({ type: 'memory:save', messageCount: messages.length })
      }
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
        emitter.emit({ type: 'memory:load', messageCount: loaded.length })
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
      messages: current.messages.map(message =>
        message.id === assistantId ? updater(message) : message
      ),
    }))
  }

  const findTool = (name: string): ToolDefinition | undefined =>
    toolMap.get(name)

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

    await config.onToolCall?.(toolCall, { messages: state.messages, tool })

    if (!tool?.execute || tool.requiresConfirmation) {
      if (chunk.toolCall.result) {
        setAssistantMessage(assistantId, message => ({
          ...message,
          toolCalls: (message.toolCalls ?? []).map(call =>
            call.id === toolCall.id
              ? { ...call, result: chunk.toolCall?.result, status: 'complete' as const }
              : call
          ),
        }))
      }
      return
    }

    setAssistantMessage(assistantId, message => ({
      ...message,
      toolCalls: (message.toolCalls ?? []).map(call =>
        call.id === toolCall.id ? { ...call, status: 'running' as const } : call
      ),
    }))

    await lifecycle.init(tool)

    emitter.emit({ type: 'tool:start', name: toolCall.name, args })
    const toolStart = Date.now()

    try {
      const result = await executeToolCall(
        tool,
        args,
        { messages: state.messages, call: toolCall },
        (partial) => {
          setAssistantMessage(assistantId, message => ({
            ...message,
            toolCalls: (message.toolCalls ?? []).map(call =>
              call.id === toolCall.id ? { ...call, result: partial } : call
            ),
          }))
        },
      )
      setAssistantMessage(assistantId, message => ({
        ...message,
        toolCalls: (message.toolCalls ?? []).map(call =>
          call.id === toolCall.id
            ? { ...call, status: 'complete' as const, result }
            : call
        ),
      }))
      emitter.emit({ type: 'tool:end', name: toolCall.name, result, durationMs: Date.now() - toolStart })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setAssistantMessage(assistantId, message => ({
        ...message,
        toolCalls: (message.toolCalls ?? []).map(call =>
          call.id === toolCall.id
            ? { ...call, status: 'error' as const, error: errorMessage }
            : call
        ),
      }))
      emitter.emit({ type: 'error', error: error instanceof Error ? error : new Error(errorMessage) })
    }
  }

  const buildAdapterRequest = async (messages: Message[], text: string): Promise<AdapterRequest> => {
    await ensureSkillsActivated()
    const withSystem = mergeSystemMessages(messages, effectiveSystemPrompt)
    const retrievedDocuments = config.retriever
      ? await config.retriever.retrieve({ query: text, messages })
      : []
    const retrievalMessage = buildRetrievalMessage(formatRetrievedDocuments(retrievedDocuments))

    return {
      messages: retrievalMessage ? [retrievalMessage, ...withSystem] : withSystem,
      context: {
        systemPrompt: effectiveSystemPrompt,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        tools: [...toolMap.values()],
        metadata: retrievedDocuments.length > 0 ? { retrievedDocuments } : undefined,
      },
    }
  }

  const startStream = async (messages: Message[], assistantId: string, text: string) => {
    const request = await buildAdapterRequest(messages, text)
    source = config.adapter.createSource(request)

    const streamStart = Date.now()
    let firstTokenEmitted = false

    emitter.emit({ type: 'llm:start', messageCount: request.messages.length })

    await consumeStream(source, {
      onText(accumulated) {
        if (!firstTokenEmitted) {
          emitter.emit({ type: 'llm:first-token', latencyMs: Date.now() - streamStart })
          firstTokenEmitted = true
        }
        setAssistantMessage(assistantId, message => ({
          ...message,
          content: accumulated,
        }))
      },
      onReasoning(accumulated) {
        setAssistantMessage(assistantId, message => ({
          ...message,
          metadata: { ...message.metadata, reasoning: accumulated },
        }))
      },
      async onToolCall(chunk) {
        await handleToolCall(assistantId, chunk)
      },
      onToolResult(content) {
        setAssistantMessage(assistantId, message => ({
          ...message,
          metadata: { ...message.metadata, toolResult: content },
        }))
      },
      onError(error) {
        setAssistantMessage(assistantId, message => ({ ...message, status: 'error' }))
        setState(current => ({ ...current, status: 'error', error }))
        emitter.emit({ type: 'error', error })
        config.onError?.(error)
      },
      onDone(accumulatedText) {
        let completedMessage: Message | undefined
        setState(current => {
          const updatedMessages = current.messages.map(message => {
            if (message.id !== assistantId) return message
            completedMessage = { ...message, status: 'complete' }
            return completedMessage
          })
          return { ...current, messages: updatedMessages, status: 'idle', error: null }
        })
        emitter.emit({ type: 'llm:end', content: accumulatedText, durationMs: Date.now() - streamStart })
        if (completedMessage) config.onMessage?.(completedMessage)
      },
    })
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    async send(text) {
      if (!text.trim()) return

      const userMessage = buildMessage({ role: 'user', content: text })
      const assistantMessage = buildMessage({ role: 'assistant', content: '', status: 'streaming' })

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
      const replacementAssistant = buildMessage({ role: 'assistant', content: '', status: 'streaming' })

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
      await lifecycle.disposeAll()
      setState(current => ({
        ...current,
        messages: [],
        status: 'idle',
        error: null,
      }))
      await config.memory?.clear?.()
    },
    updateConfig(nextConfig) {
      void lifecycle.disposeAll()
      config = { ...config, ...nextConfig }
      skillsActivated = false
      rebuildToolMap()
      lifecycle = createToolLifecycle(toolMap)
      void ensureSkillsActivated()
      void hydrateMemory()
    },
  }
}
