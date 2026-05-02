'use client'

import { useMemo, useState } from 'react'
import { createSandbox } from '@agentskit/sandbox/sandbox'
import type { SandboxBackend, ExecuteResult } from '@agentskit/sandbox/types'

const SNIPPETS = {
  fib: {
    label: 'fibonacci',
    lang: 'python' as const,
    code: 'def fib(n):\n  return n if n < 2 else fib(n-1) + fib(n-2)\n\nprint(fib(20))',
    out: '6765',
    ms: 142,
  },
  primes: {
    label: 'primes',
    lang: 'python' as const,
    code: 'primes = [n for n in range(2, 30) if all(n % i for i in range(2, n))]\nprint(primes)',
    out: '[2, 3, 5, 7, 11, 13, 17, 19, 23, 29]',
    ms: 87,
  },
  sort: {
    label: 'sort',
    lang: 'javascript' as const,
    code: 'const nums = [4, 1, 9, 2, 7]\nconsole.log(nums.sort((a, b) => b - a))',
    out: '[9, 7, 4, 2, 1]',
    ms: 41,
  },
}

type Key = keyof typeof SNIPPETS

const browserBackend: SandboxBackend = {
  async execute(code, opts): Promise<ExecuteResult> {
    const match = (Object.values(SNIPPETS) as Array<typeof SNIPPETS[Key]>).find(s => s.code === code)
    const ms = match?.ms ?? 200
    await new Promise(r => setTimeout(r, ms))
    return {
      stdout: match?.out ?? '',
      stderr: '',
      exitCode: 0,
      durationMs: ms,
    }
  },
}

export function SandboxRunner() {
  const sandbox = useMemo(() => createSandbox({ backend: browserBackend }), [])
  const [pick, setPick] = useState<Key>('fib')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ExecuteResult | null>(null)

  const select = (k: Key) => {
    setPick(k)
    setResult(null)
  }

  const run = async () => {
    setRunning(true)
    setResult(null)
    const r = await sandbox.execute(SNIPPETS[pick].code, { language: SNIPPETS[pick].lang })
    setResult(r)
    setRunning(false)
  }

  const s = SNIPPETS[pick]

  return (
    <div data-ak-example className="flex flex-col gap-3 rounded-lg border border-ak-border bg-ak-surface p-4">
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="text-ak-graphite">@agentskit/sandbox · createSandbox · custom backend</span>
        <span className="text-ak-graphite">no network · timeout 5s</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(SNIPPETS) as Key[]).map(k => (
          <button
            key={k}
            type="button"
            onClick={() => select(k)}
            className={`rounded-full px-3 py-1 font-mono text-xs transition ${
              pick === k ? 'bg-ak-blue/20 text-ak-blue' : 'border border-ak-border text-ak-graphite hover:text-ak-foam'
            }`}
          >
            {SNIPPETS[k].label}
          </button>
        ))}
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="ml-auto rounded-md bg-ak-green/20 px-3 py-1 font-mono text-xs text-ak-green disabled:opacity-50"
        >
          {running ? 'running…' : '▶ run'}
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-ak-border bg-ak-midnight shadow-lg">
        <div className="flex items-center justify-between border-b border-ak-border bg-ak-surface px-3 py-1.5">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className={`h-2 w-2 rounded-full ${running ? 'animate-pulse bg-[#f0b429]' : 'bg-ak-green'}`} />
            <span className="text-ak-foam">{s.lang} · {pick}.{s.lang === 'python' ? 'py' : 'js'}</span>
          </div>
          <span className="font-mono text-xs text-ak-graphite">
            {running ? '…' : result ? `${result.durationMs}ms · exit ${result.exitCode}` : 'idle'}
          </span>
        </div>
        <pre className="overflow-x-auto whitespace-pre px-3 py-2 font-mono text-[11px] leading-relaxed text-ak-foam">
          {s.code}
        </pre>
        <div className="border-t border-ak-border bg-black/40 px-3 py-2 font-mono text-[11px]">
          <div className="mb-1 text-ak-graphite">stdout</div>
          {running ? (
            <span className="text-ak-graphite">executing…</span>
          ) : result ? (
            <span className="text-ak-green">{result.stdout || '(empty)'}</span>
          ) : (
            <span className="text-ak-graphite">— press run —</span>
          )}
        </div>
      </div>
    </div>
  )
}
