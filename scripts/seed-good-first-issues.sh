#!/usr/bin/env bash
# Seeds the repo with 10 good-first-issues for the v1 launch.
#
# Usage:
#   ./scripts/seed-good-first-issues.sh
#   DRY_RUN=1 ./scripts/seed-good-first-issues.sh

set -euo pipefail

REPO="EmersonBraun/agentskit"
DRY_RUN="${DRY_RUN:-0}"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

issue() {
  local n="$1" title="$2" labels="$3"
  local body_file="$TMPDIR/issue-$n.md"
  cat > "$body_file"
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] #$n — $title  (labels: $labels)"
    return
  fi
  echo "→ Creating #$n: $title"
  gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --label "$labels" \
    --body-file "$body_file"
}

issue 1 "adapter: add cohereAdapter" "good first issue,help wanted,type-adapter" <<'EOF'
Add a `cohereAdapter` to `@agentskit/adapters` for Cohere's Chat API.

## Why
Cohere is a major provider with strong tool-use support. Users currently have to write their own adapter.

## Acceptance criteria
- [ ] New file: `packages/adapters/src/cohere.ts` exporting `cohereAdapter`
- [ ] Implements the `AdapterFactory` contract from `@agentskit/core`
- [ ] Streams tokens (SSE)
- [ ] Supports tool calls
- [ ] Reports `usage` on `llm:end`
- [ ] Declares `capabilities: { streaming: true, tools: true, usage: true }`
- [ ] Inherits auto-retry (wrap with `withAutoRetry`)
- [ ] Tests in `packages/adapters/tests/cohere.test.ts` mirroring `anthropic.test.ts`
- [ ] README entry under "Supported providers"
- [ ] Changeset

## Files to study first
- `packages/adapters/src/anthropic.ts` — closest reference shape
- `packages/adapters/CONVENTIONS.md` — rules
- `docs/architecture/adrs/0001-adapter-contract.md` — the contract

## Not in scope
- Embeddings (separate package)
- Cohere Rerank (goes in `@agentskit/rag` later)
EOF

issue 2 "adapter: add groqAdapter — OpenAI-compatible" "good first issue,help wanted,type-adapter" <<'EOF'
Add a thin `groqAdapter` to `@agentskit/adapters`. Groq exposes an OpenAI-compatible endpoint, so this is mostly `openaiAdapter` with a different `baseUrl`.

## Why
Groq gives 10x faster inference for Llama/Mixtral. Low-effort, high-impact win.

## Acceptance criteria
- [ ] New file: `packages/adapters/src/groq.ts` exporting `groqAdapter(options)`
- [ ] Reuses `openaiAdapter` internally with `baseUrl: 'https://api.groq.com/openai/v1'`
- [ ] Default model: `llama-3.3-70b-versatile`
- [ ] Capabilities hint with `streaming: true, tools: true`
- [ ] Tests mirroring `openai.test.ts`
- [ ] README entry
- [ ] Changeset

## Files to study first
- `packages/adapters/src/openai.ts`
- `packages/adapters/CONVENTIONS.md`
EOF

issue 3 "adapter: add bedrockAdapter — AWS" "good first issue,help wanted,type-adapter" <<'EOF'
Add a `bedrockAdapter` to `@agentskit/adapters` for AWS Bedrock.

## Why
Bedrock is the enterprise path for Claude + Titan. Needed to unlock AWS-only shops.

## Acceptance criteria
- [ ] Uses `@aws-sdk/client-bedrock-runtime` as an **optional peer dependency** (not a hard dep)
- [ ] Supports Anthropic models via the `anthropic.claude-3-*` route first (Titan is stretch)
- [ ] Streams via `InvokeModelWithResponseStreamCommand`
- [ ] Tool calls mapped to Anthropic-on-Bedrock format
- [ ] Auth via the AWS SDK's default credential chain — no credential handling in adapter
- [ ] Tests with mocked SDK
- [ ] README: include a "Caveats: optional peer dep" block
- [ ] Changeset

## Files to study first
- `packages/adapters/src/anthropic.ts`
- `packages/adapters/CONVENTIONS.md`

## Not in scope
- Guardrails — Phase 2
- Knowledge Bases — goes in `@agentskit/rag`
EOF

issue 4 "tool: add slackTool" "good first issue,help wanted,type-tool" <<'EOF'
Add a `slackTool` to `@agentskit/tools` that posts to a Slack Incoming Webhook.

## Why
One of the most commonly-requested output channels for agents — notifications, daily digests, alerts.

## Acceptance criteria
- [ ] New file: `packages/tools/src/slack.ts` exporting `slackTool(options)`
- [ ] Options: `{ webhookUrl: string }`
- [ ] Zod schema: `{ text: string, channel?: string, username?: string }`
- [ ] `execute` POSTs to the webhook
- [ ] Returns `{ ok: boolean, status: number }`
- [ ] Tests with `vi.fn()` mocking `fetch`
- [ ] README entry
- [ ] Changeset

## Files to study first
- `packages/tools/src/resend.ts` — closest reference, outbound-only tool
- `packages/tools/CONVENTIONS.md`
- `docs/architecture/adrs/0002-tool-contract.md`
EOF

issue 5 "tool: add sqliteQueryTool" "good first issue,help wanted,type-tool" <<'EOF'
Add a `sqliteQueryTool` to `@agentskit/tools` that runs read-only SQL against a local SQLite file.

## Why
Powers the "agent that queries your local data" pattern. Common ask.

## Acceptance criteria
- [ ] New file: `packages/tools/src/sqlite-query.ts`
- [ ] Uses `better-sqlite3` as an optional peer dep — already in `pnpm.onlyBuiltDependencies`
- [ ] Options: `{ path: string, readOnly: true }` — `readOnly` default true, do NOT support writes in v1 of this tool
- [ ] Zod schema: `{ sql: string }`
- [ ] `execute` runs the query and returns rows, first 100, with a `truncated` flag
- [ ] Tests using an in-memory DB
- [ ] README entry with a safety note about SQL-injection-via-prompt
- [ ] Changeset

## Files to study first
- `packages/tools/src/fs.ts`
- `packages/tools/CONVENTIONS.md`

## Not in scope
- Write mode — explicit follow-up issue
- Arbitrary driver support — PostgreSQL/MySQL get separate issues
EOF

issue 6 "recipe: chat with a PDF" "good first issue,help wanted,type-docs" <<'EOF'
Add a recipe at `apps/docs-next/content/docs/recipes/chat-with-pdf.mdx` showing the full flow for RAG over a PDF.

## Why
Most requested recipe. Showcases `@agentskit/rag` + `@agentskit/memory` + `@agentskit/react`.

## Acceptance criteria
- [ ] New MDX file under `content/docs/recipes/`
- [ ] Shows: upload a PDF → chunk → embed → retrieve → chat
- [ ] All code copy-pasteable and working, no pseudocode
- [ ] Ingest + query paths both shown
- [ ] Uses `@agentskit/rag` + `@agentskit/memory` vector + `@agentskit/react`
- [ ] Linked from `content/docs/recipes/meta.json`
- [ ] Linked from `content/docs/recipes/index.mdx` recipe grid
- [ ] Cross-link: adds "See also" at the bottom pointing to other RAG docs

## Files to study first
- `apps/docs-next/content/docs/recipes/` — existing recipes
- `packages/rag/README.md`
- `packages/rag/src/`
EOF

issue 7 "recipe: cost-aware agent with costGuard" "good first issue,help wanted,type-docs" <<'EOF'
Add a recipe at `apps/docs-next/content/docs/recipes/cost-aware-agent.mdx` demonstrating `costGuard` from `@agentskit/observability`.

## Why
Budget control is a top-3 enterprise question. `costGuard` shipped in Phase 1 and needs a canonical example.

## Acceptance criteria
- [ ] New MDX file under `content/docs/recipes/`
- [ ] Walks through: define a USD budget → wire `costGuard` observer → intentionally blow the budget → show the abort
- [ ] Shows custom pricing override for a self-hosted model
- [ ] Shows how to surface the "budget exceeded" error to the UI
- [ ] Uses `@agentskit/runtime` + `@agentskit/observability` + `@agentskit/adapters`
- [ ] Linked from `content/docs/recipes/meta.json` and the recipe grid

## Files to study first
- `packages/observability/src/cost-guard.ts`
- `packages/observability/README.md`
- Other recipes under `content/docs/recipes/`
EOF

issue 8 "template: Next.js App Router starter" "good first issue,help wanted" <<'EOF'
Add a production-ready Next.js App Router template to `packages/templates/`.

## Why
Next.js is the default React meta-framework. Current templates are Vite + Ink — missing a Next.js story is a gap in the DX narrative.

## Acceptance criteria
- [ ] New dir: `packages/templates/nextjs-app-router/`
- [ ] Uses `@agentskit/react` + `@agentskit/adapters`
- [ ] Streams via a Next.js Route Handler at `app/api/chat/route.ts`
- [ ] UI in `app/page.tsx` using `useChat`
- [ ] Zero-config demo provider — works out of the box
- [ ] `.env.example` for real providers
- [ ] README with: what it does, how to run, how to swap the adapter
- [ ] Wired into `agentskit init` as a selectable template with id `nextjs`
- [ ] Tests: `agentskit init --template nextjs` produces a project that `pnpm install && pnpm build` succeeds in

## Files to study first
- `packages/templates/react/` — Vite template
- `packages/cli/src/commands/init.ts` — template selection
EOF

issue 9 "skill: add prReviewerSkill" "good first issue,help wanted" <<'EOF'
Add a `prReviewerSkill` to `@agentskit/skills` that reviews a diff against the project's Manifesto + CONVENTIONS.

## Why
Demonstrates skills as pure prompt assets — no code, just the packaged persona. Also useful inside the AgentsKit repo itself.

## Acceptance criteria
- [ ] New file: `packages/skills/src/pr-reviewer.ts`
- [ ] Exports `prReviewerSkill` matching the `Skill` contract from `@agentskit/core`
- [ ] `systemPrompt`: reviews a diff, flags Manifesto violations — new deps in core, `any` usage, default exports, hardcoded styles — suggests concrete rewrites
- [ ] 2–3 few-shot examples covering common failure modes
- [ ] Tests verify the skill exports the right shape
- [ ] README entry under the skills catalogue
- [ ] Changeset

## Files to study first
- `packages/skills/src/` — existing skills: researcher, critic, writer
- `docs/architecture/adrs/0005-skill-contract.md`
- `MANIFESTO.md` — the rules this skill enforces
EOF

issue 10 "docs: choosing an adapter — capability decision table" "good first issue,help wanted,type-docs" <<'EOF'
Add a decision guide at `apps/docs-next/content/docs/adapters/choosing.mdx` comparing adapters by capability and use case.

## Why
First question every new user asks: "which adapter should I use?" There is no canonical answer today.

## Acceptance criteria
- [ ] New MDX page with a capability matrix — rows: adapters, columns: streaming, tools, multi-modal, reasoning, usage, self-hosted, cost tier
- [ ] Short "when to pick X" paragraph per adapter — 2–3 sentences, not marketing fluff
- [ ] Covers: OpenAI, Anthropic, Gemini, Grok, Ollama, DeepSeek, Kimi, LangChain, Vercel AI SDK — plus any new adapters merged by the time this ships
- [ ] Linked from `content/docs/adapters/meta.json`
- [ ] Cross-link from quickstart: "Not sure which? → Choosing an adapter"

## Files to study first
- `packages/adapters/README.md`
- `apps/docs-next/content/docs/adapters/`
- Each adapter's source for its capability hint
EOF

echo ""
echo "✓ Done. 10 good-first-issues created at https://github.com/$REPO/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22"
