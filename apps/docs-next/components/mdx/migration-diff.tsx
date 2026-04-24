import type { ReactNode } from 'react'

export type MigrationDiffProps = {
  /** Version/label the old snippet came from, e.g. `0.4.x`. */
  from: string
  /** Version/label the new snippet lands in, e.g. `0.6.x`. */
  to: string
  /** Old code. */
  before: string
  /** New code. */
  after: string
  /** Language for the code fences (default `ts`). */
  lang?: string
  /** Optional GitHub link to the PR that introduced the change. */
  pr?: string
  /** Optional short note rendered under the diff. */
  children?: ReactNode
}

export function MigrationDiff({ from, to, before, after, lang = 'ts', pr, children }: MigrationDiffProps) {
  return (
    <section
      data-ak-migration-diff
      data-lang={lang}
      className="my-6 overflow-hidden rounded-lg border border-ak-border bg-ak-surface"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ak-border px-4 py-2">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ak-graphite">
          <span className="rounded-full border border-red-500/40 bg-red-500/5 px-2 py-0.5 text-red-300">
            {from}
          </span>
          <span aria-hidden>→</span>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/5 px-2 py-0.5 text-emerald-300">
            {to}
          </span>
        </div>
        {pr ? (
          <a
            href={pr}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] uppercase tracking-widest text-ak-graphite hover:text-ak-foam"
          >
            See the PR ↗
          </a>
        ) : null}
      </header>

      <div className="grid gap-0 md:grid-cols-2">
        <div className="border-b border-ak-border md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 border-b border-ak-border bg-red-500/5 px-4 py-1 font-mono text-[10px] uppercase tracking-widest text-red-300">
            <span aria-hidden>−</span> Before ({from})
          </div>
          <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-ak-foam">
            <code>{before}</code>
          </pre>
        </div>
        <div>
          <div className="flex items-center gap-2 border-b border-ak-border bg-emerald-500/5 px-4 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-300">
            <span aria-hidden>+</span> After ({to})
          </div>
          <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-ak-foam">
            <code>{after}</code>
          </pre>
        </div>
      </div>

      {children ? (
        <footer className="border-t border-ak-border px-4 py-3 text-sm text-ak-graphite">
          {children}
        </footer>
      ) : null}
    </section>
  )
}
