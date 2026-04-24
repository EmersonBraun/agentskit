import type { ReactNode } from 'react'

const REPO = 'AgentsKit-io/agentskit'

export type VerifiedProps = {
  /** Relative path from repo root to the test file that proves this example. */
  test: string
  /** Optional commit SHA to lock the test version. Defaults to `main`. */
  sha?: string
  children?: ReactNode
}

export function Verified({ test, sha = 'main', children }: VerifiedProps) {
  const href = `https://github.com/${REPO}/blob/${sha}/${test}`
  const label = test.split('/').pop()?.replace(/\.(test|spec)\.[tj]sx?$/, '') ?? test
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-ak-verified
      className="my-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] text-emerald-300 no-underline transition hover:border-emerald-400 hover:text-emerald-200"
      title={`Pinned to: ${test}`}
    >
      <span aria-hidden className="text-base leading-none">✓</span>
      <span className="uppercase tracking-widest">Verified</span>
      <span className="text-emerald-400/60">·</span>
      <span>{children ?? label}</span>
    </a>
  )
}
