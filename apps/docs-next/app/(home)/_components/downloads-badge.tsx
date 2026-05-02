const PACKAGES = [
  'core',
  'adapters',
  'angular',
  'cli',
  'eval',
  'ink',
  'memory',
  'observability',
  'rag',
  'react-native',
  'react',
  'runtime',
  'sandbox',
  'skills',
  'solid',
  'svelte',
  'templates',
  'tools',
  'vue',
] as const

const FETCH_REVALIDATE_SECONDS = 60 * 60 * 6

interface NpmPointResponse {
  downloads?: number
}

async function fetchPackageDownloads(pkg: string): Promise<number> {
  try {
    const response = await fetch(
      `https://api.npmjs.org/downloads/point/last-month/@agentskit/${pkg}`,
      { next: { revalidate: FETCH_REVALIDATE_SECONDS } },
    )
    if (!response.ok) return 0
    const data = (await response.json()) as NpmPointResponse
    return data.downloads ?? 0
  } catch {
    return 0
  }
}

function formatCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`
  return `${(n / 1_000_000).toFixed(1)}m`
}

export async function DownloadsBadge() {
  const counts = await Promise.all(PACKAGES.map(fetchPackageDownloads))
  const total = counts.reduce((sum, n) => sum + n, 0)

  if (total === 0) return null

  return (
    <a
      href="https://www.npmjs.com/org/agentskit"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-5 inline-flex items-center gap-2 rounded-md border border-ak-border bg-ak-surface px-3 py-1.5 text-xs font-medium text-ak-foam transition hover:border-ak-foam"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5 text-ak-graphite"
        aria-hidden
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <span className="font-mono tabular-nums text-ak-foam">
        {formatCount(total)}
      </span>
      <span className="text-ak-graphite">monthly downloads</span>
      <span className="text-ak-graphite">·</span>
      <span className="text-ak-graphite">{PACKAGES.length} packages</span>
    </a>
  )
}
