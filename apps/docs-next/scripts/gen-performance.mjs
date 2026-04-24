#!/usr/bin/env node
// Generate /docs/production/performance.mdx from .size-limit.json budgets.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../..')
const OUT = resolve(__dirname, '../content/docs/production/performance.mdx')

const configPath = join(ROOT, '.size-limit.json')
if (!existsSync(configPath)) {
  console.warn('no .size-limit.json found, skipping')
  process.exit(0)
}

const entries = JSON.parse(readFileSync(configPath, 'utf8'))

const rows = entries.map((e) => {
  const name = e.name ?? e.path
  const limit = e.limit ?? '—'
  const format = name.includes('(CJS)') ? 'CJS' : name.includes('(ESM)') ? 'ESM' : '—'
  const pkg = name.replace(/\s*\((ESM|CJS)\)$/, '').trim()
  return { pkg, format, limit, path: e.path, gzip: !!e.gzip }
}).sort((a, b) => a.pkg.localeCompare(b.pkg) || a.format.localeCompare(b.format))

const frontmatter = `---
title: Performance budgets
description: Bundle size ceilings per package, enforced in CI via size-limit. Generated from .size-limit.json.
---

Every \`@agentskit/\` package has a **gzipped size budget** enforced on every PR via [size-limit](https://github.com/ai/size-limit). Exceed the limit and CI fails — no surprise bundle bloat.

| Package | Format | Limit (gzip) |
|---|---|---|
${rows.map((r) => `| \`${r.pkg}\` | ${r.format} | **${r.limit}** |`).join('\n')}

> Run \`pnpm size\` locally to measure actual sizes. Use \`pnpm size:why\` to break down which imports consume bytes.

## Runtime budgets

| Concern | Target |
|---|---|
| First token latency (streaming) | < 400 ms p95 |
| Chunk render rate | 60 fps (batched on \`requestAnimationFrame\`) |
| Memory read (in-memory adapter) | < 1 ms |
| Memory read (SQLite adapter) | < 5 ms |
| Tool call overhead | < 2 ms per call |

## How bundle budgets are chosen

- **core**: must stay < 10 KB gzipped — it ships in every install.
- **react/ink/vue**: aim for < 15 KB — UI layer only, zero adapter bundled.
- **adapters**: sum of individual provider imports; tree-shakable.
- **runtime**: includes ReAct loop + planner primitives — aim for < 20 KB.
- **cli**: no budget — terminal tool, size is not on the critical path.

<Tip>The limits are not aspirational. Every PR runs \`pnpm size\` in CI and will fail if it regresses.</Tip>
`

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, frontmatter)
console.log(`performance: wrote ${OUT}`)
