# AgentsKit

**The complete toolkit for building AI agents in JavaScript.** Chat UIs, autonomous agents, tools, skills, memory, RAG, and observability — from prototype to production.

[![npm version](https://img.shields.io/npm/v/@agentskit/react)](https://www.npmjs.com/package/@agentskit/react)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@agentskit/react)](https://bundlephobia.com/package/@agentskit/react)
[![license](https://img.shields.io/npm/l/@agentskit/react)](https://github.com/EmersonBraun/agentskit/blob/main/LICENSE)

[Documentation](https://emersonbraun.github.io/agentskit/) | [npm](https://www.npmjs.com/package/@agentskit/react) | [GitHub](https://github.com/EmersonBraun/agentskit)

## Why AgentsKit?

- **Ship in minutes, not days.** A streaming chat UI in 10 lines. An autonomous agent in 5. No boilerplate.
- **Swap providers in one line.** OpenAI, Anthropic, Gemini, Ollama, or any LLM — change one import, everything else stays the same.
- **Agent-first architecture.** Not just chat — full ReAct loops, tool execution, multi-agent delegation, memory, RAG, and eval built in.
- **Zero lock-in.** Every package is independently installable. Use only what you need. The entire API fits in 2K tokens — paste it into any LLM and start building.

| | AgentsKit | Vercel AI SDK | assistant-ui |
|---|---------|--------------|-------------|
| **Setup** | 10 lines to working chat | Headless, needs UI work | 50+ components to learn |
| **Agents** | ReAct loop, tools, skills, delegation | No runtime | No runtime |
| **Providers** | 10+ adapters, swap in 1 line | Route-handler based | BYO backend |
| **Agent-friendly** | Entire API in 2K tokens | Large docs surface | Large docs surface |
| **Bundle** | Tree-shakeable, split packages | ~30KB | ~80KB |

## Quick Start: Chat UI (React)

```bash
npm install @agentskit/react @agentskit/adapters
```

```tsx
import { useChat, ChatContainer, Message, InputBar } from '@agentskit/react'
import { anthropic } from '@agentskit/adapters'
import '@agentskit/react/theme'

function Chat() {
  const chat = useChat({
    adapter: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, model: 'claude-sonnet-4-6' }),
  })
  return (
    <ChatContainer>
      {chat.messages.map(msg => <Message key={msg.id} message={msg} />)}
      <InputBar chat={chat} />
    </ChatContainer>
  )
}
```

You get streaming, tool calls, memory, and a default theme out of the box.

## Quick Start: Autonomous Agent (No UI)

```bash
npm install @agentskit/runtime @agentskit/adapters @agentskit/tools
```

```ts
import { createRuntime } from '@agentskit/runtime'
import { openai } from '@agentskit/adapters'
import { webSearch, filesystem } from '@agentskit/tools'

const runtime = createRuntime({
  adapter: openai({ apiKey: process.env.OPENAI_API_KEY!, model: 'gpt-4o' }),
  tools: [webSearch(), ...filesystem({ basePath: './workspace' })],
})

const result = await runtime.run('Research the top 3 AI frameworks and save a summary')
console.log(result.content)   // final answer
console.log(result.steps)     // how many think→act cycles
console.log(result.toolCalls) // every tool call made
```

## Quick Start: Terminal Chat

```bash
npm install -g @agentskit/cli
agentskit chat --provider ollama --model llama3.1
agentskit chat --provider openai --tools web_search,shell --skill researcher
```

## Swap providers in one line

```ts
import { anthropic, openai, gemini, ollama, deepseek, grok } from '@agentskit/adapters'

useChat({ adapter: anthropic({ apiKey, model: 'claude-sonnet-4-6' }) })
useChat({ adapter: openai({ apiKey, model: 'gpt-4o' }) })
useChat({ adapter: gemini({ apiKey, model: 'gemini-2.5-flash' }) })
useChat({ adapter: ollama({ model: 'llama3.1' }) })  // local, no API key
```

## The Ecosystem

| Package | What it does | When to use it |
|---------|-------------|----------------|
| [`@agentskit/core`](packages/core) | Types, contracts, shared primitives | You're building a framework on top of AgentsKit |
| [`@agentskit/react`](packages/react) | React hooks + headless UI components | Building chat UIs in the browser |
| [`@agentskit/ink`](packages/ink) | Terminal UI components (Ink) | Building chat UIs in the terminal |
| [`@agentskit/adapters`](packages/adapters) | 10+ LLM provider adapters + embedders | Connecting to any LLM |
| [`@agentskit/cli`](packages/cli) | CLI commands (chat, init, run) | Quick prototyping, scripting |
| [`@agentskit/runtime`](packages/runtime) | Autonomous agent runtime (ReAct loop) | Running agents without UI |
| [`@agentskit/tools`](packages/tools) | Web search, filesystem, shell tools | Giving agents real-world capabilities |
| [`@agentskit/skills`](packages/skills) | Pre-built behavioral prompts | Making agents good at specific tasks |
| [`@agentskit/memory`](packages/memory) | SQLite, Redis, vector storage | Persisting conversations and knowledge |
| [`@agentskit/rag`](packages/rag) | Retrieval-augmented generation | Adding knowledge to agents |
| [`@agentskit/observability`](packages/observability) | Console, LangSmith, OpenTelemetry | Debugging and monitoring agents |
| [`@agentskit/sandbox`](packages/sandbox) | Secure code execution (E2B) | Letting agents run code safely |
| [`@agentskit/eval`](packages/eval) | Agent evaluation and benchmarking | Measuring agent quality in CI/CD |

## Multi-Agent Delegation

```ts
import { planner, researcher, coder } from '@agentskit/skills'

const result = await runtime.run('Build a landing page about quantum computing', {
  skill: planner,
  delegates: {
    researcher: { skill: researcher, tools: [webSearch()], maxSteps: 3 },
    coder: { skill: coder, tools: [...filesystem({ basePath: './src' })], maxSteps: 8 },
  },
})
```

The planner breaks the task into subtasks, delegates research and coding to specialist agents, and assembles the final result.

## For AI Agents

The entire API fits in **under 2,000 tokens**. See the [agent-friendly reference](https://emersonbraun.github.io/agentskit/docs/getting-started/for-ai-agents) — paste it into your LLM context and start generating.

## License

MIT
