---
'@agentskit/cli': minor
---

New `agentskit doctor` command — one-shot diagnostics for the most common setup problems.

Checks:

- **Node version** (warns on Node 25 because Docusaurus is broken there)
- **Package manager** (detects pnpm/npm/yarn/bun via lockfiles)
- **AgentsKit packages** (lists installed `@agentskit/*` deps)
- **AgentsKit config** (loads `.agentskit.config.*` or `package.json#agentskit`)
- **Provider env keys** (OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, etc.)
- **Provider reachability** (HTTP GET against each provider's API to confirm DNS / network / firewall — works even without an API key, since 401 means "host is up")

```bash
npx agentskit doctor                              # all checks, all providers
npx agentskit doctor --no-network                 # offline-friendly
npx agentskit doctor --providers openai,anthropic # subset
npx agentskit doctor --json                       # machine-readable
```

Exits non-zero on any `fail` so you can use it in CI scripts.
