---
"@agentskit/adapters": patch
"@agentskit/memory": patch
"@agentskit/observability": patch
"@agentskit/rag": patch
"@agentskit/runtime": patch
"@agentskit/sandbox": patch
---

Add browser-safe subpath exports so docs/showcase demos can import individual modules without pulling in node-only barrel deps.

- `@agentskit/adapters/createAdapter`
- `@agentskit/memory/personalization`
- `@agentskit/observability/trace-tracker`, `/cost-guard`
- `@agentskit/rag/chunker`
- `@agentskit/runtime/shared-context`
- `@agentskit/sandbox/sandbox`, `/types`

`@agentskit/sandbox`: `createSandbox` now lazy-loads the E2B backend via dynamic import with bundler-ignore comments. No runtime API change — callers passing a custom `backend` never reach the E2B path.
