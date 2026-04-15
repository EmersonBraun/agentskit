# Kiro steering — AgentsKit

Read [`AGENTS.md`](../../AGENTS.md) at the repository root for the full rule set. This file is a thin pointer so Kiro loads the universal guidance consistently.

## Highest-priority rules

- `@agentskit/core` has zero runtime dependencies and must stay under 10 KB gzipped.
- Core contracts (Adapter, Tool, Memory, Retriever, Skill, Runtime) are pinned to ADRs under `docs/architecture/adrs/`. Changing one requires a new ADR.
- TypeScript strict, named exports only, no `any`, no default exports, no hardcoded styles (`data-ak-*` attributes only).
- Every user-facing change requires a changeset (`pnpm changeset`).
- Never bypass CI with `--no-verify` or skip flags. Never force-push to `main`.

See `AGENTS.md` for the package map, commands, workflow expectations, and anti-patterns.
