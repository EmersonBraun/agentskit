# Windsurf rules

Read AGENTS.md at the repository root for the full rule set — it is the single source of truth for all AI agents in this repo.

## Highest-priority rules

- @agentskit/core has zero runtime dependencies and must stay under 10 KB gzipped. Do not add imports that pull new packages into core.
- Core contracts (Adapter, Tool, Memory, Retriever, Skill, Runtime) are pinned to ADRs under docs/architecture/adrs/. Changing a contract requires a new ADR.
- TypeScript strict, named exports only, no `any`, no default exports, no hardcoded styles (use data-ak-* attributes).
- Every user-facing change requires a changeset (pnpm changeset).
- Never bypass CI with --no-verify or skip flags. Never force-push to main.
