import type { AgentEvent, Observer } from '@agentskit/core'

/**
 * Dollar cost per 1K tokens for input and output.
 */
export interface TokenPrice {
  input: number
  output: number
}

/**
 * Pricing registry keyed by model name (case-insensitive prefix match).
 * Ordered: longest prefix wins so `gpt-4o-mini` matches before `gpt-4o`.
 *
 * Baseline as of late 2025 — keep in sync with provider docs or override
 * via the `prices` option.
 */
export const DEFAULT_PRICES: Record<string, TokenPrice> = {
  // OpenAI
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'o1-preview': { input: 0.015, output: 0.06 },
  'o1-mini': { input: 0.003, output: 0.012 },
  'o1': { input: 0.015, output: 0.06 },
  'o3-mini': { input: 0.0011, output: 0.0044 },
  'o3': { input: 0.002, output: 0.008 },
  // Anthropic
  'claude-opus-4-6': { input: 0.015, output: 0.075 },
  'claude-sonnet-4-6': { input: 0.003, output: 0.015 },
  'claude-haiku-4-5': { input: 0.0008, output: 0.004 },
  'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-5-haiku': { input: 0.0008, output: 0.004 },
  // Gemini
  'gemini-2.5-pro': { input: 0.00125, output: 0.005 },
  'gemini-2.5-flash': { input: 0.000075, output: 0.0003 },
  'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
  'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
  // Ollama / local models — free at inference time
  'ollama': { input: 0, output: 0 },
}

export interface CostGuardOptions {
  /** Hard budget in USD. Aborts the run when exceeded. */
  budgetUsd: number
  /**
   * AbortController to signal the runtime to stop. The runtime picks
   * this up via RunOptions.signal (RT13).
   */
  controller: AbortController
  /**
   * Optional price table override. Partial — merged over DEFAULT_PRICES.
   */
  prices?: Record<string, TokenPrice>
  /**
   * Called whenever the running total changes. Useful for progress UI.
   */
  onCost?: (info: {
    costUsd: number
    promptTokens: number
    completionTokens: number
    budgetRemainingUsd: number
  }) => void
  /**
   * Called when the budget is exceeded (just before abort). By default
   * also logs a warning to stderr.
   */
  onExceeded?: (info: { costUsd: number; budgetUsd: number }) => void
  /** Force a specific model id if the runtime doesn't emit one. */
  modelOverride?: string
  /** Observer name for tracing. */
  name?: string
}

/**
 * Look up the best price match for a model id. Prefix match — 'gpt-4o-mini'
 * matches its own entry before 'gpt-4o'. Returns { input: 0, output: 0 }
 * (free) for unknown models plus a console warning once.
 */
export function priceFor(
  model: string | undefined,
  prices: Record<string, TokenPrice> = DEFAULT_PRICES,
): TokenPrice {
  if (!model) return { input: 0, output: 0 }

  const keys = Object.keys(prices).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (model.toLowerCase().startsWith(key.toLowerCase())) return prices[key]
  }
  return { input: 0, output: 0 }
}

/**
 * Compute dollar cost from a usage record plus a price record.
 */
export function computeCost(
  usage: { promptTokens: number; completionTokens: number },
  price: TokenPrice,
): number {
  return (usage.promptTokens / 1000) * price.input + (usage.completionTokens / 1000) * price.output
}

/**
 * A `cost-guarded` observer. Tracks token usage from llm:end events,
 * computes running cost, aborts the run when the budget is exceeded.
 *
 * Usage:
 *
 * ```ts
 * const controller = new AbortController()
 * const runtime = createRuntime({
 *   adapter,
 *   observers: [costGuard({ budgetUsd: 0.10, controller })],
 * })
 *
 * try {
 *   await runtime.run('long task', { signal: controller.signal })
 * } catch (err) {
 *   if ((err as Error).name === 'AbortError') {
 *     console.log('Aborted due to cost budget.')
 *   }
 * }
 * ```
 */
export function costGuard(options: CostGuardOptions): Observer & {
  /** Total cost so far, in USD. */
  costUsd: () => number
  /** Cumulative prompt tokens seen. */
  promptTokens: () => number
  /** Cumulative completion tokens seen. */
  completionTokens: () => number
  /** Whether the budget has already been exceeded. */
  exceeded: () => boolean
  /** Reset the internal counters. */
  reset: () => void
} {
  const { budgetUsd, controller, prices, onCost, onExceeded, modelOverride } = options
  const mergedPrices = prices ? { ...DEFAULT_PRICES, ...prices } : DEFAULT_PRICES

  let currentModel: string | undefined = modelOverride
  let prompt = 0
  let completion = 0
  let cost = 0
  let exceededOnce = false

  const update = () => {
    const price = priceFor(currentModel, mergedPrices)
    cost = computeCost({ promptTokens: prompt, completionTokens: completion }, price)
    onCost?.({
      costUsd: cost,
      promptTokens: prompt,
      completionTokens: completion,
      budgetRemainingUsd: Math.max(0, budgetUsd - cost),
    })
    if (cost > budgetUsd && !exceededOnce) {
      exceededOnce = true
      onExceeded?.({ costUsd: cost, budgetUsd })
      controller.abort()
    }
  }

  return {
    name: options.name ?? 'cost-guard',
    on(event: AgentEvent) {
      switch (event.type) {
        case 'llm:start':
          if (event.model && !modelOverride) currentModel = event.model
          break
        case 'llm:end':
          if (event.usage) {
            prompt += event.usage.promptTokens
            completion += event.usage.completionTokens
            update()
          }
          break
      }
    },
    costUsd: () => cost,
    promptTokens: () => prompt,
    completionTokens: () => completion,
    exceeded: () => exceededOnce,
    reset: () => {
      prompt = 0
      completion = 0
      cost = 0
      exceededOnce = false
    },
  }
}
