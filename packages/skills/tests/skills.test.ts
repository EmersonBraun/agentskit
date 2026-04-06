import { describe, it, expect } from 'vitest'
import { researcher, coder, planner, critic, summarizer } from '../src/index'
import type { SkillDefinition } from '@agentskit/core'

const allSkills: SkillDefinition[] = [researcher, coder, planner, critic, summarizer]

describe('skill contract compliance', () => {
  for (const skill of allSkills) {
    describe(skill.name, () => {
      it('has required fields', () => {
        expect(skill.name).toBeTruthy()
        expect(skill.description).toBeTruthy()
        expect(skill.systemPrompt).toBeTruthy()
        expect(skill.systemPrompt.length).toBeGreaterThan(100)
      })

      it('has examples', () => {
        expect(skill.examples).toBeDefined()
        expect(skill.examples!.length).toBeGreaterThan(0)
        for (const example of skill.examples!) {
          expect(example.input).toBeTruthy()
          expect(example.output).toBeTruthy()
        }
      })

      it('has tools array (even if empty)', () => {
        expect(Array.isArray(skill.tools)).toBe(true)
      })

      it('has delegates array (even if empty)', () => {
        expect(Array.isArray(skill.delegates)).toBe(true)
      })
    })
  }
})

describe('researcher', () => {
  it('suggests web_search tool', () => {
    expect(researcher.tools).toContain('web_search')
  })
})

describe('coder', () => {
  it('suggests filesystem and shell tools', () => {
    expect(coder.tools).toContain('read_file')
    expect(coder.tools).toContain('write_file')
    expect(coder.tools).toContain('shell')
  })
})

describe('planner', () => {
  it('delegates to researcher and coder', () => {
    expect(planner.delegates).toContain('researcher')
    expect(planner.delegates).toContain('coder')
  })
})

describe('critic', () => {
  it('suggests read_file tool', () => {
    expect(critic.tools).toContain('read_file')
  })
})

describe('summarizer', () => {
  it('has no tool dependencies', () => {
    expect(summarizer.tools).toEqual([])
  })

  it('has no delegates', () => {
    expect(summarizer.delegates).toEqual([])
  })
})
