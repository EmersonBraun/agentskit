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
    return {
      id: page.url,
      title: data.title ?? page.url,
      description: data.description,
      url: page.url,
      tag: tagFor(page.url),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      structuredData: structuredData as any,
    }
  },
})
