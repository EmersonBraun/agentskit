---
'@agentskit/eval': minor
'@agentskit/core': minor
'@agentskit/memory': minor
'@agentskit/rag': minor
---

Phase 2 sprint S16 — issues #152, #153, #154, #155.

- `@agentskit/eval/replay` — `replayAgainst(cassette, adapter)` +
  `summarizeReplay`. Iterate every recorded turn through a different
  adapter, get a Jaccard-based similarity and per-turn comparison.
  Cheap A/B of a production trace against a new model or fine-tune.
- `@agentskit/memory` — `createHierarchicalMemory({ working,
  archival, recall?, workingLimit, recallTopK })`. MemGPT-style three
  tiers: hot window always loaded, mid-term recall queried via any
  vector store, archival as source-of-truth. Recall errors are
  swallowed — degraded loads instead of hard failures.
- `@agentskit/core/auto-summarize` (subpath) —
  `createAutoSummarizingMemory(backing, { maxTokens, summarizer })`
  wraps any `ChatMemory`. Oldest non-summary messages fold into a
  tagged summary when saves exceed the budget; summaries are
  idempotent and never re-compacted.
- `@agentskit/rag` — `createRerankedRetriever(base, { rerank })` +
  `bm25Score` / `bm25Rerank` + `createHybridRetriever({ vectorWeight,
  bm25Weight })`. Pluggable reranker (Cohere Rerank, BGE, etc.) with
  BM25 as the zero-dep default; hybrid combines vector and keyword
  scores with weighted normalization.
