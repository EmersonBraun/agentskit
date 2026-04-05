import { describe, it, expect, vi } from 'vitest'
import { createRuntime } from '../src/runner'
import { createSequentialAdapter } from './helpers'
import type { AgentEvent, Observer } from '@agentskit/core'

describe('Integration: 3-step agent task', () => {
  it('agent researches, analyzes, and summarizes in 3 steps', async () => {
    const events: AgentEvent[] = []
    const obs: Observer = { name: 'trace', on: (e) => { events.push(e) } }

    // Step 1: Agent calls "search" tool
    // Step 2: Agent calls "analyze" tool with search results
    // Step 3: Agent produces final summary (no tool calls)
    const adapter = createSequentialAdapter([
      // Step 1: LLM decides to search
      [
        { type: 'text', content: 'I need to search for information first.' },
        { type: 'tool_call', toolCall: { id: 'tc1', name: 'search', args: '{"query":"quantum computing basics"}' } },
        { type: 'done' },
      ],
      // Step 2: LLM analyzes the search results
      [
        { type: 'text', content: 'Now let me analyze these results.' },
        { type: 'tool_call', toolCall: { id: 'tc2', name: 'analyze', args: '{"data":"search results about qubits and superposition"}' } },
        { type: 'done' },
      ],
      // Step 3: LLM produces final answer
      [
        { type: 'text', content: 'Quantum computing uses qubits that leverage superposition and entanglement to perform calculations exponentially faster than classical computers for certain problems.' },
        { type: 'done' },
      ],
    ])

    const searchTool = {
      name: 'search',
      init: vi.fn(),
      dispose: vi.fn(),
      execute: async (args: Record<string, unknown>) =>
        `Found 3 articles about ${args.query}: qubits, superposition, entanglement`,
    }

    const analyzeTool = {
      name: 'analyze',
      init: vi.fn(),
      dispose: vi.fn(),
      execute: async (args: Record<string, unknown>) =>
        `Analysis of "${args.data}": key concepts are qubits, superposition, and entanglement`,
    }

    const runtime = createRuntime({
      adapter,
      tools: [searchTool, analyzeTool],
      systemPrompt: 'You are a research assistant. Use tools to gather and analyze information before answering.',
      observers: [obs],
    })

    const result = await runtime.run('Explain quantum computing')

    // Verify result structure
    expect(result.steps).toBe(3)
    expect(result.content.toLowerCase()).toContain('quantum computing')
    expect(result.content).toContain('qubits')
    expect(result.durationMs).toBeGreaterThanOrEqual(0)

    // Verify tool calls
    expect(result.toolCalls).toHaveLength(2)
    expect(result.toolCalls[0].name).toBe('search')
    expect(result.toolCalls[0].status).toBe('complete')
    expect(result.toolCalls[0].result).toContain('qubits')
    expect(result.toolCalls[1].name).toBe('analyze')
    expect(result.toolCalls[1].status).toBe('complete')

    // Verify message history structure
    // system, user, assistant(search), tool(search result), assistant(analyze), tool(analyze result), assistant(final)
    expect(result.messages[0].role).toBe('system')
    expect(result.messages[1].role).toBe('user')
    expect(result.messages[1].content).toBe('Explain quantum computing')

    const toolMessages = result.messages.filter(m => m.role === 'tool')
    expect(toolMessages).toHaveLength(2)
    expect(toolMessages[0].content).toContain('qubits')
    expect(toolMessages[1].content).toContain('Analysis')

    const assistantMessages = result.messages.filter(m => m.role === 'assistant')
    expect(assistantMessages).toHaveLength(3)
    expect(assistantMessages[0].toolCalls).toHaveLength(1)
    expect(assistantMessages[1].toolCalls).toHaveLength(1)
    expect(assistantMessages[2].toolCalls).toBeUndefined()

    // Verify lazy init — both tools initialized, then disposed
    expect(searchTool.init).toHaveBeenCalledTimes(1)
    expect(analyzeTool.init).toHaveBeenCalledTimes(1)
    expect(searchTool.dispose).toHaveBeenCalledTimes(1)
    expect(analyzeTool.dispose).toHaveBeenCalledTimes(1)

    // Verify events
    const stepEvents = events.filter(e => e.type === 'agent:step')
    expect(stepEvents).toHaveLength(3)

    const llmStarts = events.filter(e => e.type === 'llm:start')
    expect(llmStarts).toHaveLength(3)

    const llmEnds = events.filter(e => e.type === 'llm:end')
    expect(llmEnds).toHaveLength(3)

    const toolStarts = events.filter(e => e.type === 'tool:start')
    expect(toolStarts).toHaveLength(2)
    expect(toolStarts[0].type === 'tool:start' && toolStarts[0].name).toBe('search')
    expect(toolStarts[1].type === 'tool:start' && toolStarts[1].name).toBe('analyze')

    const toolEnds = events.filter(e => e.type === 'tool:end')
    expect(toolEnds).toHaveLength(2)

    const memorySave = events.find(e => e.type === 'memory:save')
    expect(memorySave).toBeUndefined() // no memory configured in this test
  })
})
