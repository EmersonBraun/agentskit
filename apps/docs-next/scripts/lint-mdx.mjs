#!/usr/bin/env node
// Validate MDX files under content/docs.
// Checks: frontmatter has title+description, Playground/RunCode preset refs are valid,
// warns on capitalized JSX tags not registered in mdx-components.tsx.
// Exits 1 on any hard violation.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DOCS = resolve(ROOT, 'content/docs')
const REPO_ROOT = resolve(ROOT, '../..')

const SKIP_DIRS = new Set(['api'])
const SKIP_FILES = new Set([
  join(DOCS, 'reference/changelog.mdx'),
  join(DOCS, 'production/performance.mdx'),
])

const presetsSrc = readFileSync(join(ROOT, 'components/mdx/playground-presets.ts'), 'utf8')
const VALID_PRESETS = new Set(
  [...presetsSrc.matchAll(/['"]([a-z][a-z0-9-]+)['"]\s*:\s*\{\s*\n?\s*name:/g)].map((m) => m[1]),
)

const mdxSrc = readFileSync(resolve(ROOT, 'mdx-components.tsx'), 'utf8')
const KNOWN_COMPONENTS = new Set(
  [...mdxSrc.matchAll(/^\s*([A-Z][A-Za-z0-9]+)\s*,\s*$/gm)].map((m) => m[1]),
)
for (const c of [
  'Tabs', 'Tab', 'TabsList', 'TabsTrigger', 'TabsContent',
  'Callout', 'Cards', 'Card', 'Steps', 'Step',
  'Accordion', 'Accordions', 'Files', 'File', 'Folder',
  'TypeTable', 'InlineTOC', 'ImageZoom', 'Banner',
]) KNOWN_COMPONENTS.add(c)

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      out.push(...walk(join(dir, entry.name)))
    } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
      out.push(join(dir, entry.name))
    }
  }
  return out
}

const errors = []
const warnings = []

function report(file, msg) {
  errors.push(`${relative(ROOT, file)}: ${msg}`)
}
function warn(file, msg) {
  warnings.push(`${relative(ROOT, file)}: ${msg}`)
}

function stripFences(src) {
  let out = ''
  let inFence = false
  let marker = ''
  for (const line of src.split('\n')) {
    const t = line.trimStart()
    const m = t.match(/^(`{3,}|~{3,})/)
    if (m) {
      if (!inFence) {
        inFence = true
        marker = m[1]
      } else if (t.startsWith(marker)) {
        inFence = false
      }
      out += '\n'
      continue
    }
    out += (inFence ? '' : line) + '\n'
  }
  return out
}

const files = walk(DOCS)
for (const file of files) {
  if (SKIP_FILES.has(file)) continue
  const raw = readFileSync(file, 'utf8')
  const fm = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!fm) {
    report(file, 'missing frontmatter')
    continue
  }
  const block = fm[1]
  const title = block.match(/^title:\s*(.+)$/m)?.[1]?.trim()
  const description = block.match(/^description:\s*(.+)$/m)?.[1]?.trim()
  if (!title) report(file, 'frontmatter missing `title`')
  if (!description) report(file, 'frontmatter missing `description`')

  const body = stripFences(raw.slice(fm[0].length))

  for (const comp of ['Playground', 'RunCode']) {
    const re = new RegExp(`<${comp}[^/>]*\\spreset=["']([^"']+)["']`, 'g')
    let m
    while ((m = re.exec(body))) {
      if (!VALID_PRESETS.has(m[1])) {
        report(file, `<${comp} preset="${m[1]}"> — unknown preset`)
      }
    }
  }

  // <Verified test="..."> — test file must exist in the repo
  const verifiedRe = /<Verified[^/>]*\stest=["']([^"']+)["']/g
  let vm
  while ((vm = verifiedRe.exec(body))) {
    const testPath = resolve(REPO_ROOT, vm[1])
    if (!existsSync(testPath)) {
      report(file, `<Verified test="${vm[1]}"> — test file not found`)
    }
  }

  const tagRe = /<([A-Z][A-Za-z0-9]+)(?=[\s/>])/g
  let m
  while ((m = tagRe.exec(body))) {
    if (!KNOWN_COMPONENTS.has(m[1])) warn(file, `unknown component <${m[1]}>`)
  }
}

for (const w of warnings) console.warn(`⚠ ${w}`)

if (errors.length) {
  console.error('\n✗ MDX lint failed:\n')
  for (const e of errors) console.error(`  ${e}`)
  console.error(`\n${errors.length} error${errors.length === 1 ? '' : 's'}.`)
  process.exit(1)
}
console.log(`✓ MDX lint passed (${files.length} files checked, ${warnings.length} warnings).`)
