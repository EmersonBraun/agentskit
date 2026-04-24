import { source } from '@/lib/source'
import { createFromSource } from 'fumadocs-core/search/server'

function tagFor(url: string): string {
  if (url.startsWith('/docs/reference/packages')) return 'packages'
  if (url.startsWith('/docs/reference/examples') || url.startsWith('/docs/use-cases')) return 'examples'
  if (
    url.startsWith('/docs/reference') ||
    url.startsWith('/docs/ui') ||
    url.startsWith('/docs/for-agents')
  )
    return 'api'
  return 'guides'
}

// Aliases injected into the description so Orama tokenises them alongside the page body.
// Keys are case-insensitive substrings checked against title + description + url.
const SYNONYMS: { match: RegExp; aliases: string[] }[] = [
  { match: /useChat|chat-container|chat hook/i, aliases: ['chat hook', 'react hook chat', 'send message', 'streaming chat'] },
  { match: /adapter/i, aliases: ['provider', 'llm provider', 'model provider'] },
  { match: /memory/i, aliases: ['state', 'thread', 'history', 'conversation store'] },
  { match: /retriever|rag/i, aliases: ['retrieval', 'context fetch', 'embeddings search'] },
  { match: /tool(s)?\b/i, aliases: ['function calling', 'action', 'tool use'] },
  { match: /runtime/i, aliases: ['agent loop', 'ReAct loop', 'orchestrator'] },
  { match: /skill/i, aliases: ['persona', 'system prompt', 'agent role'] },
  { match: /observability/i, aliases: ['tracing', 'spans', 'telemetry', 'logs'] },
  { match: /eval/i, aliases: ['benchmark', 'scoring', 'accuracy'] },
  { match: /sandbox/i, aliases: ['code execution', 'e2b', 'secure exec'] },
  { match: /stream(ing)?/i, aliases: ['SSE', 'realtime', 'token stream'] },
  { match: /cli/i, aliases: ['terminal', 'shell', 'init', 'chat cli'] },
  { match: /migrating|migration/i, aliases: ['migrate', 'upgrade', 'port from'] },
  { match: /hitl|human in the loop/i, aliases: ['confirmation', 'approval', 'human approval'] },
]

function enrich(title: string, description: string | undefined, url: string): string | undefined {
  const haystack = `${title} ${description ?? ''} ${url}`
  const extra = new Set<string>()
  for (const { match, aliases } of SYNONYMS) {
    if (match.test(haystack)) aliases.forEach((a) => extra.add(a))
  }
  if (extra.size === 0) return description
  const joined = Array.from(extra).join(' · ')
  return description ? `${description} — aliases: ${joined}` : `aliases: ${joined}`
}

function breadcrumbs(url: string): string[] {
  const segments = url.replace(/^\/docs\/?/, '').split('/').filter(Boolean)
  if (segments.length <= 1) return []
  return segments.slice(0, -1).map((s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
}

export const { GET } = createFromSource(source, {
  buildIndex: async (page) => {
    const data = page.data as {
      title?: string
      description?: string
      structuredData?: unknown
      load?: () => Promise<{ structuredData: unknown }>
    }
    const structuredData = data.structuredData
      ? typeof data.structuredData === 'function'
        ? await (data.structuredData as () => Promise<unknown>)()
        : data.structuredData
      : data.load
        ? (await data.load()).structuredData
        : undefined
    if (!structuredData) throw new Error(`No structuredData on page ${page.url}`)
    const title = data.title ?? page.url
    return {
      id: page.url,
      title,
      description: enrich(title, data.description, page.url),
      url: page.url,
      tag: tagFor(page.url),
      breadcrumbs: breadcrumbs(page.url),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      structuredData: structuredData as any,
    }
  },
})
