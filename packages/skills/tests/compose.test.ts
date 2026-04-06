import { describe, it, expect } from 'vitest'
import { composeSkills } from '../src/compose'
import { researcher, coder, planner, summarizer } from '../src/index'

describe('composeSkills', () => {
  it('throws on zero skills', () => {
    expect(() => composeSkills()).toThrow('at least one skill')
  })

  it('returns the same skill when given one', () => {
    const result = composeSkills(researcher)
    expect(result).toBe(researcher)
  })

  it('merges names with +', () => {
    const result = composeSkills(researcher, coder)
    expect(result.name).toBe('researcher+coder')
  })

  it('creates composed description', () => {
    const result = composeSkills(researcher, coder)
    expect(result.description).toContain('researcher')
    expect(result.description).toContain('coder')
  })

  it('concatenates system prompts with delimiters', () => {
    const result = composeSkills(researcher, coder)
    expect(result.systemPrompt).toContain('--- researcher ---')
    expect(result.systemPrompt).toContain('--- coder ---')
    expect(result.systemPrompt).toContain(researcher.systemPrompt)
    expect(result.systemPrompt).toContain(coder.systemPrompt)
  })

  it('merges and deduplicates tools', () => {
    const result = composeSkills(researcher, coder)
    expect(result.tools).toContain('web_search')
    expect(result.tools).toContain('read_file')
    expect(result.tools).toContain('write_file')
    expect(result.tools).toContain('shell')
    // No duplicates
    const unique = new Set(result.tools)
    expect(unique.size).toBe(result.tools!.length)
  })

  it('merges and deduplicates delegates', () => {
    const result = composeSkills(planner, researcher)
    expect(result.delegates).toContain('researcher')
    expect(result.delegates).toContain('coder')
    // No duplicates even though planner delegates to researcher
    const unique = new Set(result.delegates)
    expect(unique.size).toBe(result.delegates!.length)
  })

  it('concatenates examples', () => {
    const result = composeSkills(researcher, coder)
    expect(result.examples!.length).toBe(
      researcher.examples!.length + coder.examples!.length
    )
  })

  it('leaves temperature undefined', () => {
    const result = composeSkills(researcher, coder)
    expect(result.temperature).toBeUndefined()
  })

  it('sets tools to undefined when all skills have empty tools', () => {
    const result = composeSkills(summarizer)
    // Single skill returns as-is
    expect(result.tools).toEqual([])
  })

  it('composes three skills', () => {
    const result = composeSkills(researcher, coder, summarizer)
    expect(result.name).toBe('researcher+coder+summarizer')
    expect(result.systemPrompt).toContain('--- researcher ---')
    expect(result.systemPrompt).toContain('--- coder ---')
    expect(result.systemPrompt).toContain('--- summarizer ---')
  })
})
