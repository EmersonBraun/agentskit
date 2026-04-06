---
sidebar_position: 2
---

# Memory

`@agentskit/memory` provides pluggable backends for chat history (`ChatMemory`) and semantic vector search (`VectorMemory`). All backends use **lazy imports** — the underlying driver is loaded only when the memory is first used, so unused backends add no runtime cost.

## Install

```bash
npm install @agentskit/memory
```

## Backend Comparison

| Backend | Type | Persistence | Extra dependency | Best for |
|---|---|---|---|---|
| `sqliteChatMemory` | Chat | File (SQLite) | `better-sqlite3` | Single-server, local dev |
| `redisChatMemory` | Chat | Remote (Redis) | `redis` | Multi-instance, production |
| `redisVectorMemory` | Vector | Remote (Redis Stack) | `redis` | Production semantic search |
| `fileVectorMemory` | Vector | File (JSON via vectra) | `vectra` | Local dev, prototyping |

## Chat Memory

Chat memory persists conversation history across sessions. Pass it to `useChat` via the `memory` option.

### SQLite

```bash
npm install better-sqlite3
```

```ts
import { sqliteChatMemory } from '@agentskit/memory'

const memory = sqliteChatMemory({
  path: './chat.db',
  conversationId: 'user-123', // optional, default: 'default'
})
```

The database and table are created automatically on first use.

### Redis

```bash
npm install redis
```

```ts
import { redisChatMemory } from '@agentskit/memory'

const memory = redisChatMemory({
  url: process.env.REDIS_URL!,         // e.g. redis://localhost:6379
  conversationId: 'user-123',          // optional
  keyPrefix: 'myapp:chat',             // optional, default: 'agentskit:chat'
})
```

### Using chat memory with `useChat`

```tsx
import { useChat } from '@agentskit/react'
import { anthropic } from '@agentskit/adapters'
import { sqliteChatMemory } from '@agentskit/memory'

const memory = sqliteChatMemory({ path: './chat.db', conversationId: 'session-1' })

function Chat() {
  const chat = useChat({
    adapter: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, model: 'claude-sonnet-4-6' }),
    memory,
  })
  // ...
}
```

## Vector Memory

Vector memory stores embeddings for semantic search. It is used by `@agentskit/rag` but can also be queried directly.

### File-based (vectra)

```bash
npm install vectra
```

```ts
import { fileVectorMemory } from '@agentskit/memory'

const store = fileVectorMemory({
  path: './vector-index', // directory where the index files are stored
})
```

### Redis Vector (Redis Stack / Redis Cloud)

Requires a Redis instance with the [RediSearch module](https://redis.io/docs/interact/search-and-query/) enabled (Redis Stack, Redis Cloud, Upstash with Search).

```bash
npm install redis
```

```ts
import { redisVectorMemory } from '@agentskit/memory'

const store = redisVectorMemory({
  url: process.env.REDIS_URL!,
  indexName: 'myapp:docs:idx',    // optional
  keyPrefix: 'myapp:vec',         // optional
  dimensions: 1536,               // optional — auto-detected from first insert
})
```

The HNSW index is created automatically on first write.

### Storing and searching manually

```ts
import { openaiEmbedder } from '@agentskit/adapters'

const embed = openaiEmbedder({ apiKey: process.env.OPENAI_API_KEY! })

// Store
await store.store([{
  id: 'doc-1',
  content: 'AgentsKit makes AI chat easy.',
  embedding: await embed('AgentsKit makes AI chat easy.'),
  metadata: { source: 'readme' },
}])

// Search
const queryEmbedding = await embed('how do I build a chatbot?')
const results = await store.search(queryEmbedding, { topK: 3, threshold: 0.7 })
```

## Custom VectorStore

Provide your own storage backend by implementing the `VectorStore` interface. Pass it to `fileVectorMemory` via the `store` option.

```ts
import type { VectorStore, VectorStoreDocument, VectorStoreResult } from '@agentskit/memory'
import { fileVectorMemory } from '@agentskit/memory'

const myStore: VectorStore = {
  async upsert(docs: VectorStoreDocument[]): Promise<void> {
    // persist docs to your database
  },
  async query(vector: number[], topK: number): Promise<VectorStoreResult[]> {
    // return nearest neighbours
    return []
  },
  async delete(ids: string[]): Promise<void> {
    // remove by id
  },
}

const memory = fileVectorMemory({ path: '', store: myStore })
```

## RedisClientAdapter for library portability

If you already have a Redis client (e.g., `ioredis`), wrap it with `RedisClientAdapter` instead of letting the library create its own connection.

```ts
import type { RedisClientAdapter } from '@agentskit/memory'
import { redisChatMemory } from '@agentskit/memory'
import IORedis from 'ioredis'

const ioredis = new IORedis(process.env.REDIS_URL)

const clientAdapter: RedisClientAdapter = {
  get: (key) => ioredis.get(key),
  set: (key, value) => ioredis.set(key, value).then(() => undefined),
  del: (key) => ioredis.del(Array.isArray(key) ? key : [key]).then(() => undefined),
  keys: (pattern) => ioredis.keys(pattern),
  disconnect: () => ioredis.quit().then(() => undefined),
  call: (cmd, ...args) => ioredis.call(cmd, ...args.map(String)),
}

const memory = redisChatMemory({
  url: '',          // ignored when client is provided
  client: clientAdapter,
  conversationId: 'session-1',
})
```

## Lazy imports pattern

All backends load their drivers with a dynamic `import()` or `require()` on first use. This means you only pay the cost of `better-sqlite3`, `redis`, or `vectra` when that backend is actually instantiated — not at module load time.

## Related

- [Adapters](./adapters.md) — embedder functions used to generate vectors
- [RAG](./rag.md) — full retrieval-augmented generation pipeline using VectorMemory
- [useChat hook](../hooks/use-chat.md) — pass `memory` to a chat session
