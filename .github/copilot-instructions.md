# GitHub Copilot instructions

Read [`AGENTS.md`](../AGENTS.md) at the repository root before suggesting code. It is the single source of truth for all AI agents working on AgentsKit.

## Summary of highest-priority rules

- `@agentskit/core` has **zero runtime dependencies** and must stay **under 10 KB gzipped**. Do not add imports that pull new packages into core.
- Core contracts (Adapter, Tool, Memory, Retriever, Skill, Runtime) are pinned to ADRs under `docs/architecture/adrs/`. Do not change them without a new ADR.
- TypeScript **strict mode**, **named exports only**, no `any`, no default exports, no hardcoded styles (use `data-ak-*`).
- Every user-facing change needs a **changeset** (`pnpm changeset`).
- Never bypass CI with `--no-verify` or skip flags. Never force-push to `main`.

For the full rule set, package map, commands, workflow expectations, and anti-patterns, see [`AGENTS.md`](../AGENTS.md).
