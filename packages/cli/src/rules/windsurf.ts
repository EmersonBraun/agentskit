/**
 * Windsurf `.windsurfrules` — plain markdown loaded into Cascade's
 * context for every chat in this workspace.
 */
export const WINDSURF_RULE = `# AgentsKit project rules (read first)

This workspace builds AgentsKit — a JavaScript agent toolkit with a 10 KB core,
six formal contracts, and ~19 plug-and-play packages. When generating or
editing code, follow these rules — they are enforced by CI.

## Imports
- **Named exports only.** No \`export default\`.
- Import from package roots (\`@agentskit/core\`, \`@agentskit/runtime\`, \`@agentskit/react\`, etc.).
- Tools subpaths: \`@agentskit/tools/integrations\`, \`@agentskit/tools/mcp\`, \`@agentskit/tools/mcp-devtools\`.

## Types
- Strict mode TypeScript. **No \`any\`** — use \`unknown\` and narrow.

## Errors
- **Do not** \`throw new Error(...)\` in package source. Use \`AdapterError\` /
  \`ToolError\` / \`MemoryError\` / \`RuntimeError\` / \`SandboxError\` / \`SkillError\` /
  \`ConfigError\` from \`@agentskit/core\`, paired with \`ErrorCodes\`.

## Tests
- vitest. Tests live in \`packages/<pkg>/tests/\` mirroring \`src/\`.
- E2E lives in \`apps/example-*\` with Playwright.

## Versioning
- Every behavior change needs a Changeset (\`pnpm changeset\`).

## Read first
- \`AGENTS.md\` — universal agent guidance
- \`apps/docs-next/content/docs/for-agents/\` — per-package agent docs
- \`docs/architecture/adrs/\` — six core contracts (Adapter, Tool, Memory, Retriever, Skill, Runtime)
- \`packages/<pkg>/CONVENTIONS.md\` — per-package contribution rules
`
