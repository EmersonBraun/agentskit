import Link from 'next/link'
import { findNeighbour, getPageTreePeers } from 'fumadocs-core/page-tree'
import type { Root, Item } from 'fumadocs-core/page-tree'

type Props = {
  tree: Root
  url: string
}

function itemHref(item: Item): string {
  return typeof item.url === 'string' ? item.url : ''
}

function itemTitle(item: Item): string {
  const name = item.name
  if (typeof name === 'string') return name
  return itemHref(item)
}

function itemDesc(item: Item): string | undefined {
  const desc = (item as unknown as { description?: string }).description
  return typeof desc === 'string' ? desc : undefined
}

export function NextSteps({ tree, url }: Props) {
  const { previous, next } = findNeighbour(tree, url)
  const peers = getPageTreePeers(tree, url).filter((p) => itemHref(p) !== url).slice(0, 3)

  if (!previous && !next && peers.length === 0) return null

  return (
    <section data-ak-next-steps className="mt-12 border-t border-fd-border pt-8">
      {peers.length > 0 ? (
        <>
          <h2 className="mb-4 font-display text-sm uppercase tracking-[0.2em] text-ak-graphite">
            Explore nearby
          </h2>
          <ul className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {peers.map((p) => {
              const href = itemHref(p)
              const title = itemTitle(p)
              const desc = itemDesc(p)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className="group block h-full rounded-lg border border-fd-border bg-fd-card p-4 transition hover:border-ak-foam"
                  >
                    <div className="font-mono text-[10px] uppercase tracking-widest text-ak-graphite group-hover:text-ak-foam">
                      Peer
                    </div>
                    <div className="mt-1 font-display text-base font-semibold text-fd-foreground">
                      {title}
                    </div>
                    {desc ? (
                      <p className="mt-1 line-clamp-2 text-sm text-ak-graphite">{desc}</p>
                    ) : null}
                  </Link>
                </li>
              )
            })}
          </ul>
        </>
      ) : null}

      {previous || next ? (
        <nav className="grid gap-3 sm:grid-cols-2" aria-label="Previous and next page">
          {previous ? (
            <Link
              href={itemHref(previous)}
              className="group flex flex-col rounded-lg border border-fd-border bg-fd-card p-4 transition hover:border-ak-foam"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-ak-graphite">
                ← Previous
              </span>
              <span className="mt-1 font-display text-base font-semibold text-fd-foreground group-hover:text-ak-foam">
                {itemTitle(previous)}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={itemHref(next)}
              className="group flex flex-col items-end rounded-lg border border-fd-border bg-fd-card p-4 text-right transition hover:border-ak-foam"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-ak-graphite">
                Next →
              </span>
              <span className="mt-1 font-display text-base font-semibold text-fd-foreground group-hover:text-ak-foam">
                {itemTitle(next)}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </section>
  )
}
