/**
 * Codex / Aider profile block — appended to the existing AGENTS.md
 * via `agentskit rules codex`. Codex and Aider both read AGENTS.md
 * but benefit from a structured profile listing the test runner,
 * allowed commands, and recommended models.
 */
export const CODEX_PROFILE = `<!-- agentskit-codex-profile:start -->
## Codex / Aider profile

Structured hints for CLI coding agents (OpenAI Codex, Aider, Claude Code,
Cursor) running against this workspace. Update via \`agentskit rules codex\`.

\`\`\`yaml
# AgentsKit Codex profile v1
profile: agentskit
runtime: node-25
package_manager: pnpm
test_runner: vitest
build_runner: turborepo

allowed_commands:
  - pnpm install
  - pnpm build
  - pnpm test
  - pnpm lint
  - pnpm changeset
  - pnpm --filter @agentskit/* test
  - pnpm --filter @agentskit/* lint
  - pnpm --filter @agentskit/* build

restricted_paths:
  - packages/core/src/errors.ts        # Touch carefully — every package depends on the typed errors here.
  - packages/core/src/security/        # Security-sensitive — small surface, requires review.
  - docs/architecture/adrs/            # Contract changes need a new ADR + major bump.

models_recommended:
  - claude-sonnet-4-6                  # Default — long context, fast.
  - gpt-5                              # Strong reasoning for refactors / cross-package work.
  - claude-opus-4-7                    # Heavy refactors, contract redesigns.

invariants:
  core_max_kb_gzip: 10
  no_default_exports: true
  strict_typescript: true
  no_bare_throw_new_error: true
  named_exports_only: true
  changeset_required_for_behavior_changes: true

read_first:
  - AGENTS.md
  - apps/docs-next/content/docs/for-agents/
  - docs/architecture/adrs/
\`\`\`
<!-- agentskit-codex-profile:end -->
`
