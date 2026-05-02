import { describe, expect, it, vi } from 'vitest'
import { runBraintrustEval, scoreCase, summarize } from '../src/runner'
import { taskSuccess, schemaSurvival } from '../src/scorers'

describe('scoreCase', () => {
  it('runs all scorers and surfaces errors as scorer_error', async () => {
    const broken = () => {
      throw new Error('boom')
    }
    const r = await scoreCase([taskSuccess, broken as never], {
      input: 'q',
      output: 'Paris',
      expected: 'Paris',
    })
    expect(r).toHaveLength(2)
    expect(r[0]?.name).toBe('task_success')
    expect(r[1]?.name).toBe('scorer_error')
  })
})

describe('summarize', () => {
  it('averages scores by name', () => {
    const s = summarize([
      {
        input: 'a',
        output: 'a',
        scores: [{ name: 'x', score: 1 }, { name: 'y', score: 0 }],
      },
      {
        input: 'b',
        output: 'b',
        scores: [{ name: 'x', score: 0 }, { name: 'y', score: 1 }],
      },
    ])
    expect(s.x?.mean).toBe(0.5)
    expect(s.y?.mean).toBe(0.5)
    expect(s.x?.n).toBe(2)
  })

  it('returns 0 for empty input', () => {
    expect(summarize([])).toEqual({})
  })
})

describe('runBraintrustEval', () => {
  it('runs cases through the agent and scorers without a Braintrust SDK', async () => {
    const agent = vi.fn(async (input: string) => ({ output: `${input} → answer` }))
    const result = await runBraintrustEval({
      cases: [
        { input: 'q1', output: '', expected: 'answer' },
        { input: 'q2', output: '', expected: 'answer' },
      ],
      agent,
      scorers: [taskSuccess, schemaSurvival],
      options: { projectName: 'agentskit-test' },
    }, {
      bt: {
        async init() {
          throw new Error('skip')
        },
      },
    })
    expect(result.cases).toHaveLength(2)
    expect(result.summary.task_success?.mean).toBe(1)
    expect(agent).toHaveBeenCalledTimes(2)
  })

  it('logs to braintrust when an experiment is initialized', async () => {
    const logs: Record<string, unknown>[] = []
    const fakeExperiment = {
      log(p: Record<string, unknown>) {
        logs.push(p)
      },
      async summarize() {
        return { experimentUrl: 'https://braintrust.dev/x' }
      },
    }
    const result = await runBraintrustEval({
      cases: [{ input: 'q', output: '', expected: 'q' }],
      agent: async input => ({ output: input }),
      scorers: [taskSuccess],
      options: { projectName: 'p', apiKey: 'k', experimentName: 'exp' },
    }, { bt: { init: async () => fakeExperiment } })
    expect(logs).toHaveLength(1)
    expect(result.url).toBe('https://braintrust.dev/x')
  })

  it('records primaryError when the agent throws', async () => {
    const result = await runBraintrustEval({
      cases: [{ input: 'q', output: '' }],
      agent: async () => {
        throw new Error('agent down')
      },
      scorers: [],
      options: { projectName: 'p' },
      bt: {
        async init() {
          throw new Error('skip')
        },
      },
    })
    expect(result.cases[0]?.metadata?.primaryError).toBe('agent down')
    expect(result.cases[0]?.metadata?.crashed).toBe(true)
  })
})
