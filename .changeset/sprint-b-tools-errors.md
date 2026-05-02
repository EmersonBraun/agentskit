---
'@agentskit/core': patch
'@agentskit/tools': patch
---

chore(audit): Sprint B/D — typed error hierarchy across tools.

Replaces ~50 bare `throw new Error(...)` sites in `@agentskit/tools`
with the typed `ToolError` / `ConfigError` subclasses from
`@agentskit/core/errors`. Every error now carries a stable `code`, a
machine-friendly `name`, and an actionable `hint`.

**Tools src/** — `web-search`, `slack`, `sqlite-query`, `filesystem`,
`mcp/client`.

**Tools integrations/** — `slack`, `twilio`, `s3`, `stripe`,
`pagerduty`, `elevenlabs`, `postgres`, `http`, `linear`,
`linear-triage`, `reader`, `whisper`, `cloudflare-r2`,
`github-actions`, `document-parsers`, `stripe-webhook`, `deepgram`.

**Core** — adds two new codes: `AK_TOOL_PEER_MISSING`,
`AK_TOOL_INVALID_INPUT`.

Categorisation:

- `AK_TOOL_PEER_MISSING` — peer-dep install hints (sqlite, cloudflareR2).
- `AK_TOOL_INVALID_INPUT` — input validation (filesystem traversal,
  postgres deny verbs, slack empty text, twilio E.164, sqlite read-only,
  stripe-webhook bad signature, s3 missing bucket, github-actions repo).
- `AK_TOOL_EXEC_FAILED` — provider HTTP / GraphQL / runtime failures.
- `AK_CONFIG_INVALID` — slack webhookUrl, sqlite v1 readOnly, pagerduty
  REST without apiToken, document-parsers missing parser fns.

No message-string regressions — every error preserves its original
message so existing `toThrow(/regex/)` matchers stay green (180/180).
