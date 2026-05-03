---
"@agentskit/core": minor
"@agentskit/memory": minor
"@agentskit/observability": minor
---

Add reveal-by-role PII vault + memory & observability redaction wrappers. Closes #791 (memory write + reveal-by-role) and #792 (redaction across observability sinks).

**`@agentskit/core/security`**: new `tokenize()` + `reveal()` + `RedactionVault` interface + `createInMemoryRedactionVault()`. Where the existing `createPIIRedactor` produces irreversible `[REDACTED_*]` markers, `tokenize()` replaces matches with opaque `<<piitoken:…>>` markers and stores originals in the vault. `reveal({ vault, actor })` recovers originals only when the actor's roles intersect the per-token `allowedRoles`. Per-token role gating means the same string can carry email-revealable-by-support and SSN-revealable-only-by-compliance markers side by side. Both calls emit structured `pii:redact` / `pii:reveal` / `pii:reveal-denied` audit events via an optional `audit` sink — wire to the existing `createSignedAuditLog` for SOC2 / HIPAA evidence.

**`@agentskit/memory`**: `wrapChatMemoryWithRedaction(mem, opts)` and `wrapVectorMemoryWithRedaction(mem, opts)` accept any `ChatMemory` / `VectorMemory` and redact (or tokenize) content on every write. `load` / `search` / `delete` are passthrough; reveal happens at read time via `@agentskit/core/security` `reveal()`. Defaults to `mode: 'redact'` (irreversible) so a missing vault config can't accidentally tokenize without a destination.

**`@agentskit/observability`**: `wrapObserverWithRedaction(observer, opts)` redacts content fields in the `AgentEvent` stream (`llm:end.content`, `tool:start.args`, `tool:end.result`, `agent:delegate:end.result`, `error.message`) before they reach the underlying sink. Numeric/structural fields (`usage`, `durationMs`, `messageCount`) pass through untouched so dashboards stay correct. The wrapped observer is named `redacted(<inner>)` for traceability.

Together these three close the silent-leak path PR #802 left open: even with send-side redaction in place, persisted memory and Langfuse / Braintrust / replay snapshots still stored raw payloads. Now they don't — and a vault-backed deployment can still recover originals via role-gated reveal.

Reference adapter for KMS-backed vaults ships in a follow-up issue (the in-memory vault is documented as test/single-node only).
