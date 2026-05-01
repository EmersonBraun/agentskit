---
'@agentskit/observability': minor
---

feat(observability): `multiTenantCostGuard` — same accounting as `costGuard` partitioned by tenant id, with per-tenant budgets, optional `defaultBudgetUsd` for unlisted tenants, and a no-auto-abort default (SaaS deployments enforce at the gateway). Tenant resolution via `tenantOf()` (AsyncLocalStorage-friendly) or imperative `setTenant(...)`.
