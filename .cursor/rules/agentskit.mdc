---
description: AgentsKit monorepo rules for Cursor
globs: ["**/*"]
alwaysApply: true
---

# Cursor rules for AgentsKit

Read [`AGENTS.md`](../../AGENTS.md) at the repository root — it is the single source of truth for all AI agents in this repo. This file is a thin pointer.

## Highest-priority rules

1. `@agentskit/core` has **zero runtime dependencies** and must stay **under 10 KB gzipped**. Do not add imports that pull in new packages.
2. Contracts in `packages/core/src/` are **pinned to ADRs** under `docs/architecture/adrs/`. Do not change them without opening a new ADR.
3. **Named exports only**, TypeScript strict, no `any`, no default exports, no hardcoded styles (use `data-ak-*`).
4. Every user-facing change needs a **changeset** (`pnpm changeset`).
5. Never bypass CI with `--no-verify` or skip flags.

For the full rule set, package map, workflow expectations, and anti-patterns, see `AGENTS.md`.
