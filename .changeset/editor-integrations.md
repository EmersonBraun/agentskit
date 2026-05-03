---
"@agentskit/cli": minor
---

Add `agentskit rules <editor>` — generates editor configuration so AI coding assistants know AgentsKit conventions without extra prompting. Closes #775 (Claude Code skill), #776 (Cursor / Windsurf rules), #778 (Codex / Aider profile).

Supports `cursor`, `windsurf`, `codex`, `claude-code`, and `all`. Each:

- **`cursor`** writes `.cursor/rules/agentskit.mdc` (Cursor MDC rule with `alwaysApply: true`).
- **`windsurf`** writes `.windsurfrules` (plain markdown loaded into Cascade).
- **`codex`** appends a YAML profile block to `AGENTS.md`, replacing any prior block in place. Refuses to touch an existing AGENTS.md without `--force` (load-bearing root file).
- **`claude-code`** writes a `.claude/skills/agentskit/` skill bundle (SKILL.md + 6 slash commands wrapping `init` / `doctor` / `add-tool` / `add-skill` / `lint-pii` / `rules`).

Idempotent: re-running with the same content reports `skipped`. Use `--force` to overwrite hand-edited rule files. `--out <dir>` targets a workspace root other than cwd.

Unblocks the editor-integration cluster surfaced in the gap audit. With this merged, anyone using Claude Code / Cursor / Windsurf / Codex against an AgentsKit checkout can run one command and have the agent respect named-export-only, the no-bare-throw rule, package boundaries, and the for-agents/* manifest.
