import { describe, it, expect, vi } from 'vitest'
import { multiTenantCostGuard } from '../src/cost-guard-multi-tenant'

function make(opts: Partial<Parameters<typeof multiTenantCostGuard>[0]> = {}) {
  return multiTenantCostGuard({
    budgets: { 'tenant-a': 0.01, 'tenant-b': 1 },
    ...opts,
  })
}

const start = (model: string) => ({
  type: 'llm:start' as const,
  spanId: 's1',
  parentSpanId: undefined,
  model,
  attributes: {},
  startTime: 0,
})

const end = (promptTokens: number, completionTokens: number) => ({
  type: 'llm:end' as const,
  spanId: 's1',
  content: 'x',
  usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
  attributes: {},
  startTime: 0,
  endTime: 1,
})

describe('multiTenantCostGuard', () => {
  it('partitions usage by tenant', () => {
    const guard = make()
    guard.setTenant('tenant-a')
    guard.on(start('gpt-4o'))
    guard.on(end(1000, 500))
    guard.setTenant('tenant-b')
    guard.on(start('gpt-4o'))
    guard.on(end(2000, 1000))
    expect(guard.promptTokens('tenant-a')).toBe(1000)
    expect(guard.promptTokens('tenant-b')).toBe(2000)
    expect(guard.tenants().sort()).toEqual(['tenant-a', 'tenant-b'])
  })

  it('fires onExceeded once per tenant when its budget is breached', () => {
    const onExceeded = vi.fn()
    const guard = make({ onExceeded })
    guard.setTenant('tenant-a')
    guard.on(start('gpt-4o'))
    guard.on(end(10_000, 5_000))   // 0.025 + 0.05 = 0.075 USD > 0.01
    expect(guard.exceeded('tenant-a')).toBe(true)
    expect(onExceeded).toHaveBeenCalledTimes(1)
    // additional events do not re-fire
    guard.on(start('gpt-4o'))
    guard.on(end(1, 1))
    expect(onExceeded).toHaveBeenCalledTimes(1)
  })

  it('does not abort the runtime — emission is up to the caller', () => {
    const guard = make()
    guard.setTenant('tenant-a')
    guard.on(start('gpt-4o'))
    guard.on(end(10_000, 10_000))
    expect(guard.exceeded('tenant-a')).toBe(true)
  })

  it('uses defaultBudgetUsd when tenant is unlisted', () => {
    const onExceeded = vi.fn()
    const guard = multiTenantCostGuard({
      budgets: {},
      defaultBudgetUsd: 0.001,
      onExceeded,
    })
    guard.setTenant('walk-in')
    guard.on(start('gpt-4o'))
    guard.on(end(1000, 500))
    expect(onExceeded).toHaveBeenCalledTimes(1)
    expect(guard.budgetFor('walk-in')).toBe(0.001)
  })

  it('skips metering entirely when no tenant is set', () => {
    const guard = make()
    guard.on(start('gpt-4o'))
    guard.on(end(1000, 500))
    expect(guard.tenants()).toEqual([])
  })

  it('reset(tenant) clears one bucket, reset() clears all', () => {
    const guard = make()
    guard.setTenant('tenant-a')
    guard.on(start('gpt-4o'))
    guard.on(end(1000, 500))
    guard.setTenant('tenant-b')
    guard.on(start('gpt-4o'))
    guard.on(end(1000, 500))
    guard.reset('tenant-a')
    expect(guard.costUsd('tenant-a')).toBe(0)
    expect(guard.costUsd('tenant-b')).toBeGreaterThan(0)
    guard.reset()
    expect(guard.costUsd('tenant-b')).toBe(0)
  })

  it('tenantOf resolver overrides setTenant', () => {
    let externalTenant: string | undefined = 'tenant-b'
    const guard = multiTenantCostGuard({
      budgets: { 'tenant-b': 1 },
      tenantOf: () => externalTenant,
    })
    guard.setTenant('ignored')
    guard.on(start('gpt-4o'))
    guard.on(end(1000, 500))
    expect(guard.promptTokens('tenant-b')).toBe(1000)
    expect(guard.tenants()).toEqual(['tenant-b'])
    externalTenant = undefined
    guard.on(start('gpt-4o'))
    guard.on(end(99, 99))   // skipped
    expect(guard.promptTokens('tenant-b')).toBe(1000)
  })
})
