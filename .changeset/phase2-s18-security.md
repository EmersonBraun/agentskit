---
'@agentskit/core': minor
'@agentskit/observability': minor
'@agentskit/sandbox': minor
---

Phase 2 sprint S18 (security) — issues #160, #161, #162, #163, #164.

- `@agentskit/core/security` (subpath) — three primitives under one
  subpath so they cost zero bytes in the main bundle.
  - `createPIIRedactor` + `DEFAULT_PII_RULES`: regex-based email /
    phone / SSN / IPv4 / credit-card / UUID redactor with per-rule
    hit counts.
  - `createInjectionDetector` + `DEFAULT_INJECTION_HEURISTICS`:
    heuristic (ignore-previous, role-reset, system-leak, developer-
    mode, policy-bypass, tool-smuggle, role-confusion) + optional
    model classifier (Llama Guard / Prompt Guard / Rebuff) blended
    via max.
  - `createRateLimiter`: token-bucket keyed by user/IP/key with
    per-tier bucket configuration, custom clock for tests,
    `inspect` / `reset`.
- `@agentskit/observability` — `createSignedAuditLog` +
  `createInMemoryAuditStore`. Hash-chained + HMAC-signed log, with
  `verify` that detects both splicing and content tampering. Store
  contract is 4 methods — SOC 2 / HIPAA friendly evidence.
- `@agentskit/sandbox` — `createMandatorySandbox` enforces an
  allow / deny / require-sandbox / validators policy across every
  tool the runtime sees. `wrap(tool)` returns a policy-enforced
  clone; `check(tool)` reports the decision without wrapping.
