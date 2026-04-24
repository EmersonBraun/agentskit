import type { ReactNode } from 'react'

export type SinceProps = {
  /** Version this API landed in, e.g. `0.4.0`. */
  v: string
  /** Optional pkg prefix, e.g. `react`. Defaults to `core`. */
  pkg?: string
  children?: ReactNode
}

export function Since({ v, pkg = 'core', children }: SinceProps) {
  return (
    <span
      data-ak-since
      className="ml-2 inline-flex items-center gap-1 rounded-full border border-ak-border bg-ak-surface px-2 py-0.5 align-middle font-mono text-[10px] uppercase tracking-widest text-ak-foam"
      title={`Available in @agentskit/${pkg} since v${v}`}
    >
      <span aria-hidden>✦</span>
      <span>
        since <code className="text-ak-foam">@agentskit/{pkg}</code>@<code className="text-ak-foam">{v}</code>
      </span>
      {children ? <span className="text-ak-graphite">· {children}</span> : null}
    </span>
  )
}
