#!/usr/bin/env node
// Aggregate the root CHANGELOG.md plus per-package CHANGELOG.md files into a single docs page.
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../..')
const OUT = resolve(__dirname, '../content/docs/reference/changelog.mdx')

function esc(s) {
  // Escape `{` `}` and bare `<Tag>` so MDX doesn't interpret them.
  const lines = s.split('\n')
  let inFence = false
  return lines
    .map((line) => {
      const t = line.trimStart()
      if (t.startsWith('```') || t.startsWith('~~~')) {
        inFence = !inFence
        return line
      }
      if (inFence) return line
      return line
        .replace(/\{|\}/g, (m) => (m === '{' ? '\\{' : '\\}'))
        .replace(/<(?=[A-Za-z])/g, '&lt;')
    })
    .join('\n')
}

function sectionFor(name, body) {
  return `\n## ${name}\n\n${esc(body).trim()}\n`
}

const rootLog = existsSync(join(ROOT, 'CHANGELOG.md')) ? readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8') : ''

const pkgDir = join(ROOT, 'packages')
const pkgs = existsSync(pkgDir)
  ? readdirSync(pkgDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
  : []

let body = ''
if (rootLog.trim()) body += sectionFor('Project', rootLog.replace(/^#\s+Changelog\s*/i, '').trim())

for (const name of pkgs) {
  const p = join(pkgDir, name, 'CHANGELOG.md')
  if (!existsSync(p)) continue
  const content = readFileSync(p, 'utf8').replace(/^#\s+.+\s*/m, '').trim()
  if (!content) continue
  body += sectionFor(`@agentskit/${name}`, content)
}

const frontmatter = `---
title: Changelog
description: Release notes across every @agentskit package, generated from CHANGELOG.md files.
---

Every AgentsKit package follows semver and publishes release notes via [changesets](https://github.com/changesets/changesets). Below is the aggregated history.

`

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, frontmatter + body)
console.log(`changelog: wrote ${OUT}`)
