'use client'

import { useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { createAdapter } from '@agentskit/adapters/createAdapter'
import type { AdapterFactory } from '@agentskit/core'

type Provider = {
  id: string
  label: string
  model: string
  cps: number
  costPerKtok: number
  reply: string
}

const PROVIDERS: Provider[] = [
  {
    id: 'anthropic',
    label: 'anthropic',
    model: 'claude-sonnet-4-6',
    cps: 95,
    costPerKtok: 0.015,
    reply: 'Three principles: clear types, explicit error paths, observable side-effects.',
  },
  {
    id: 'openai',
    label: 'openai',
    model: 'gpt-4o',
    cps: 80,
    costPerKtok: 0.01,
    reply: 'Pick boring tech, keep state at the edges, write tests where it hurts.',
  },
  {
    id: 'gemini',
    label: 'gemini',
    model: 'gemini-2.5-pro',
    cps: 110,
    costPerKtok: 0.005,
    reply: 'Favor simplicity. Measure before optimizing. Ship small, ship often.',
  },
  {
    id: 'ollama',
    label: 'ollama (local)',
    model: 'llama3',
    cps: 40,
    costPerKtok: 0,
    reply: 'Reduce coupling. Make the change easy, then make the easy change.',
  },
]

function makeAdapter(p: Provider): AdapterFactory {
  return createAdapter({
    async send() {
      const enc = new TextEncoder()
      return new ReadableStream<Uint8Array>({
        async start(ctrl) {
          for (const ch of p.reply) {
            await new Promise(r => setTimeout(r, 1000 / p.cps))
            ctrl.enqueue(enc.encode(JSON.stringify({ type: 'text', content: ch }) + '\n'))
          }
          ctrl.enqueue(enc.encode(JSON.stringify({ type: 'done' }) + '\n'))
          ctrl.close()
        },
      })
    },
    async *parse(stream) {
      const reader = stream.getReader()
      const dec = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (line.trim()) yield JSON.parse(line)
        }
      }
    },
  })
}

type RaceState = { text: string; ms: number; done: boolean; tokens: number }

const EMPTY: RaceState = { text: '', ms: 0, done: false, tokens: 0 }

export function ProviderFanout() {
  const adapters = useMemo(
    () => Object.fromEntries(PROVIDERS.map(p => [p.id, makeAdapter(p)] as const)),
    [],
  )
  const [prompt, setPrompt] = useState('Three principles for writing maintainable code.')
  const [running, setRunning] = useState(false)
  const [state, setState] = useState<Record<string, RaceState>>(
    () => Object.fromEntries(PROVIDERS.map(p => [p.id, { ...EMPTY }])),
  )
  const startRef = useRef(0)

  const run = async () => {
    setRunning(true)
    startRef.current = performance.now()
    setState(Object.fromEntries(PROVIDERS.map(p => [p.id, { ...EMPTY }])))

    await Promise.all(
      PROVIDERS.map(async p => {
        const src = adapters[p.id].createSource({ messages: [{ role: 'user', content: prompt }] as any })
        for await (const ch of src.stream()) {
          if (ch.type === 'text' && 'content' in ch) {
            setState(prev => ({
              ...prev,
              [p.id]: {
                ...prev[p.id],
                text: prev[p.id].text + (ch.content as string),
                tokens: prev[p.id].tokens + 1,
                ms: Math.round(performance.now() - startRef.current),
              },
            }))
          }
          if (ch.type === 'done') {
            setState(prev => ({ ...prev, [p.id]: { ...prev[p.id], done: true } }))
          }
        }
      }),
    )
    setRunning(false)
  }

  const max = Math.max(1, ...Object.values(state).map(s => s.ms))

  return (
    <div data-ak-example className="flex flex-col gap-3 rounded-lg border border-ak-border bg-ak-surface p-4">
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="text-ak-graphite">@agentskit/adapters · createAdapter · fan-out same prompt</span>
        <span className="text-ak-graphite">{PROVIDERS.length} providers</span>
      </div>

      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          className="flex-1 rounded-md border border-ak-border bg-ak-midnight px-3 py-1.5 font-mono text-xs text-ak-foam outline-none focus:border-ak-blue"
        />
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="rounded-md bg-ak-blue/20 px-3 py-1.5 font-mono text-xs text-ak-blue disabled:opacity-50"
        >
          {running ? 'racing…' : '▶ fan out'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {PROVIDERS.map(p => {
          const s = state[p.id]
          const cost = ((s.tokens / 1000) * p.costPerKtok).toFixed(5)
          return (
            <div key={p.id} className="rounded-md border border-ak-border bg-ak-midnight p-3">
              <div className="mb-2 flex items-center justify-between font-mono text-[11px]">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${s.done ? 'bg-ak-green' : running ? 'animate-pulse bg-[#f0b429]' : 'bg-ak-border'}`} />
                  <span className="text-ak-foam">{p.label}</span>
                  <span className="text-ak-graphite">{p.model}</span>
                </div>
                <div className="flex gap-2 text-ak-graphite">
                  <span>{s.ms}ms</span>
                  <span className="text-ak-green">${cost}</span>
                </div>
              </div>
              <div className="mb-2 h-1 overflow-hidden rounded bg-ak-surface">
                <motion.div
                  initial={false}
                  animate={{ width: `${(s.ms / max) * 100}%` }}
                  className={`h-full ${s.done ? 'bg-ak-green' : 'bg-ak-blue'}`}
                />
              </div>
              <div className="min-h-[60px] font-mono text-[11px] text-ak-foam">
                {s.text}
                {!s.done && running && (
                  <span className="ml-0.5 inline-block h-3 w-[2px] translate-y-0.5 animate-pulse bg-ak-blue" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="font-mono text-[10px] text-ak-graphite">
        each adapter built via createAdapter — same prompt, parallel streams, real per-provider latency + cost
      </div>
    </div>
  )
}
