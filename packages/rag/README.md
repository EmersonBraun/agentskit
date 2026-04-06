# @agentskit/rag

Add your own knowledge to any agent in 3 lines — coming soon.

## Why

- **Your data, your agent** — chunk documents, embed them, and have agents retrieve exactly the right context at query time; no fine-tuning required
- **Works with what you already have** — plugs directly into `@agentskit/memory` vector backends and any embedder from `@agentskit/adapters`, so nothing new to learn
- **3-line integration** — `rag.ingest(docs)`, `rag.retrieve(query)`, and a drop-in `useRAGChat()` hook mean you go from idea to working knowledge base in minutes

> **Coming soon.** This package is scaffolded and will be implemented in a future release. See [#13](https://github.com/EmersonBraun/agentskit/issues/13).

## Planned API

```ts
import { createRAG } from '@agentskit/rag'
import { fileVectorMemory } from '@agentskit/memory'
import { anthropic } from '@agentskit/adapters'

const rag = createRAG({
  vectorMemory: fileVectorMemory({ path: './vectors' }),
  embedder: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
})

await rag.ingest([{ id: 'doc-1', content: 'Your knowledge base content here...' }])
const context = await rag.retrieve('What does the docs say about X?')
```

## Docs

[Full documentation](https://emersonbraun.github.io/agentskit/)
