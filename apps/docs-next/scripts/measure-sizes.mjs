#!/usr/bin/env node
// Run size-limit at the repo root and capture measured gzipped sizes per entry.
// Output: apps/docs-next/.sizes.json consumed by gen-performance.mjs.
// Requires dist builds to exist; run `pnpm build` first.
import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../..')
const OUT = resolve(__dirname, '..', '.sizes.json')

const result = spawnSync('pnpm', ['size-limit', '--json'], {
  cwd: ROOT,
  encoding: 'utf8',
  shell: false,
})

if (result.status !== 0) {
  console.error('size-limit failed')
  console.error(result.stderr || result.stdout)
  process.exit(result.status ?? 1)
}

const stdout = result.stdout || ''
const jsonStart = stdout.indexOf('[')
if (jsonStart === -1) {
  console.error('could not locate JSON payload in size-limit output')
  console.error(stdout)
  process.exit(1)
}

const parsed = JSON.parse(stdout.slice(jsonStart))
const entries = parsed.map((p) => ({
  name: p.name,
  size: p.size,
  passed: p.passed,
}))

writeFileSync(
  OUT,
  JSON.stringify({ generatedAt: new Date().toISOString(), entries }, null, 2) + '\n',
)
console.log(`measure-sizes: wrote ${entries.length} entries to ${OUT}`)
