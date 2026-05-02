'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { chunkText } from '@agentskit/rag/chunker'

const SEED_DOC = `## Q3 strategy

GTM expansion: target enterprise verticals in North America and Europe. Land-and-expand motion focused on dev tools, fintech, and healthcare. Hire two AEs per region by end of quarter.

Pricing rework: introduce tiered model with usage-based add-ons. Base tier $99/mo, pro tier $499/mo, enterprise quoted. Migration plan for legacy customers grandfathered for 12 months.

Onboarding cuts: reduce time-to-first-value to under 5 minutes. New welcome flow, in-product tooltips, and seeded sample data. Expect 40% lift in W1 activation.

Reliability: target 99.95% uptime. Add multi-region failover, expand on-call rotation to 6 engineers, publish public status page.

Hiring: close two senior engineering roles, one DPE, one design lead. Compensation benchmark refreshed against current market.`

function tokenize(s: string): Set<string> {
  return new Set(s.toLowerCase().match(/[a-z0-9]+/g) ?? [])
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  const union = a.size + b.size - inter
  return inter / union
}

export function RAGCiteExample() {
  const [doc, setDoc] = useState(SEED_DOC)
  const [chunkSize, setChunkSize] = useState(220)
  const [overlap, setOverlap] = useState(40)
  const [query, setQuery] = useState('how should we change pricing?')
  const [k, setK] = useState(3)

  const chunks = useMemo(
    () =>
      chunkText(doc, {
        chunkSize,
        chunkOverlap: overlap,
        split: (text: string) => {
          const sentences = text
            .split(/(?<=[.!?\n])\s+/)
            .map(s => s.trim())
            .filter(Boolean)
          const out: string[] = []
          let buf = ''
          for (const s of sentences) {
            if (!buf) {
              buf = s
            } else if (buf.length + 1 + s.length <= chunkSize) {
              buf += ' ' + s
            } else {
              out.push(buf)
              buf = s
            }
          }
          if (buf) out.push(buf)
          return out
        },
      }),
    [doc, chunkSize, overlap],
  )

  const ranked = useMemo(() => {
    const q = tokenize(query)
    return chunks
      .map((c, i) => ({ id: i + 1, text: c, score: jaccard(q, tokenize(c)) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
  }, [chunks, query, k])

  const answer = ranked.length === 0 || ranked[0].score === 0
    ? 'No matching context found in the corpus.'
    : `Top match suggests: ${ranked[0].text.slice(0, 140).trim()}… ${ranked.map(r => `[§${r.id}]`).join(' ')}`

  return (
    <div data-ak-example className="flex flex-col gap-3 rounded-lg border border-ak-border bg-ak-surface p-4">
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="text-ak-graphite">@agentskit/rag · chunkText · in-memory retrieval</span>
        <span className="text-ak-graphite">{chunks.length} chunks · top-{k}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10px] text-ak-graphite">document</div>
          <textarea
            value={doc}
            onChange={e => setDoc(e.target.value)}
            className="min-h-[180px] resize-none rounded-md border border-ak-border bg-ak-midnight p-2 font-mono text-[11px] text-ak-foam outline-none focus:border-ak-blue"
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="font-mono text-[10px] text-ak-graphite">
              chunkSize: {chunkSize}
              <input
                type="range"
                min={80}
                max={500}
                value={chunkSize}
                onChange={e => setChunkSize(Number(e.target.value))}
                className="w-full"
              />
            </label>
            <label className="font-mono text-[10px] text-ak-graphite">
              chunkOverlap: {overlap}
              <input
                type="range"
                min={0}
                max={120}
                value={overlap}
                onChange={e => setOverlap(Number(e.target.value))}
                className="w-full"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10px] text-ak-graphite">query</div>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 rounded-md border border-ak-border bg-ak-midnight px-2 py-1.5 font-mono text-xs text-ak-foam outline-none focus:border-ak-blue"
            />
            <select
              value={k}
              onChange={e => setK(Number(e.target.value))}
              className="rounded-md border border-ak-border bg-ak-midnight px-2 py-1.5 font-mono text-xs text-ak-foam outline-none"
            >
              <option value={1}>k=1</option>
              <option value={2}>k=2</option>
              <option value={3}>k=3</option>
              <option value={5}>k=5</option>
            </select>
          </div>

          <div className="font-mono text-[10px] text-ak-graphite">retrieved chunks</div>
          <div className="flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {ranked.map(r => (
                <motion.div
                  key={`${r.id}-${query}`}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-md border border-ak-border bg-ak-midnight p-2"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="rounded bg-ak-blue/15 px-1.5 py-0.5 font-mono text-[10px] text-ak-blue">
                      §{r.id}
                    </span>
                    <span className="font-mono text-[10px] text-ak-green">
                      {r.score.toFixed(3)}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-ak-foam">{r.text}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="rounded-md border border-ak-green/30 bg-ak-green/5 p-2">
            <div className="mb-1 font-mono text-[10px] text-ak-graphite">answer (with cites)</div>
            <div className="font-mono text-[11px] text-ak-foam">{answer}</div>
          </div>
        </div>
      </div>

      <div className="font-mono text-[10px] text-ak-graphite">
        chunkText is real · embedder + vector store stubbed (jaccard) · swap with createRAG for production
      </div>
    </div>
  )
}
