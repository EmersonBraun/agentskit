import type { AgentEvent, Observer } from '@agentskit/core'
import { DEFAULT_PRICES, priceFor, computeCost, type TokenPrice } from './cost-guard'

export interface MultiTenantCostGuardOptions {
  /**
   * Per-tenant USD budgets. Tenants not listed here either inherit
   * `defaultBudgetUsd` (if set) or are unmetered (no enforcement).
   */
  budgets: Record<string, number>
  /**
   * Fallback budget for tenants not explicitly listed in `budgets`.
   * Omit to make unlisted tenants unmetered.
   */
  defaultBudgetUsd?: number
  /**
   * Resolver called on every event. Returns the active tenant id, or
   * `undefined` to skip metering for this event entirely. The runtime
   * does not propagate tenant ids natively; wire this up with
   * AsyncLocalStorage or by calling `setTenant(...)` from the returned
   * observer immediately before invoking `runtime.run`.
   */
  tenantOf?: () => string | undefined
  /** Optional price table override. */
  prices?: Record<string, TokenPrice>
  /**
   * Called when a tenant exceeds its budget. The runtime is NOT aborted
   * automatically — multi-tenant deployments typically reject the
   * inbound request at the gateway instead. Wire your own enforcement
   * here (`controllers[tenant].abort()`, log+drop, send 402, etc.).
   */
  onExceeded?: (info: { tenant: string; costUsd: number; budgetUsd: number }) => void
  /** Called whenever a tenant's running total changes. */
  onCost?: (info: {
    tenant: string
    costUsd: number
    promptTokens: number
    completionTokens: number
    budgetUsd: number | undefined
    budgetRemainingUsd: number | undefined
  }) => void
  modelOverride?: string
  name?: string
}

interface TenantState {
  prompt: number
  completion: number
  cost: number
  model: string | undefined
  exceeded: boolean
}

function freshState(modelOverride?: string): TenantState {
  return { prompt: 0, completion: 0, cost: 0, model: modelOverride, exceeded: false }
}

/**
 * Per-tenant cost-guard. Same accounting as `costGuard`, partitioned by
 * tenant id, with separate budgets per tenant and a no-abort default
 * (the SaaS gateway typically enforces).
 */
export function multiTenantCostGuard(options: MultiTenantCostGuardOptions): Observer & {
  /** Active tenant. The observer ignores events while this is unset. */
  setTenant: (tenant: string | undefined) => void
  costUsd: (tenant: string) => number
  promptTokens: (tenant: string) => number
  completionTokens: (tenant: string) => number
  exceeded: (tenant: string) => boolean
  budgetFor: (tenant: string) => number | undefined
  reset: (tenant?: string) => void
  tenants: () => string[]
} {
  const mergedPrices = options.prices ? { ...DEFAULT_PRICES, ...options.prices } : DEFAULT_PRICES
  const tenants = new Map<string, TenantState>()
  let activeTenant: string | undefined

  const resolve = (): string | undefined => {
    return options.tenantOf?.() ?? activeTenant
  }

  const budgetOf = (tenant: string): number | undefined => {
    return options.budgets[tenant] ?? options.defaultBudgetUsd
  }

  const stateOf = (tenant: string): TenantState => {
    let s = tenants.get(tenant)
    if (!s) {
      s = freshState(options.modelOverride)
      tenants.set(tenant, s)
    }
    return s
  }

  const update = (tenant: string, s: TenantState) => {
    const price = priceFor(s.model, mergedPrices)
    s.cost = computeCost({ promptTokens: s.prompt, completionTokens: s.completion }, price)
    const budget = budgetOf(tenant)
    options.onCost?.({
      tenant,
      costUsd: s.cost,
      promptTokens: s.prompt,
      completionTokens: s.completion,
      budgetUsd: budget,
      budgetRemainingUsd: budget !== undefined ? Math.max(0, budget - s.cost) : undefined,
    })
    if (budget !== undefined && s.cost > budget && !s.exceeded) {
      s.exceeded = true
      options.onExceeded?.({ tenant, costUsd: s.cost, budgetUsd: budget })
    }
  }

  return {
    name: options.name ?? 'cost-guard-multi-tenant',
    on(event: AgentEvent) {
      const tenant = resolve()
      if (!tenant) return
      const s = stateOf(tenant)
      switch (event.type) {
        case 'llm:start':
          if (event.model && !options.modelOverride) s.model = event.model
          break
        case 'llm:end':
          if (event.usage) {
            s.prompt += event.usage.promptTokens
            s.completion += event.usage.completionTokens
            update(tenant, s)
          }
          break
      }
    },
    setTenant(tenant) { activeTenant = tenant },
    costUsd: (tenant) => stateOf(tenant).cost,
    promptTokens: (tenant) => stateOf(tenant).prompt,
    completionTokens: (tenant) => stateOf(tenant).completion,
    exceeded: (tenant) => stateOf(tenant).exceeded,
    budgetFor: (tenant) => budgetOf(tenant),
    reset(tenant) {
      if (tenant) tenants.set(tenant, freshState(options.modelOverride))
      else tenants.clear()
    },
    tenants: () => Array.from(tenants.keys()),
  }
}
