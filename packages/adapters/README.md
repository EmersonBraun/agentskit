# @agentskit/adapters

LLM provider adapters for [AgentsKit](https://github.com/EmersonBraun/agentskit). Swap providers in one line.

## Install

```bash
npm install @agentskit/adapters
```

## Supported providers

```ts
import { anthropic, openai, gemini, ollama, vercelAI, generic, deepseek, grok, kimi, langchain } from '@agentskit/adapters'

// Claude
useChat({ adapter: anthropic({ apiKey, model: 'claude-sonnet-4-6' }) })

// GPT
useChat({ adapter: openai({ apiKey, model: 'gpt-4o' }) })

// Gemini
useChat({ adapter: gemini({ apiKey, model: 'gemini-2.5-flash' }) })

// Ollama (local)
useChat({ adapter: ollama({ model: 'llama3.1' }) })

// Vercel AI SDK
useChat({ adapter: vercelAI({ api: '/api/chat' }) })

// Any ReadableStream
useChat({ adapter: generic({ send: async (msgs) => fetch('/api', { body: JSON.stringify(msgs) }).then(r => r.body!) }) })
```

## Custom adapters

```ts
import { createAdapter, parseSSEStream } from '@agentskit/adapters'

const myAdapter = createAdapter({
  send: (request) => fetch('/api/chat', { method: 'POST', body: JSON.stringify(request) }),
  parse: (stream) => parseSSEStream(stream),
})
```

## Docs

[Full documentation](https://emersonbraun.github.io/agentskit/)
