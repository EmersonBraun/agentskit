import type { ToolDefinition } from '@agentskit/core'

export interface WebSearchResult {
  title: string
  url: string
  snippet: string
}

export interface WebSearchConfig {
  provider?: 'duckduckgo' | 'serper'
  apiKey?: string
  maxResults?: number
  search?: (query: string) => Promise<WebSearchResult[]>
}

async function duckDuckGoSearch(query: string, maxResults: number): Promise<WebSearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`DuckDuckGo API error: ${response.status}`)

  const data = await response.json() as {
    Abstract?: string
    AbstractURL?: string
    AbstractSource?: string
    RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>
  }

  const results: WebSearchResult[] = []

  if (data.Abstract) {
    results.push({
      title: data.AbstractSource ?? 'Summary',
      url: data.AbstractURL ?? '',
      snippet: data.Abstract,
    })
  }

  for (const topic of data.RelatedTopics ?? []) {
    if (results.length >= maxResults) break
    if (topic.Text && topic.FirstURL) {
      results.push({
        title: topic.Text.slice(0, 80),
        url: topic.FirstURL,
        snippet: topic.Text,
      })
    }
  }

  return results
}

async function serperSearch(query: string, apiKey: string, maxResults: number): Promise<WebSearchResult[]> {
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({ q: query, num: maxResults }),
  })

  if (!response.ok) throw new Error(`Serper API error: ${response.status}`)

  const data = await response.json() as {
    organic?: Array<{ title?: string; link?: string; snippet?: string }>
  }

  return (data.organic ?? []).map(r => ({
    title: r.title ?? '',
    url: r.link ?? '',
    snippet: r.snippet ?? '',
  }))
}

export function webSearch(config: WebSearchConfig = {}): ToolDefinition {
  const { provider = 'duckduckgo', apiKey, maxResults = 5, search } = config

  return {
    name: 'web_search',
    description: 'Search the web for information. Returns titles, URLs, and snippets.',
    tags: ['web', 'search'],
    category: 'retrieval',
    schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query' },
      },
      required: ['query'],
    },
    execute: async (args) => {
      const query = String(args.query ?? '')
      if (!query) return 'Error: query is required'

      let results: WebSearchResult[]

      if (search) {
        results = await search(query)
      } else if (provider === 'serper') {
        if (!apiKey) return 'Error: Serper provider requires apiKey'
        results = await serperSearch(query, apiKey, maxResults)
      } else {
        results = await duckDuckGoSearch(query, maxResults)
      }

      if (results.length === 0) return `No results found for "${query}"`

      return results
        .map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`)
        .join('\n\n')
    },
  }
}
