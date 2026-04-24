import type { ReactNode } from 'react'
import { Callout } from 'fumadocs-ui/components/callout'

type P = { title?: ReactNode; children: ReactNode }

export const Tip = ({ title = 'Tip', children }: P) => (
  <Callout type="idea" title={title}>
    {children}
  </Callout>
)
export const Warning = ({ title = 'Warning', children }: P) => (
  <Callout type="warn" title={title}>
    {children}
  </Callout>
)
export const Pitfall = ({ title = 'Pitfall', children }: P) => (
  <Callout type="error" title={title}>
    {children}
  </Callout>
)
export const Performance = ({ title = 'Performance', children }: P) => (
  <Callout type="info" title={`⚡ ${typeof title === 'string' ? title : 'Performance'}`}>
    {children}
  </Callout>
)
export const Security = ({ title = 'Security', children }: P) => (
  <Callout type="warn" title={`🔒 ${typeof title === 'string' ? title : 'Security'}`}>
    {children}
  </Callout>
)
export const Info = ({ title = 'Note', children }: P) => (
  <Callout type="info" title={title}>
    {children}
  </Callout>
)
export const Success = ({ title = 'Shipped', children }: P) => (
  <Callout type="success" title={title}>
    {children}
  </Callout>
)

export function Compare({
  good,
  bad,
  goodLabel = 'Do',
  badLabel = "Don't",
}: {
  good: ReactNode
  bad: ReactNode
  goodLabel?: ReactNode
  badLabel?: ReactNode
}) {
  return (
    <div data-ak-compare className="my-6 grid gap-4 md:grid-cols-2">
      <section className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
        <header className="mb-2 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
          <span aria-hidden>✓</span> {goodLabel}
        </header>
        <div className="[&>pre]:my-0">{good}</div>
      </section>
      <section className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
        <header className="mb-2 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
          <span aria-hidden>✗</span> {badLabel}
        </header>
        <div className="[&>pre]:my-0">{bad}</div>
      </section>
    </div>
  )
}
