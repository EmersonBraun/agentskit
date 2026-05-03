/**
 * Cursor `.cursor/rules/agentskit.mdc` — applied to every file in the
 * workspace. Teaches Cursor the AgentsKit conventions so generated
 * code respects named-export-only, package boundaries, and the
 * for-agents/* manifest without extra prompting.
 */
export const CURSOR_RULE = `---
description: AgentsKit conventions — apply to every file in this workspace
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: true
---

# AgentsKit project rules

When writing or editing TypeScript in this workspace, follow these rules. They
are non-negotiable and enforced by CI.

## Imports

- Use **named exports only**. No \`export default\`.
- Import from package roots: \`@agentskit/core\`, \`@agentskit/runtime\`, \`@agentskit/react\`,
  \`@agentskit/ink\`, \`@agentskit/adapters\`, \`@agentskit/tools\`, \`@agentskit/skills\`,
  \`@agentskit/memory\`, \`@agentskit/rag\`, \`@agentskit/observability\`, \`@agentskit/eval\`,
  \`@agentskit/sandbox\`, \`@agentskit/cli\`, \`@agentskit/templates\`.
- For tools subpaths, use \`@agentskit/tools/integrations\`, \`@agentskit/tools/mcp\`,
  \`@agentskit/tools/mcp-devtools\`.

## Types

- TypeScript strict mode is on. **Do not use \`any\`** — use \`unknown\` and narrow.
- Headless React components: no hardcoded styles, use \`data-ak-*\` attributes.

## Errors

- Never \`throw new Error(...)\` inside package source. Use the typed errors from
  \`@agentskit/core\`: \`AdapterError\`, \`ToolError\`, \`MemoryError\`, \`RuntimeError\`,
  \`SandboxError\`, \`SkillError\`, \`ConfigError\`. Pair with \`ErrorCodes.<...>\`.

## Tests

- vitest. Place tests under \`packages/<pkg>/tests/\` mirroring \`src/\`.
- E2E lives in \`apps/example-*\` with Playwright.

## Versioning

- Every PR with a behavior change requires a Changeset (\`pnpm changeset\`).

## Where to look first

- Architecture, contracts, ADRs: \`docs/architecture/adrs/\`
- Per-package conventions: \`packages/<pkg>/CONVENTIONS.md\`
- Agent-facing index: \`AGENTS.md\` and \`apps/docs-next/content/docs/for-agents/\`
`
