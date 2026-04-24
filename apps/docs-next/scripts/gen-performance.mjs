#!/usr/bin/env node
// Generate /docs/production/performance.mdx from .size-limit.json budgets.
// If apps/docs-next/.sizes.json exists (produced by measure-sizes.mjs), also emit measured sizes + pass/fail.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../..')
const OUT = resolve(__dirname, '../content/docs/production/performance.mdx')
const SIZES_PATH = resolve(__dirname, '..', '.sizes.json')

const configPath = join(ROOT, '.size-limit.json')
if (!existsSync(configPath)) {
  console.warn('no .size-limit.json found, skipping')
  process.exit(0)
}

const entries = JSON.parse(readFileSync(configPath, 'utf8'))

let measured = null
if (existsSync(SIZES_PATH)) {
  try {
    const data = JSON.parse(readFileSync(SIZES_PATH, 'utf8'))
    measured = new Map()
    for (const e of data.entries ?? []) {
      measured.set(e.name, { size: e.size, passed: e.passed !== false })
    }
    console.log(`performance: using ${measured.size} measured entries (${data.generatedAt})`)
  } catch (err) {
    console.warn(`performance: failed to parse ${SIZES_PATH}:`, err.message)
  }
}

function fmtBytes(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—'
  if (n < 1024) return `${n} B`
  return `${(n / 1024).toFixed(2)} KB`
}

const rows = entries
  .map((e) => {
    const name = e.name ?? e.path
    const limit = e.limit ?? '—'
    const format = name.includes('(CJS)') ? 'CJS' : name.includes('(ESM)') ? 'ESM' : '—'
    const pkg = name.replace(/\s*\((ESM|CJS)\)$/, '').trim()
    const m = measured?.get(name)
    return { pkg, format, limit, name, size: m?.size, passed: m?.passed }
  })
  .sort((a, b) => a.pkg.localeCompare(b.pkg) || a.format.localeCompare(b.format))

const header = measured
  ? '| Package | Format | Limit (gzip) | Measured (gzip) | Status |\n|---|---|---|---|---|'
  : '| Package | Format | Limit (gzip) |\n|---|---|---|'

const body = rows
  .map((r) => {
    if (!measured) return `| \`${r.pkg}\` | ${r.format} | **${r.limit}** |`
    const status = r.passed === undefined ? '—' : r.passed ? '✅ pass' : '❌ regressed'
    return `| \`${r.pkg}\` | ${r.format} | ${r.limit} | **${fmtBytes(r.size)}** | ${status} |`
  })
  .join('\n')

const measuredBlock = measured
  ? `\n> Measurements are pinned at build time from \`pnpm measure:sizes\` → \`apps/docs-next/.sizes.json\`. Regenerate locally with \`pnpm measure:sizes && pnpm gen:performance\`.\n`
  : `\n> Budgets only. Run \`pnpm measure:sizes && pnpm gen:performance\` to include real measurements. CI does this on every merge to main.\n`

const frontmatter = `---
title: Performance budgets
description: Bundle size ceilings per package, enforced in CI via size-limit. Measured values injected when available.
---

Every \`@agentskit/\` package has a **gzipped size budget** enforced on every PR via [size-limit](https://github.com/ai/size-limit). Exceed the limit and CI fails — no surprise bundle bloat.

${header}
${body}
${measuredBlock}
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
