---
"@agentskit/observability": minor
---

Production-grade cost guard. Closes #787 (hard-kill mode), #788 (forecasting + window caps), #789 (alert sinks), #790 (chargeback report).

`createAdvancedCostGuard({ budgets, caps, mode, disableRuntime, alertSinks })` extends the existing per-tenant guard with:

- **Modes**: `warn` (log only), `reject` (per-tenant flag, no abort), `kill` (disables the tenant runtime via an injected `disableRuntime` callback; refuses to construct without one).
- **Window caps**: `perMinute` / `perDay` / `perMonth` / arbitrary custom rolling buckets. Each window has its own threshold; tripping any one fires alerts and (in `kill` mode) disables the tenant.
- **50 / 80 / 100 % threshold alerts** per window, fired at most once per window.
- **Linear forecast alerts**: at >25% of a window's elapsed time, if extrapolated final spend exceeds the cap, emit `cost:forecast` with `msUntilExceeded`. Once per window.
- **Per-tenant cap overrides** via `tenantCaps`.
- **Pluggable alert sinks**: `CostAlertSink = (event) => void | Promise<void>`. Built-in `consoleAlertSink()`, `webhookAlertSink({ url, headers })`, and `throttle(sink, windowMs)` wrapper for noisy windows. Alert keys throttle on `(type, tenant, window, threshold)` so different tenants alert independently.
- **`enable(tenant)`** for explicit re-enable after kill (caller must also clear the persisted disabled flag).

`chargebackReport(samples, { groupBy, from, to, prices })` is a pure exporter for cost attribution. Group keys: `tenant` / `user` / `skill` / `tool` / `model` / any of those joined with `tenant+`. Rows sorted by spend desc; samples missing `costUsd` get computed from `(model, tokens, prices)`. `chargebackReportToCsv(report)` renders a finance-friendly CSV (header + one row per group + TOTAL footer; commas / quotes / newlines correctly escaped).

Both ship alongside the existing `costGuard` / `multiTenantCostGuard` — no breaking change. Use the advanced guard when you need windowed budgets, forecasting, or hard-kill enforcement; the simple guards are still the right tool for single-run dollar caps.
