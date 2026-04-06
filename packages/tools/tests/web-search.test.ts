import { describe, it, expect, vi } from 'vitest'
import { webSearch } from '../src/web-search'

describe('webSearch', () => {
  it('satisfies ToolDefinition contract', () => {
    const tool = webSearch()
    expect(tool.name).toBe('web_search')
    expect(tool.description).toBeTruthy()
    expect(tool.schema).toBeDefined()
    expect(tool.tags).toContain('search')
    expect(tool.category).toBe('retrieval')
    expect(tool.execute).toBeTypeOf('function')
  })

  it('returns error for empty query', async () => {
    const tool = webSearch()
    const result = await tool.execute!({ query: '' }, { messages: [], call: { id: '1', name: 'web_search', args: {}, status: 'running' } })
    expect(result).toContain('Error')
  })

  it('uses custom search function when provided', async () => {
    const customSearch = vi.fn().mockResolvedValue([
      { title: 'Test Result', url: 'https://example.com', snippet: 'A test snippet' },
    ])

    const tool = webSearch({ search: customSearch })
    const result = await tool.execute!(
      { query: 'test' },
      { messages: [], call: { id: '1', name: 'web_search', args: { query: 'test' }, status: 'running' } },
    )

    expect(customSearch).toHaveBeenCalledWith('test')
    expect(result).toContain('Test Result')
    expect(result).toContain('https://example.com')
    expect(result).toContain('A test snippet')
  })

  it('formats multiple results with numbering', async () => {
    const tool = webSearch({
      search: async () => [
        { title: 'First', url: 'https://a.com', snippet: 'Snippet A' },
        { title: 'Second', url: 'https://b.com', snippet: 'Snippet B' },
      ],
    })

    const result = await tool.execute!(
      { query: 'test' },
      { messages: [], call: { id: '1', name: 'web_search', args: { query: 'test' }, status: 'running' } },
    ) as string

    expect(result).toContain('[1]')
    expect(result).toContain('[2]')
    expect(result).toContain('First')
    expect(result).toContain('Second')
  })

  it('returns no results message when empty', async () => {
    const tool = webSearch({ search: async () => [] })
    const result = await tool.execute!(
      { query: 'nothing' },
      { messages: [], call: { id: '1', name: 'web_search', args: { query: 'nothing' }, status: 'running' } },
    )
    expect(result).toContain('No results')
  })

  it('returns error when serper provider has no apiKey', async () => {
    const tool = webSearch({ provider: 'serper' })
    const result = await tool.execute!(
      { query: 'test' },
      { messages: [], call: { id: '1', name: 'web_search', args: { query: 'test' }, status: 'running' } },
    )
    expect(result).toContain('Error')
    expect(result).toContain('apiKey')
  })
})
