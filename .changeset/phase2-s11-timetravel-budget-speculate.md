---
'@agentskit/eval': minor
'@agentskit/core': minor
'@agentskit/runtime': minor
---

Phase 2 sprint S11 — issues #137, #138, #139.

- `@agentskit/eval/replay`: `createTimeTravelSession` wraps a cassette
  in a cursor API (`step` / `peek` / `seek` / `override` / `fork`)
  so a recorded session can be rewound, a tool result rewritten, and
  a forked cassette handed back to `createReplayAdapter` to resume
  execution from that point.
- `@agentskit/core`: `compileBudget` + `approximateCounter`. Declare
  a token budget and get back trimmed messages guaranteed to fit, via
  three strategies: `drop-oldest`, `sliding-window`, `summarize`
  (fold dropped messages into a summary via user-provided
  `summarizer`). Accounts for system prompt + tool schema tokens and
  `reserveForOutput`.
- `@agentskit/runtime`: `speculate` fans a request out to N
  `AdapterFactory` candidates. Picker strategies: `'first'` (race,
  abort losers), `'longest'`, or custom `(results) => id`. Per-
  candidate `timeoutMs` and `abortOnLoser` opt-out.
