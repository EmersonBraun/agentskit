import type { RetrievedDocument, Retriever, RetrieverRequest } from '@agentskit/core'

export type RerankFn = (
  input: { query: string; documents: RetrievedDocument[] },
) => Promise<RetrievedDocument[]> | RetrievedDocument[]

export interface RerankedRetrieverOptions {
  /** Pull N candidates from the base retriever before reranking. Default 20. */
  candidatePool?: number
  /** Return top-K after reranking. Default 5. */
  topK?: number
  /** Reranker implementation. Default: the built-in `bm25Rerank`. */
  rerank?: RerankFn
}

/**
 * Wrap any base `Retriever` with a reranker. Typical flow:
 *   1. Vector search returns ~20 candidates (`candidatePool`)
 *   2. `rerank` re-scores them with a stronger signal (Cohere Rerank,
 *      BGE cross-encoder, or BM25 for keyword-aware hybrid search)
 *   3. Top `topK` are returned
 */
export function createRerankedRetriever(
  base: Retriever,
  options: RerankedRetrieverOptions = {},
): Retriever {
  const candidatePool = Math.max(1, options.candidatePool ?? 20)
  const topK = Math.max(1, options.topK ?? 5)
  const rerank = options.rerank ?? bm25Rerank

  return {
    async retrieve(request: RetrieverRequest) {
      const candidates = (await base.retrieve(request)).slice(0, candidatePool)
      const reranked = await rerank({ query: request.query, documents: candidates })
      return reranked.slice(0, topK)
    },
  }
}

// ---------------------------------------------------------------------------
// BM25 — standalone scorer + a RerankFn using it
// ---------------------------------------------------------------------------

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter(t => t.length > 0)
}

export interface BM25Options {
  /** Free term-saturation knob. Default 1.5. */
  k1?: number
  /** Length-normalization weight. Default 0.75. */
  b?: number
}

/**
 * Score a set of documents against a query using classic BM25.
 * Returns the input documents augmented with a `.score` field,
 * sorted by score descending.
 */
export function bm25Score(
  query: string,
  documents: RetrievedDocument[],
  options: BM25Options = {},
): RetrievedDocument[] {
  const k1 = options.k1 ?? 1.5
  const b = options.b ?? 0.75
  const qTerms = tokenize(query)
  const N = documents.length
  if (N === 0 || qTerms.length === 0) return documents

  const docTerms = documents.map(d => tokenize(d.content))
  const avgdl = docTerms.reduce((acc, t) => acc + t.length, 0) / N

  // Document frequency per term.
  const df = new Map<string, number>()
  for (const terms of docTerms) {
    const seen = new Set(terms)
    for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1)
  }

  const scored = documents.map((doc, i) => {
    const terms = docTerms[i]!
    const dl = terms.length
    const tf = new Map<string, number>()
    for (const t of terms) tf.set(t, (tf.get(t) ?? 0) + 1)

    let score = 0
    for (const q of qTerms) {
      const f = tf.get(q) ?? 0
      if (f === 0) continue
      const n = df.get(q) ?? 0
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5))
      const norm = 1 - b + b * (dl / (avgdl || 1))
      score += idf * ((f * (k1 + 1)) / (f + k1 * norm))
    }
    return { ...doc, score }
  })

  return scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
}

/** `RerankFn` backed by `bm25Score`. */
export const bm25Rerank: RerankFn = ({ query, documents }) => bm25Score(query, documents)

// ---------------------------------------------------------------------------
// Hybrid search — merge a vector retriever with a keyword (BM25) pass
// ---------------------------------------------------------------------------

export interface HybridRetrieverOptions {
  /** Relative weight of the vector score in the final ranking. Default 0.6. */
  vectorWeight?: number
  /** Relative weight of the BM25 score. Default 0.4. */
  bm25Weight?: number
  /** topK emitted after merging. Default 5. */
  topK?: number
  /** Candidate pool to pull from the base retriever. Default 20. */
  candidatePool?: number
}

function normalize(docs: RetrievedDocument[]): Map<string, number> {
  const scores = docs.map(d => d.score ?? 0)
  const max = Math.max(...scores, 0)
  const map = new Map<string, number>()
  for (const d of docs) {
    map.set(d.id, max > 0 ? (d.score ?? 0) / max : 0)
  }
  return map
}

/**
 * Combine a vector-backed `base` retriever with a BM25 keyword pass
 * over the same candidate pool. Final score is a weighted sum of the
 * two normalized scores.
 */
export function createHybridRetriever(
  base: Retriever,
  options: HybridRetrieverOptions = {},
): Retriever {
  const vectorWeight = options.vectorWeight ?? 0.6
  const bm25Weight = options.bm25Weight ?? 0.4
  const topK = Math.max(1, options.topK ?? 5)
  const candidatePool = Math.max(1, options.candidatePool ?? 20)

  return {
    async retrieve(request: RetrieverRequest) {
      const candidates = (await base.retrieve(request)).slice(0, candidatePool)
      if (candidates.length === 0) return candidates

      const vectorScores = normalize(candidates)
      const bm25Docs = bm25Score(request.query, candidates)
      const bm25Scores = normalize(bm25Docs)

      const merged: RetrievedDocument[] = candidates.map(d => ({
        ...d,
        score:
          vectorWeight * (vectorScores.get(d.id) ?? 0) +
          bm25Weight * (bm25Scores.get(d.id) ?? 0),
      }))

      merged.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      return merged.slice(0, topK)
    },
  }
}
