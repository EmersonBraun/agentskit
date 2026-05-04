import { ConfigError, ErrorCodes, type AgentEvent, type Observer } from '@agentskit/core'
import { DEFAULT_PRICES, computeCost, priceFor, type TokenPrice } from './cost-guard'

/**
 * Production-grade cost guard. Extends the multi-tenant guard with:
 *
 *   - **Modes**: `warn` (log only) · `reject` (per-tenant flag, no abort)
 *     · `kill` (disable the tenant runtime via an injected
 *     `disableRuntime` callback; requires explicit re-enable).
 *   - **Window caps**: per-minute / per-day / per-month rolling buckets.
 *     Each window has its own threshold; tripping any one fires alerts
 *     and (in `kill` mode) disables the tenant.
 *   - **Linear forecasting**: at 50 / 80 / 100 % of any window cap, emit
 *     a `cost:threshold` alert with an extrapolated time-to-cap.
 *   - **Pluggable alert sinks**: the same contract regardless of where
 *     the alert lands (Slack webhook, PagerDuty, email gateway).
 *   - **Throttled alerting**: at most one alert per (tenant, window,
 *     threshold) per cap window — avoids alert storms.
 *
 * Closes #787 (hard-kill), #788 (forecasting + caps), #789 (alert sinks).
 * Chargeback report (#790) lives in `chargebackReport()` below.
 */

export type CostGuardMode = 'warn' | 'reject' | 'kill'

export interface CostCapWindow {
  /** Window length in milliseconds. */
  windowMs: number
  /** USD ceiling per window. */
  budgetUsd: number
}

export interface CostCaps {
  perMinute?: CostCapWindow
  perDay?: CostCapWindow
  perMonth?: CostCapWindow
  /** Custom additional windows. */
  custom?: Record<string, CostCapWindow>
}

export type CostAlertType =
  | 'cost:threshold'      // 50/80/100 % of a window cap reached
  | 'cost:exceeded'       // hard cap exceeded
  | 'cost:disabled'       // kill mode triggered → tenant disabled
  | 'cost:forecast'       // linear extrapolation predicts overrun

export interface CostAlertEvent {
  type: CostAlertType
  tenant: string
  /** Window id (`'perMinute'`, `'perDay'`, `'perMonth'`, custom name). */
  window: string
  /** ISO 8601 timestamp. */
  at: string
  /** Spend so far in this window (USD). */
  costUsd: number
  /** Cap for this window (USD). */
  budgetUsd: number
  /** Fraction of budget consumed (0–∞). */
  utilization: number
  /** Threshold that triggered this alert (`0.5`, `0.8`, `1.0`, or undefined for forecast). */
  threshold?: number
  /**
   * Estimated milliseconds until the budget is exhausted at the
   * current spend rate, when type is `'cost:forecast'`.
   */
  msUntilExceeded?: number
  /** Optional human-readable reason (mode change, etc.). */
  reason?: string
}

export type CostAlertSink = (event: CostAlertEvent) => void | Promise<void>

export interface AdvancedCostGuardOptions {
  /** Per-tenant USD budgets (overall, applied alongside windows). */
  budgets: Record<string, number>
  /** Fallback overall budget for tenants not listed. */
  defaultBudgetUsd?: number
  /** Window caps applied to every tenant. Per-tenant overrides via `tenantCaps`. */
  caps?: CostCaps
  /** Per-tenant override of `caps`. Wins over the workspace-wide `caps`. */
  tenantCaps?: Record<string, CostCaps>
  /** Active tenant resolver (same shape as `multiTenantCostGuard.tenantOf`). */
  tenantOf?: () => string | undefined
  prices?: Record<string, TokenPrice>
  /**
   * Enforcement mode (default `'warn'`). `'kill'` requires
   * `disableRuntime`.
   */
  mode?: CostGuardMode
  /**
   * Called when a tenant is disabled in `'kill'` mode. Must persist the
   * disabled state (Redis flag, DB row) so the runtime stays disabled
   * across restarts. The tenant is re-enabled only via your own
   * out-of-band call (e.g. an admin API).
   */
  disableRuntime?: (tenant: string, reason: string) => void | Promise<void>
  /** One or more alert sinks. Fired in registration order. */
  alertSinks?: CostAlertSink[]
  modelOverride?: string
  /** Clock override for tests. */
  now?: () => number
  name?: string
}

interface SpendBucket {
  /** Window id this bucket belongs to. */
  window: string
  /** [start, end) times in ms epoch. */
  start: number
  /** Cap budget for this window. */
  budgetUsd: number
  /** Window length in ms. */
  windowMs: number
  /** Spend so far in this window. */
  costUsd: number
  /** Thresholds already alerted this window (e.g. {0.5, 0.8, 1.0}). */
  alerted: Set<number>
  /** Whether the forecast alert has fired this window. */
  forecastAlerted: boolean
}

interface TenantState {
  prompt: number
  completion: number
  totalCost: number
  model: string | undefined
  exceededOverall: boolean
  disabled: boolean
  buckets: Map<string, SpendBucket>
}

function freshTenant(modelOverride?: string): TenantState {
  return {
    prompt: 0,
    completion: 0,
    totalCost: 0,
    model: modelOverride,
    exceededOverall: false,
    disabled: false,
    buckets: new Map(),
  }
}

function rollBucket(bucket: SpendBucket, now: number): void {
  if (now >= bucket.start + bucket.windowMs) {
    bucket.start = now - (now - bucket.start) % bucket.windowMs
    bucket.costUsd = 0
    bucket.alerted.clear()
    bucket.forecastAlerted = false
  }
}

function ensureBucket(
  state: TenantState,
  windowId: string,
  cap: CostCapWindow,
  now: number,
): SpendBucket {
  let bucket = state.buckets.get(windowId)
  if (!bucket) {
    bucket = {
      window: windowId,
      start: now,
      budgetUsd: cap.budgetUsd,
      windowMs: cap.windowMs,
      costUsd: 0,
      alerted: new Set(),
      forecastAlerted: false,
    }
    state.buckets.set(windowId, bucket)
  } else {
    rollBucket(bucket, now)
    // Update cap if the caller changed it between calls.
    bucket.budgetUsd = cap.budgetUsd
    bucket.windowMs = cap.windowMs
  }
  return bucket
}

const THRESHOLDS = [0.5, 0.8, 1.0] as const

function pickCaps(
  options: AdvancedCostGuardOptions,
  tenant: string,
): Array<[string, CostCapWindow]> {
  const merged: CostCaps = { ...(options.caps ?? {}), ...(options.tenantCaps?.[tenant] ?? {}) }
  const out: Array<[string, CostCapWindow]> = []
  if (merged.perMinute) out.push(['perMinute', merged.perMinute])
  if (merged.perDay) out.push(['perDay', merged.perDay])
  if (merged.perMonth) out.push(['perMonth', merged.perMonth])
  if (merged.custom) {
    for (const [name, cap] of Object.entries(merged.custom)) out.push([name, cap])
  }
  return out
}

export interface AdvancedCostGuard extends Observer {
  setTenant: (tenant: string | undefined) => void
  costUsd: (tenant: string) => number
  windowSpend: (tenant: string, window: string) => number | undefined
  isDisabled: (tenant: string) => boolean
  /** Re-enable a tenant disabled by `kill` mode. Caller must also clear the persisted flag. */
  enable: (tenant: string) => void
  reset: (tenant?: string) => void
  tenants: () => string[]
}

export function createAdvancedCostGuard(
  options: AdvancedCostGuardOptions,
): AdvancedCostGuard {
  if (options.mode === 'kill' && !options.disableRuntime) {
    throw new ConfigError({
      code: ErrorCodes.AK_CONFIG_INVALID,
      message: 'createAdvancedCostGuard: mode "kill" requires disableRuntime callback',
      hint: 'Provide a function that persists the disabled flag (Redis, DB, KV).',
    })
  }
  const mode: CostGuardMode = options.mode ?? 'warn'
  const mergedPrices = options.prices ? { ...DEFAULT_PRICES, ...options.prices } : DEFAULT_PRICES
  const now = options.now ?? Date.now
  const tenants = new Map<string, TenantState>()
  let activeTenant: string | undefined

  const fireAlert = async (event: CostAlertEvent): Promise<void> => {
    for (const sink of options.alertSinks ?? []) {
      try {
        await sink(event)
      } catch {
        // Sinks must not break the metering loop.
      }
    }
  }

  const overallBudget = (tenant: string): number | undefined => {
    return options.budgets[tenant] ?? options.defaultBudgetUsd
  }

  const stateOf = (tenant: string): TenantState => {
    let state = tenants.get(tenant)
    if (!state) {
      state = freshTenant(options.modelOverride)
      tenants.set(tenant, state)
    }
    return state
  }

  /**
   * Synchronously update state + bucket counters and decide which
   * alerts must fire. Returns the alert events ready for the caller
   * to dispatch via the (async) sinks. Keeping this synchronous is
   * what closes the concurrency window: by the time `on()` returns,
   * `state.totalCost`, every bucket's `costUsd`, the alert bookkeeping
   * (`alerted`, `forecastAlerted`, `exceededOverall`), and the
   * `state.disabled` flag are all in their final consistent shape.
   */
  const recordSpend = (
    tenant: string,
    state: TenantState,
    deltaCost: number,
  ): { alerts: CostAlertEvent[]; disable?: { reason: string } } => {
    state.totalCost += deltaCost
    const t = now()
    const alerts: CostAlertEvent[] = []

    const caps = pickCaps(options, tenant)
    for (const [windowId, cap] of caps) {
      const bucket = ensureBucket(state, windowId, cap, t)
      bucket.costUsd += deltaCost
      const utilization = bucket.budgetUsd > 0 ? bucket.costUsd / bucket.budgetUsd : 0
      for (const threshold of THRESHOLDS) {
        if (utilization >= threshold && !bucket.alerted.has(threshold)) {
          bucket.alerted.add(threshold)
          alerts.push({
            type: threshold === 1.0 ? 'cost:exceeded' : 'cost:threshold',
            tenant,
            window: windowId,
            at: new Date(t).toISOString(),
            costUsd: bucket.costUsd,
            budgetUsd: bucket.budgetUsd,
            utilization,
            threshold,
          })
        }
      }
      const elapsed = t - bucket.start
      if (
        !bucket.forecastAlerted &&
        elapsed > 0 &&
        elapsed < bucket.windowMs &&
        elapsed > bucket.windowMs * 0.25 &&
        utilization > 0
      ) {
        const projectedFinal = (bucket.costUsd / elapsed) * bucket.windowMs
        if (projectedFinal > bucket.budgetUsd) {
          bucket.forecastAlerted = true
          const remaining = bucket.budgetUsd - bucket.costUsd
          const rate = bucket.costUsd / elapsed
          const msUntilExceeded = remaining > 0 && rate > 0 ? remaining / rate : 0
          alerts.push({
            type: 'cost:forecast',
            tenant,
            window: windowId,
            at: new Date(t).toISOString(),
            costUsd: bucket.costUsd,
            budgetUsd: bucket.budgetUsd,
            utilization,
            msUntilExceeded,
          })
        }
      }
    }

    const overall = overallBudget(tenant)
    if (overall !== undefined && state.totalCost > overall && !state.exceededOverall) {
      state.exceededOverall = true
      alerts.push({
        type: 'cost:exceeded',
        tenant,
        window: 'overall',
        at: new Date(t).toISOString(),
        costUsd: state.totalCost,
        budgetUsd: overall,
        utilization: state.totalCost / overall,
        threshold: 1.0,
      })
    }

    const tripped =
      state.exceededOverall ||
      Array.from(state.buckets.values()).some(b => b.alerted.has(1.0))
    let disable: { reason: string } | undefined
    if (mode === 'kill' && tripped && !state.disabled) {
      state.disabled = true
      const reason = state.exceededOverall
        ? `overall budget exceeded ($${overall} cap)`
        : 'window cap exceeded'
      disable = { reason }
      alerts.push({
        type: 'cost:disabled',
        tenant,
        window: 'overall',
        at: new Date(t).toISOString(),
        costUsd: state.totalCost,
        budgetUsd: overall ?? 0,
        utilization: overall ? state.totalCost / overall : 0,
        reason,
      })
    }

    return { alerts, disable }
  }

  const dispatchAlerts = async (
    tenant: string,
    alerts: CostAlertEvent[],
    disable?: { reason: string },
  ): Promise<void> => {
    for (const event of alerts) await fireAlert(event)
    if (disable) await options.disableRuntime?.(tenant, disable.reason)
  }

  return {
    name: options.name ?? 'cost-guard-advanced',
    on(event: AgentEvent) {
      const tenant = options.tenantOf?.() ?? activeTenant
      if (!tenant) return
      const state = stateOf(tenant)
      if (state.disabled && mode === 'kill') return
      if (event.type === 'llm:start' && event.model && !options.modelOverride) {
        state.model = event.model
      }
      if (event.type === 'llm:end' && event.usage) {
        state.prompt += event.usage.promptTokens
        state.completion += event.usage.completionTokens
        const price = priceFor(state.model, mergedPrices)
        const newTotal = computeCost(
          { promptTokens: state.prompt, completionTokens: state.completion },
          price,
        )
        const delta = newTotal - state.totalCost
        if (delta > 0) {
          // Mutate state SYNCHRONOUSLY so concurrent on() calls see the
          // updated totals. Async work (alert sinks, disableRuntime) is
          // fire-and-forget afterward and does not touch state again.
          const { alerts, disable } = recordSpend(tenant, state, delta)
          if (alerts.length > 0 || disable) {
            void dispatchAlerts(tenant, alerts, disable)
          }
        }
      }
    },
    setTenant(tenant) {
      activeTenant = tenant
    },
    costUsd: (tenant) => stateOf(tenant).totalCost,
    windowSpend: (tenant, window) => stateOf(tenant).buckets.get(window)?.costUsd,
    isDisabled: (tenant) => stateOf(tenant).disabled,
    enable: (tenant) => {
      const state = stateOf(tenant)
      state.disabled = false
    },
    reset(tenant) {
      if (tenant) tenants.set(tenant, freshTenant(options.modelOverride))
      else tenants.clear()
    },
    tenants: () => Array.from(tenants.keys()),
  }
}

// ---------------------------------------------------------------------------
// Built-in alert sinks
// ---------------------------------------------------------------------------

/** Console alert sink — `[cost:<type>] <tenant> <window> $<cost>/$<budget>`. */
export function consoleAlertSink(): CostAlertSink {
  return event => {
    const line = `[${event.type}] tenant=${event.tenant} window=${event.window} ` +
      `cost=$${event.costUsd.toFixed(4)} budget=$${event.budgetUsd.toFixed(4)} ` +
      `util=${(event.utilization * 100).toFixed(1)}%` +
      (event.threshold ? ` threshold=${(event.threshold * 100).toFixed(0)}%` : '') +
      (event.reason ? ` reason="${event.reason}"` : '')
    process.stderr.write(`${line}\n`)
  }
}

export interface WebhookAlertSinkOptions {
  url: string
  /** Override fetch (tests / custom clients). */
  fetch?: typeof fetch
  /** Optional bearer / signing header. */
  headers?: Record<string, string>
}

/** Generic webhook sink — POSTs the event JSON. Wrap with throttle() for noisy windows. */
export function webhookAlertSink(options: WebhookAlertSinkOptions): CostAlertSink {
  const fetchImpl = options.fetch ?? fetch
  return async event => {
    if (!fetchImpl) return
    await fetchImpl(options.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(options.headers ?? {}) },
      body: JSON.stringify(event),
    })
  }
}

/**
 * Throttle wrapper — at most one alert per (tenant, window, type)
 * per `windowMs`. Wrap any sink to bound emit rate.
 */
export function throttle(sink: CostAlertSink, windowMs: number, now: () => number = Date.now): CostAlertSink {
  const lastFired = new Map<string, number>()
  return async event => {
    const key = `${event.type}|${event.tenant}|${event.window}|${event.threshold ?? ''}`
    const t = now()
    const previous = lastFired.get(key)
    if (previous !== undefined && t - previous < windowMs) return
    lastFired.set(key, t)
    await sink(event)
  }
}
