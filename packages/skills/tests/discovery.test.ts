import { describe, it, expect } from 'vitest'
import { listSkills } from '../src/discovery'

describe('listSkills', () => {
  it('returns metadata for all 5 built-in skills', () => {
    const skills = listSkills()
    expect(skills).toHaveLength(5)
    const names = skills.map(s => s.name)
    expect(names).toContain('researcher')
    expect(names).toContain('coder')
    expect(names).toContain('planner')
    expect(names).toContain('critic')
    expect(names).toContain('summarizer')
  })

  it('each skill has required metadata', () => {
    for (const skill of listSkills()) {
      expect(skill.name).toBeTruthy()
      expect(skill.description).toBeTruthy()
      expect(Array.isArray(skill.tools)).toBe(true)
      expect(Array.isArray(skill.delegates)).toBe(true)
    }
  })

  it('planner metadata includes delegates', () => {
    const planner = listSkills().find(s => s.name === 'planner')
    expect(planner?.delegates).toContain('researcher')
    expect(planner?.delegates).toContain('coder')
  })
})
