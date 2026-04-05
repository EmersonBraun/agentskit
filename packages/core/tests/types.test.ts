import { describe, it, expectTypeOf } from 'vitest'
import type {
  ToolDefinition,
  SkillDefinition,
  VectorMemory,
  AgentEvent,
  Observer,
  EvalSuite,
  EvalTestCase,
  EvalResult,
} from '../src/types'
import type { JSONSchema7 } from 'json-schema'

describe('type contracts', () => {
  it('ToolDefinition accepts JSONSchema7 schema', () => {
    const tool: ToolDefinition = {
      name: 'test',
      schema: { type: 'object', properties: { q: { type: 'string' } } },
    }
    expectTypeOf(tool.schema).toEqualTypeOf<JSONSchema7 | undefined>()
  })

  it('ToolDefinition execute can return AsyncIterable', () => {
    const tool: ToolDefinition = {
      name: 'stream-tool',
      async *execute() { yield 'chunk' },
    }
    expectTypeOf(tool).toMatchTypeOf<ToolDefinition>()
  })

  it('ToolDefinition supports lifecycle methods', () => {
    const tool: ToolDefinition = {
      name: 'stateful',
      init: async () => {},
      dispose: async () => {},
    }
    expectTypeOf(tool).toMatchTypeOf<ToolDefinition>()
  })

  it('ToolDefinition supports discovery metadata', () => {
    const tool: ToolDefinition = {
      name: 'search',
      tags: ['web', 'search'],
      category: 'retrieval',
    }
    expectTypeOf(tool.tags).toEqualTypeOf<string[] | undefined>()
    expectTypeOf(tool.category).toEqualTypeOf<string | undefined>()
  })

  it('SkillDefinition has required and optional fields', () => {
    const skill: SkillDefinition = {
      name: 'researcher',
      description: 'Researches topics',
      systemPrompt: 'You are a researcher.',
      examples: [{ input: 'hi', output: 'hello' }],
      tools: ['web_search'],
      delegates: ['summarizer'],
      temperature: 0.7,
      onActivate: async () => ({ tools: [] }),
    }
    expectTypeOf(skill.name).toBeString()
    expectTypeOf(skill.onActivate).toMatchTypeOf<
      (() => Promise<{ tools?: ToolDefinition[] }>) | undefined
    >()
  })

  it('VectorMemory accepts number[] embeddings only', () => {
    const mem: VectorMemory = {
      store: async () => {},
      search: async () => [],
    }
    expectTypeOf(mem.search).parameter(0).toEqualTypeOf<number[]>()
  })

  it('Observer has name and on handler', () => {
    const obs: Observer = {
      name: 'test',
      on: () => {},
    }
    expectTypeOf(obs.on).parameter(0).toMatchTypeOf<AgentEvent>()
  })

  it('EvalSuite contains test cases', () => {
    const suite: EvalSuite = {
      name: 'basic',
      cases: [
        { input: 'hello', expected: 'hi' },
        { input: 'hello', expected: (r: string) => r.includes('hi') },
      ],
    }
    expectTypeOf(suite.cases).toMatchTypeOf<EvalTestCase[]>()
  })

  it('EvalResult has accuracy and per-case results', () => {
    const result: EvalResult = {
      totalCases: 1,
      passed: 1,
      failed: 0,
      accuracy: 1.0,
      results: [{
        input: 'hi',
        output: 'hello',
        passed: true,
        latencyMs: 100,
      }],
    }
    expectTypeOf(result.accuracy).toBeNumber()
    expectTypeOf(result.results[0].tokenUsage).toEqualTypeOf<
      { prompt: number; completion: number } | undefined
    >()
  })
})
