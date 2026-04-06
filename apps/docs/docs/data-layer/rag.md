---
sidebar_position: 3
---

# RAG (Retrieval-Augmented Generation)

Add knowledge retrieval to your agents with plug-and-play RAG.

## Install

```bash
npm install @agentskit/rag @agentskit/memory @agentskit/adapters
```

## Quick Start

```ts
import { createRAG } from '@agentskit/rag'
import { openaiEmbedder } from '@agentskit/adapters'
import { fileVectorMemory } from '@agentskit/memory'

const rag = createRAG({
  embed: openaiEmbedder({ apiKey: process.env.OPENAI_API_KEY }),
  store: fileVectorMemory({ path: './vectors' }),
})

// Ingest documents
await rag.ingest([
  { id: 'doc-1', content: 'AgentsKit is a JavaScript agent toolkit...' },
  { id: 'doc-2', content: 'The runtime supports ReAct loops...' },
])

// Retrieve relevant context
const docs = await rag.retrieve('How does AgentsKit work?', { topK: 3 })
```

## With Runtime

```ts
import { createRuntime } from '@agentskit/runtime'

const runtime = createRuntime({
  adapter: openai({ apiKey, model: 'gpt-4o' }),
  retriever: rag,  // auto-injects retrieved context into prompts
})

const result = await runtime.run('Explain the AgentsKit architecture')
```

## With React

```ts
import { useRAGChat } from '@agentskit/rag'

const chat = useRAGChat({
  adapter: openai({ apiKey, model: 'gpt-4o' }),
  rag,
})
```

## Chunking

Documents are automatically chunked before embedding:

```ts
const rag = createRAG({
  embed: openaiEmbedder({ apiKey }),
  store: fileVectorMemory({ path: './vectors' }),
  chunkSize: 512,    // characters per chunk (default: 1000)
  chunkOverlap: 50,  // overlap between chunks (default: 100)
})
```

## Bring Your Own Embedder

Any function matching `(text: string) => Promise<number[]>` works:

```ts
import { openaiEmbedder, geminiEmbedder, ollamaEmbedder } from '@agentskit/adapters'

openaiEmbedder({ apiKey, model: 'text-embedding-3-small' })
geminiEmbedder({ apiKey })
ollamaEmbedder({ model: 'nomic-embed-text' })

// Custom
const myEmbedder = async (text: string) => {
  const response = await fetch('/api/embed', { method: 'POST', body: text })
  return response.json()
}
```

## Vector Stores

RAG works with any `VectorMemory` from `@agentskit/memory`:

| Store | Best for |
|-------|----------|
| `fileVectorMemory` | Local development, small datasets |
| `redisVectorMemory` | Production, fast networked access |
| Custom `VectorStore` | LanceDB, Pinecone, Qdrant, etc. |

## Related

- [Memory](/docs/data-layer/memory) — vector storage backends
- [Adapters](/docs/data-layer/adapters) — embedder functions
- [Runtime](/docs/agents/runtime) — retriever integration
