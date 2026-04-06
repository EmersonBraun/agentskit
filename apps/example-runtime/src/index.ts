import { createRuntime } from '@agentskit/runtime'
import { researcher } from '@agentskit/skills'
import type { AdapterFactory, AgentEvent, Observer, ToolDefinition } from '@agentskit/core'

// Demo adapter with hardcoded tool-call sequence
function createDemoAdapter(): AdapterFactory {
  let callCount = 0
  return {
    createSource: () => {
      callCount++
      const chunks = callCount === 1
        ? [
            { type: 'tool_call' as const, toolCall: { id: 'tc1', name: 'web_search', args: '{"q":"latest AI safety research"}' } },
            { type: 'done' as const },
          ]
        : [
            { type: 'text' as const, content: 'Based on my research, the latest developments in AI safety include: ' },
            { type: 'text' as const, content: '1) Constitutional AI methods for alignment, ' },
            { type: 'text' as const, content: '2) Mechanistic interpretability breakthroughs, ' },
            { type: 'text' as const, content: '3) Red-teaming frameworks becoming standard practice.' },
            { type: 'done' as const },
          ]
      let aborted = false
      return {
        stream: async function* () {
          for (const chunk of chunks) {
            if (aborted) return
            await new Promise(r => setTimeout(r, 30))
            yield chunk
          }
        },
        abort: () => { aborted = true },
      }
    },
  }
}

const webSearch: ToolDefinition = {
  name: 'web_search',
  description: 'Search the web for information',
  schema: {
    type: 'object',
    properties: { q: { type: 'string', description: 'Search query' } },
    required: ['q'],
  },
  execute: async (args) => {
    return `Search results for "${args.q}": [1] Constitutional AI paper (2024), [2] Interpretability advances (2025), [3] Red-teaming best practices report`
  },
}

const verbose: Observer = {
  name: 'console',
  on(event: AgentEvent) {
    if (event.type === 'agent:step') process.stderr.write(`[step ${event.step}] ${event.action}\n`)
    if (event.type === 'tool:start') process.stderr.write(`[tool] ${event.name}\n`)
    if (event.type === 'tool:end') process.stderr.write(`[tool] ${event.name} done (${event.durationMs}ms)\n`)
  },
}

const adapter = createDemoAdapter()
const runtime = createRuntime({ adapter, tools: [webSearch], observers: [verbose] })

const result = await runtime.run('Research the latest developments in AI safety', {
  skill: researcher,
})

process.stdout.write(result.content + '\n')
process.stderr.write(`\nCompleted in ${result.durationMs}ms, ${result.steps} steps, ${result.toolCalls.length} tool calls\n`)
