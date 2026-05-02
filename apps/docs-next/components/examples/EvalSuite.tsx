'use client'

import { useState } from 'react'
import { runEval, type EvalResult } from '@agentskit/eval'
import type { EvalSuite as EvalSuiteType } from '@agentskit/core'

const SUITE: EvalSuiteType = {
  name: 'regression',
  cases: [
    { input: '2 + 2', expected: '4' },
    { input: 'capital of france', expected: 'paris' },
    { input: 'reverse "abc"', expected: 'cba' },
    { input: 'first prime', expected: '2' },
    { input: 'square root of 16', expected: '4' },
    { input: 'json from { a:1 }', expected: '{"a":1}' },
  ],
}

const stubAgent = async (input: string): Promise<string> => {
  await new Promise(r => setTimeout(r, 80 + Math.random() * 220))
  const map: Record<string, string> = {
    '2 + 2': '4',
    'capital of france': 'Paris is the capital.',
    'reverse "abc"': 'cba',
    'first prime': '2',
    'square root of 16': 'sqrt(16) = 4',
    'json from { a:1 }': '{"a":1}',
  }
  if (input === 'first prime' && Math.random() < 0.18) return '1'
  return map[input] ?? 'unknown'
}

export function EvalSuite() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<EvalResult | null>(null)

  const run = async () => {
    setRunning(true)
    setResult(null)
    const r = await runEval({ agent: stubAgent, suite: SUITE })
    setResult(r)
    setRunning(false)
  }

  const totalLatency = result?.results.reduce((a, r) => a + r.latencyMs, 0) ?? 0
  const sorted = result ? [...result.results.map(r => r.latencyMs)].sort((a, b) => a - b) : []
  const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95) - 1] ?? sorted[sorted.length - 1] : 0

  return (
    <div data-ak-example className="flex flex-col gap-3 rounded-lg border border-ak-border bg-ak-surface p-4">
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="text-ak-graphite">@agentskit/eval · runEval</span>
        <span className="text-ak-graphite">suite: {SUITE.name} · {SUITE.cases.length} cases</span>
      </div>

      <button
        type="button"
        onClick={run}
        disabled={running}
        className="self-start rounded-md bg-ak-green/20 px-3 py-1.5 font-mono text-xs text-ak-green disabled:opacity-50"
      >
        {running ? 'running…' : '▶ run suite'}
      </button>

      {result && (
        <>
          <div className="grid grid-cols-4 gap-2 font-mono text-xs">
            <Stat label="passed" val={`${result.passed}/${result.totalCases}`} ok={result.failed === 0} />
            <Stat label="accuracy" val={`${Math.round(result.accuracy * 100)}%`} ok={result.accuracy === 1} />
            <Stat label="p95" val={`${p95}ms`} />
            <Stat label="total" val={`${totalLatency}ms`} />
          </div>

          <div className="overflow-hidden rounded-md border border-ak-border">
            <table className="w-full font-mono text-[11px]">
              <thead className="bg-ak-midnight text-ak-graphite">
                <tr>
                  <th className="px-2 py-1.5 text-left">input</th>
                  <th className="px-2 py-1.5 text-left">output</th>
                  <th className="px-2 py-1.5 text-right">ms</th>
                  <th className="px-2 py-1.5 text-right">status</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((r, i) => (
                  <tr key={i} className="border-t border-ak-border bg-ak-surface">
                    <td className="px-2 py-1.5 text-ak-foam">{r.input}</td>
                    <td className="px-2 py-1.5 text-ak-graphite">{r.output}</td>
                    <td className="px-2 py-1.5 text-right text-ak-graphite">{r.latencyMs}</td>
                    <td className={`px-2 py-1.5 text-right ${r.passed ? 'text-ak-green' : 'text-ak-red'}`}>
                      {r.passed ? '✓ pass' : '✗ fail'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="font-mono text-[10px] text-ak-graphite">
        agent.fn provided by you · runEval iterates suite.cases · returns accuracy + per-case latency
      </div>
    </div>
  )
}

function Stat({ label, val, ok }: { label: string; val: string; ok?: boolean }) {
  return (
    <div className="rounded-md border border-ak-border bg-ak-midnight p-2">
      <div className="text-[10px] text-ak-graphite">{label}</div>
      <div className={`text-sm ${ok === false ? 'text-ak-red' : ok ? 'text-ak-green' : 'text-ak-foam'}`}>{val}</div>
    </div>
  )
}
