import { describe, it, expect } from 'vitest'
import { listTools } from '../src/discovery'

describe('listTools', () => {
  it('returns metadata for all built-in tools', () => {
    const tools = listTools()
    expect(tools.length).toBe(5)

    const names = tools.map(t => t.name)
    expect(names).toContain('web_search')
    expect(names).toContain('read_file')
    expect(names).toContain('write_file')
    expect(names).toContain('list_directory')
    expect(names).toContain('shell')
  })

  it('each tool has required metadata fields', () => {
    for (const tool of listTools()) {
      expect(tool.name).toBeTruthy()
      expect(tool.description).toBeTruthy()
      expect(tool.tags.length).toBeGreaterThan(0)
      expect(tool.category).toBeTruthy()
      expect(tool.schema).toBeDefined()
      expect(tool.schema.type).toBe('object')
    }
  })

  it('returns a copy, not the original array', () => {
    const a = listTools()
    const b = listTools()
    expect(a).not.toBe(b)
  })
})
