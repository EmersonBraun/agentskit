# @agentskit/memory

Persist conversations and add vector search to your agents — swap backends without changing agent code.

## Why

- **Conversations that survive restarts** — SQLite for local development, Redis for production; your agent remembers context across sessions with zero code changes
- **RAG-ready vector search** — store and retrieve embeddings with `fileVectorMemory` (pure JS, no native deps) or Redis vector search for scale
- **Plug any backend** — the `VectorStore` interface is 3 methods; bring LanceDB, Pinecone, or any custom store in minutes

## Install

```bash
npm install @agentskit/memory better-sqlite3
# For production:  npm install redis
# For vectors:     npm install vectra
```

## Quick example

```ts
import { createRuntime } from '@agentskit/runtime'
import { anthropic } from '@agentskit/adapters'
import { sqliteChatMemory, fileVectorMemory } from '@agentskit/memory'

const runtime = createRuntime({
  adapter: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-sonnet-4-6' }),
  memory: sqliteChatMemory({ path: './chat.db' }),
})

// Agent now remembers previous conversations across process restarts
const result = await runtime.run('What did we discuss yesterday?')
console.log(result.content)
```

## Docs

[Full documentation](https://emersonbraun.github.io/agentskit/)
