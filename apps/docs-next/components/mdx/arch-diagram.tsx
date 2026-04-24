'use client'

import { useMemo, useState } from 'react'

type Pkg = { name: string; deps: string[]; row: number; col: number; tagline: string }

const PACKAGES: Pkg[] = [
  { name: 'core', deps: [], row: 0, col: 2, tagline: 'zero-dep foundation' },
  { name: 'adapters', deps: ['core'], row: 1, col: 0, tagline: 'provider adapters' },
  { name: 'runtime', deps: ['core'], row: 1, col: 1, tagline: 'autonomous agent loop' },
  { name: 'react', deps: ['core'], row: 1, col: 2, tagline: 'React hooks + UI' },
  { name: 'ink', deps: ['core'], row: 1, col: 3, tagline: 'terminal UI' },
  { name: 'vue', deps: ['core'], row: 1, col: 4, tagline: 'Vue hooks' },
  { name: 'tools', deps: ['core'], row: 2, col: 0, tagline: 'reusable tools' },
  { name: 'skills', deps: ['core'], row: 2, col: 1, tagline: 'prompt personas' },
  { name: 'memory', deps: ['core'], row: 2, col: 2, tagline: 'persistent memory' },
  { name: 'rag', deps: ['core'], row: 2, col: 3, tagline: 'plug-and-play RAG' },
  { name: 'observability', deps: ['core'], row: 2, col: 4, tagline: 'traces + logs' },
  { name: 'sandbox', deps: ['core'], row: 3, col: 0, tagline: 'secure code exec' },
  { name: 'eval', deps: ['core'], row: 3, col: 1, tagline: 'benchmarks' },
  { name: 'svelte', deps: ['core'], row: 3, col: 2, tagline: 'Svelte stores' },
  { name: 'solid', deps: ['core'], row: 3, col: 3, tagline: 'Solid signals' },
  { name: 'cli', deps: ['core', 'runtime', 'adapters', 'tools', 'ink', 'memory', 'rag', 'skills'], row: 3, col: 4, tagline: 'one-shot chat + init' },
]

const W = 140
const H = 72
const GAP_X = 28
const GAP_Y = 40

function pos(p: Pkg) {
  return { x: p.col * (W + GAP_X) + 12, y: p.row * (H + GAP_Y) + 12 }
}

export function ArchDiagram() {
  const [hover, setHover] = useState<string | null>(null)
  const [locked, setLocked] = useState<string | null>(null)
  const active = locked ?? hover

  const byName = useMemo(() => Object.fromEntries(PACKAGES.map((p) => [p.name, p])), [])

  const rels = useMemo(() => {
    const out: { from: string; to: string }[] = []
    for (const p of PACKAGES) for (const d of p.deps) out.push({ from: p.name, to: d })
    return out
  }, [])

  const activeSet = useMemo(() => {
    if (!active) return null
    const s = new Set<string>([active])
    const me = byName[active]
    if (me) for (const d of me.deps) s.add(d)
    for (const p of PACKAGES) if (p.deps.includes(active)) s.add(p.name)
    return s
  }, [active, byName])

  const cols = Math.max(...PACKAGES.map((p) => p.col)) + 1
  const rows = Math.max(...PACKAGES.map((p) => p.row)) + 1
  const width = cols * (W + GAP_X) + 12
  const height = rows * (H + GAP_Y) + 12

  return (
    <div data-ak-arch className="my-6 overflow-hidden rounded-lg border border-ak-border bg-ak-surface">
      <div className="flex items-center justify-between border-b border-ak-border px-4 py-2">
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-ak-graphite">
          Package graph · click to lock · hover to explore
        </div>
        {locked ? (
          <button
            type="button"
            onClick={() => setLocked(null)}
            className="rounded border border-ak-border bg-ak-midnight px-2 py-0.5 font-mono text-[10px] text-ak-graphite hover:text-ak-foam"
          >
            clear
          </button>
        ) : null}
      </div>
      <div className="overflow-x-auto p-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-full"
          role="img"
          aria-label="AgentsKit package dependency graph"
        >
          <g>
            {rels.map((r, i) => {
              const a = byName[r.from]
              const b = byName[r.to]
              if (!a || !b) return null
              const pa = pos(a)
              const pb = pos(b)
              const x1 = pa.x + W / 2
              const y1 = pa.y
              const x2 = pb.x + W / 2
              const y2 = pb.y + H
              const isActive = activeSet && activeSet.has(r.from) && activeSet.has(r.to)
              return (
                <path
                  key={i}
                  d={`M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`}
                  fill="none"
                  stroke={isActive ? 'var(--ak-foam, #a5f3fc)' : 'var(--ak-border, #1e293b)'}
                  strokeWidth={isActive ? 2 : 1}
                  opacity={activeSet && !isActive ? 0.2 : 1}
                />
              )
            })}
          </g>
          <g>
            {PACKAGES.map((p) => {
              const { x, y } = pos(p)
              const isActive = activeSet?.has(p.name)
              const dimmed = activeSet && !isActive
              const isRoot = p.name === active
              return (
                <g
                  key={p.name}
                  transform={`translate(${x},${y})`}
                  onMouseEnter={() => setHover(p.name)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setLocked((l) => (l === p.name ? null : p.name))}
                  style={{ cursor: 'pointer', opacity: dimmed ? 0.35 : 1, transition: 'opacity 150ms' }}
                >
                  <rect
                    width={W}
                    height={H}
                    rx={10}
                    fill={isRoot ? 'var(--ak-foam, #a5f3fc)' : 'var(--ak-midnight, #0f172a)'}
                    stroke={isActive ? 'var(--ak-foam, #a5f3fc)' : 'var(--ak-border, #1e293b)'}
                    strokeWidth={isActive ? 2 : 1}
                  />
                  <text
                    x={W / 2}
                    y={28}
                    textAnchor="middle"
                    fill={isRoot ? 'var(--ak-midnight, #0f172a)' : 'white'}
                    fontFamily="var(--font-mono, monospace)"
                    fontSize={13}
                    fontWeight={600}
                  >
                    @agentskit/{p.name}
                  </text>
                  <text
                    x={W / 2}
                    y={50}
                    textAnchor="middle"
                    fill={isRoot ? 'var(--ak-midnight, #0f172a)' : 'var(--ak-graphite, #94a3b8)'}
                    fontFamily="var(--font-sans, system-ui)"
                    fontSize={10}
                  >
                    {p.tagline}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
      </div>
    </div>
  )
}
