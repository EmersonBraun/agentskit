import { describe, it, expect, vi } from 'vitest'
import type { AgentEvent } from '@agentskit/core'
import { costGuard, priceFor, computeCost, DEFAULT_PRICES } from '../src/cost-guard'

describe('priceFor', () => {
  it('exact model match wins', () => {
    const price = priceFor('gpt-4o-mini')
    expect(price).toEqual(DEFAULT_PRICES['gpt-4o-mini'])
  })

  it('longer prefix wins over shorter (gpt-4o-mini vs gpt-4o)', () => {
    const mini = priceFor('gpt-4o-mini-2024-07-18')
    expect(mini).toEqual(DEFAULT_PRICES['gpt-4o-mini'])
    const big = priceFor('gpt-4o-2024-08-06')
    expect(big).toEqual(DEFAULT_PRICES['gpt-4o'])
  })

  it('is case-insensitive', () => {
    expect(priceFor('GPT-4O-MINI')).toEqual(DEFAULT_PRICES['gpt-4o-mini'])
  })

  it('unknown models return zero-cost', () => {
    const price = priceFor('made-up-model')
    expect(price).toEqual({ input: 0, output: 0 })
  })

  it('undefined model returns zero-cost', () => {
    expect(priceFor(undefined)).toEqual({ input: 0, output: 0 })
  })

  it('respects custom prices override', () => {
    const custom = { 'custom-model': { input: 0.1, output: 0.2 } }
    expect(priceFor('custom-model', custom)).toEqual(custom['custom-model'])
  })
})

describe('computeCost', () => {
  it('computes per-1K cost correctly', () => {
    const cost = computeCost(
      { promptTokens: 1000, completionTokens: 500 },
      { input: 0.01, output: 0.03 },
    )
    expect(cost).toBeCloseTo(0.01 + 0.015, 6)
  })

  it('handles fractional token counts', () => {
    const cost = computeCost(
      { promptTokens: 250, completionTokens: 125 },
      { input: 0.04, output: 0.08 },
    )
    expect(cost).toBeCloseTo(0.01 + 0.01, 6)
  })

  it('zero-price model costs zero', () => {
    const cost = computeCost(
      { promptTokens: 10_000, completionTokens: 10_000 },
      { input: 0, output: 0 },
    )
    expect(cost).toBe(0)
  })
})

function llmEnd(pt: number, ct: number): AgentEvent {
  return {
    type: 'llm:end',
    content: '',
    usage: { promptTokens: pt, completionTokens: ct },
    durationMs: 100,
  }
}

describe('costGuard observer', () => {
  it('accumulates token usage and reports cost', () => {
    const controller = new AbortController()
    const guard = costGuard({ budgetUsd: 10, controller, modelOverride: 'gpt-4o' })

    guard.on(llmEnd(1000, 500))

    expect(guard.promptTokens()).toBe(1000)
    expect(guard.completionTokens()).toBe(500)
    expect(guard.costUsd()).toBeCloseTo(0.0025 + 0.005, 6)
    expect(guard.exceeded()).toBe(false)
    expect(controller.signal.aborted).toBe(false)
  })

  it('aborts when budget is exceeded', () => {
    const controller = new AbortController()
    const onExceeded = vi.fn()
    const guard = costGuard({
      budgetUsd: 0.01,
      controller,
      modelOverride: 'gpt-4o',
      onExceeded,
    })

    // 10K prompt tokens at gpt-4o = 10 * 0.0025 = $0.025 — over $0.01 budget
    guard.on(llmEnd(10_000, 0))

    expect(guard.exceeded()).toBe(true)
    expect(controller.signal.aborted).toBe(true)
    expect(onExceeded).toHaveBeenCalledWith({ costUsd: 0.025, budgetUsd: 0.01 })
  })

  it('calls onCost with budget remaining after every update', () => {
    const controller = new AbortController()
    const onCost = vi.fn()
    const guard = costGuard({
      budgetUsd: 1,
      controller,
      modelOverride: 'gpt-4o',
      onCost,
    })

    guard.on(llmEnd(1000, 0))

    expect(onCost).toHaveBeenCalledTimes(1)
    const [arg] = onCost.mock.calls[0]
    expect(arg.costUsd).toBeCloseTo(0.0025, 6)
    expect(arg.budgetRemainingUsd).toBeCloseTo(0.9975, 6)
  })

  it('uses the model from llm:start when no override is provided', () => {
    const controller = new AbortController()
    const guard = costGuard({ budgetUsd: 10, controller })

    guard.on({ type: 'llm:start', model: 'claude-sonnet-4-6', messageCount: 1 })
    guard.on(llmEnd(1000, 1000))

    const expected = computeCost(
      { promptTokens: 1000, completionTokens: 1000 },
      DEFAULT_PRICES['claude-sonnet-4-6'],
    )
    expect(guard.costUsd()).toBeCloseTo(expected, 6)
  })

  it('only fires onExceeded once even if called again over budget', () => {
    const controller = new AbortController()
    const onExceeded = vi.fn()
    const guard = costGuard({
      budgetUsd: 0.01,
      controller,
      modelOverride: 'gpt-4o',
      onExceeded,
    })

    guard.on(llmEnd(10_000, 0))
    guard.on(llmEnd(10_000, 0))

    expect(onExceeded).toHaveBeenCalledTimes(1)
    expect(guard.exceeded()).toBe(true)
  })

  it('reset() zeros counters and lets the observer guard a fresh run', () => {
    const controller = new AbortController()
    const guard = costGuard({ budgetUsd: 10, controller, modelOverride: 'gpt-4o' })

    guard.on(llmEnd(1000, 500))
    expect(guard.costUsd()).toBeGreaterThan(0)

    guard.reset()
    expect(guard.costUsd()).toBe(0)
    expect(guard.promptTokens()).toBe(0)
    expect(guard.completionTokens()).toBe(0)
    expect(guard.exceeded()).toBe(false)
  })

  it('skips unknown events without crashing', () => {
    const controller = new AbortController()
    const guard = costGuard({ budgetUsd: 10, controller })

    expect(() => {
      guard.on({ type: 'tool:start', name: 'x', args: {} })
      guard.on({ type: 'tool:end', name: 'x', result: '', durationMs: 10 })
      guard.on({ type: 'memory:save', messageCount: 1 })
    }).not.toThrow()
    expect(guard.costUsd()).toBe(0)
  })

  it('ignores llm:end events with no usage data', () => {
    const controller = new AbortController()
    const guard = costGuard({ budgetUsd: 10, controller, modelOverride: 'gpt-4o' })

    guard.on({ type: 'llm:end', content: '', durationMs: 100 })

    expect(guard.promptTokens()).toBe(0)
    expect(guard.costUsd()).toBe(0)
  })

  it('custom prices override defaults', () => {
    const controller = new AbortController()
    const guard = costGuard({
      budgetUsd: 100,
      controller,
      prices: { 'gpt-4o': { input: 1, output: 2 } },
      modelOverride: 'gpt-4o',
    })

    guard.on(llmEnd(1000, 500))

    // 1 * 1 + 0.5 * 2 = 2.0
    expect(guard.costUsd()).toBeCloseTo(2, 6)
  })
})
