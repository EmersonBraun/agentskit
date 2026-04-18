import { describe, expect, it, vi } from 'vitest'
import type { RetrievedDocument, Retriever, RetrieverRequest } from '@agentskit/core'
import {
  bm25Score,
  bm25Rerank,
  createHybridRetriever,
  createRerankedRetriever,
} from '../src/rerank'

function doc(id: string, content: string, score = 0): RetrievedDocument {
  return { id, content, score }
}

function staticBase(docs: RetrievedDocument[]): Retriever {
  return {
    async retrieve(_req: RetrieverRequest) {
      return docs
    },
  }
}

describe('bm25Score', () => {
  it('ranks documents containing query terms higher', () => {
    const docs = [
      doc('a', 'the cat sat on the mat'),
      doc('b', 'machine learning changes everything'),
      doc('c', 'a cat named mittens'),
    ]
    const ranked = bm25Score('cat mat', docs)
    expect(ranked[0]!.id).toBe('a')
    expect(ranked[1]!.id).toBe('c')
    expect(ranked[2]!.id).toBe('b')
  })

  it('returns input unchanged when query is empty', () => {
    const docs = [doc('a', 'hello')]
    expect(bm25Score('', docs)).toEqual(docs)
  })

  it('returns empty for empty document list', () => {
    expect(bm25Score('q', [])).toEqual([])
  })

  it('respects custom k1 and b', () => {
    const docs = [
      doc('short', 'cat cat'),
      doc('long', 'cat ' + 'filler '.repeat(50)),
    ]
    const aggressive = bm25Score('cat', docs, { k1: 3, b: 1 })
    expect(aggressive[0]!.id).toBe('short')
  })
})

describe('bm25Rerank', () => {
  it('is usable as a RerankFn', async () => {
    const docs = [doc('a', 'apple'), doc('b', 'banana')]
    const ranked = await bm25Rerank({ query: 'apple', documents: docs })
    expect(ranked[0]!.id).toBe('a')
  })
})

describe('createRerankedRetriever', () => {
  it('widens the candidate pool then returns topK after reranking', async () => {
    const base = staticBase([
      doc('a', 'cats love naps', 0.9),
      doc('b', 'dogs chase sticks', 0.8),
      doc('c', 'cat nap spots', 0.7),
    ])
    const reranker = createRerankedRetriever(base, {
      candidatePool: 3,
      topK: 2,
    })
    const out = await reranker.retrieve({ query: 'cat nap', messages: [] })
    expect(out).toHaveLength(2)
    expect(out.map(d => d.id)).toEqual(['c', 'a'])
  })

  it('caps candidate pool before reranking', async () => {
    const retrieve = vi.fn(async () =>
      Array.from({ length: 50 }, (_, i) => doc(`d${i}`, `content ${i}`, 1 - i / 50)),
    )
    const base: Retriever = { retrieve }
    const reranker = createRerankedRetriever(base, { candidatePool: 5, topK: 2 })
    const out = await reranker.retrieve({ query: 'content', messages: [] })
    expect(out).toHaveLength(2)
  })

  it('custom rerank replaces the default', async () => {
    const base = staticBase([doc('a', 'x'), doc('b', 'y')])
    const rerank = vi.fn(async () => [doc('b', 'y', 2), doc('a', 'x', 1)])
    const reranker = createRerankedRetriever(base, { rerank, topK: 1 })
    const out = await reranker.retrieve({ query: 'q', messages: [] })
    expect(out[0]!.id).toBe('b')
    expect(rerank).toHaveBeenCalled()
  })
})

describe('createHybridRetriever', () => {
  it('merges vector + BM25 scores', async () => {
    const base = staticBase([
      doc('a', 'exact keyword match for cats', 0.5),
      doc('b', 'close semantic neighbor', 0.9),
      doc('c', 'unrelated', 0.1),
    ])
    const hybrid = createHybridRetriever(base, {
      vectorWeight: 0.5,
      bm25Weight: 0.5,
      topK: 2,
    })
    const out = await hybrid.retrieve({ query: 'cats', messages: [] })
    expect(out).toHaveLength(2)
    // "a" has the keyword match; "b" has the high vector score.
    // Both should appear in top-2.
    const ids = out.map(d => d.id)
    expect(ids).toContain('a')
    expect(ids).toContain('b')
  })

  it('empty candidate set returns empty', async () => {
    const hybrid = createHybridRetriever(staticBase([]))
    expect(await hybrid.retrieve({ query: 'q', messages: [] })).toEqual([])
  })

  it('pure BM25 wins when vectorWeight is zero', async () => {
    const base = staticBase([
      doc('high-vec', 'off topic', 1),
      doc('keyword', 'the cat sat', 0.01),
    ])
    const hybrid = createHybridRetriever(base, {
      vectorWeight: 0,
      bm25Weight: 1,
      topK: 1,
    })
    const out = await hybrid.retrieve({ query: 'cat', messages: [] })
    expect(out[0]!.id).toBe('keyword')
  })

  it('pure vector wins when bm25Weight is zero', async () => {
    const base = staticBase([
      doc('high-vec', 'off topic', 1),
      doc('keyword', 'the cat sat', 0.01),
    ])
    const hybrid = createHybridRetriever(base, {
      vectorWeight: 1,
      bm25Weight: 0,
      topK: 1,
    })
    const out = await hybrid.retrieve({ query: 'cat', messages: [] })
    expect(out[0]!.id).toBe('high-vec')
  })
})
