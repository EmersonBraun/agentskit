'use client'

import { useRef, useState } from 'react'
import { createTraceTracker, type TraceSpan } from '@agentskit/observability/trace-tracker'
import { computeCost, priceFor } from '@agentskit/observability/cost-guard'
import type { AgentEvent } from '@agentskit/core'

const SCRIPT: AgentEvent[] = [
  { type: 'agent:step', step: 1, action: 'plan' },
  { type: 'llm:start', model: 'claude-sonnet-4-6', messageCount: 3 },
  { type: 'llm:first-token', latencyMs: 412 },
  {
    type: 'llm:end',
    content: 'Need to search the web first.',
    usage: { promptTokens: 320, completionTokens: 64 },
    durationMs: 612,
  },
  { type: 'tool:start', name: 'web_search', args: { q: 'agent frameworks 2026' } },
  { type: 'tool:end', name: 'web_search', result: '12 results', durationMs: 480 },
  { type: 'agent:step', step: 2, action: 'synthesize' },
  { type: 'llm:start', model: 'claude-sonnet-4-6', messageCount: 5 },
  { type: 'llm:first-token', latencyMs: 280 },
  {
    type: 'llm:end',
    content: 'Synthesized answer with citations.',
    usage: { promptTokens: 1240, completionTokens: 380 },
    durationMs: 980,
  },
]

export function ObservabilityTrace() {
  const [spans, setSpans] = useState<TraceSpan[]>([])
  const [running, setRunning] = useState(false)
  const [costUsd, setCostUsd] = useState(0)
  const [tokens, setTokens] = useState({ prompt: 0, completion: 0 })
  const trackerRef = useRef<ReturnType<typeof createTraceTracker> | null>(null)

  const reset = () => {
    setSpans([])
    setCostUsd(0)
    setTokens({ prompt: 0, completion: 0 })
  }

  const run = async () => {
    setRunning(true)
    reset()
    trackerRef.current = createTraceTracker({
      onSpanStart: () => {},
      onSpanEnd: span => setSpans(prev => [...prev, span]),
    })
    let p = 0
    let c = 0
    for (const ev of SCRIPT) {
      await new Promise(r => setTimeout(r, 220))
      trackerRef.current.handle(ev)
      if (ev.type === 'llm:end' && ev.usage) {
        p += ev.usage.promptTokens
        c += ev.usage.completionTokens
        setTokens({ prompt: p, completion: c })
        setCostUsd(prev => prev + computeCost(
          { promptTokens: ev.usage!.promptTokens, completionTokens: ev.usage!.completionTokens },
          priceFor('claude-sonnet-4-6'),
        ))
      }
    }
    setRunning(false)
  }

  const ordered = [...spans].sort((a, b) => a.startTime - b.startTime || b.parentId === a.id ? -1 : 0)
  const t0 = ordered.length ? Math.min(...ordered.map(s => s.startTime)) : 0
  const tEnd = ordered.length ? Math.max(...ordered.map(s => s.endTime ?? s.startTime)) : 0
  const totalMs = tEnd - t0

  return (
    <div data-ak-example className="flex flex-col gap-3 rounded-lg border border-ak-border bg-ak-surface p-4">
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="text-ak-graphite">@agentskit/observability · createTraceTracker · computeCost</span>
        <span className="text-ak-graphite">model: claude-sonnet-4-6</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="rounded-md bg-ak-blue/20 px-3 py-1.5 font-mono text-xs text-ak-blue disabled:opacity-50"
        >
          {running ? 'streaming spans…' : '▶ simulate agent run'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-ak-border px-3 py-1.5 font-mono text-xs text-ak-graphite"
        >
          reset
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 font-mono text-xs">
        <Stat label="spans" val={String(spans.length)} />
        <Stat label="total" val={`${totalMs}ms`} />
        <Stat label="tokens" val={`${(tokens.prompt + tokens.completion).toLocaleString()}`} />
        <Stat label="cost" val={`$${costUsd.toFixed(4)}`} />
      </div>

      <div className="rounded-md border border-ak-border bg-ak-midnight p-3">
        {spans.length === 0 && (
          <div className="font-mono text-[11px] text-ak-graphite">— no spans yet —</div>
        )}
        <div className="flex flex-col gap-1.5">
          {ordered.map(s => {
            const dur = (s.endTime ?? s.startTime) - s.startTime
            const off = totalMs ? (((s.startTime - t0) / totalMs) * 100) : 0
            const w = totalMs ? Math.max((dur / totalMs) * 100, 1.5) : 1.5
            const indent = s.parentId ? 'pl-4' : ''
            const color = s.name.includes('llm')
              ? 'bg-ak-green'
              : s.name.includes('tool')
              ? 'bg-[#f0b429]'
              : 'bg-ak-blue'
            return (
              <div key={s.id} className={`font-mono text-[10px] ${indent}`}>
                <div className="mb-0.5 flex justify-between text-ak-graphite">
                  <span className="text-ak-foam">{s.name}</span>
                  <span>{dur}ms</span>
                </div>
                <div className="relative h-2 rounded bg-ak-surface">
                  <div className={`absolute top-0 h-2 rounded ${color}`} style={{ left: `${off}%`, width: `${w}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="font-mono text-[10px] text-ak-graphite">
        sinks: console · langsmith · opentelemetry · datadog · axiom · new-relic
      </div>
    </div>
  )
}

function Stat({ label, val }: { label: string; val: string }) {
  return (
    <div className="rounded-md border border-ak-border bg-ak-midnight p-2">
      <div className="text-[10px] text-ak-graphite">{label}</div>
      <div className="text-sm text-ak-foam">{val}</div>
    </div>
  )
}
