import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { loadConfig } from './config'

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'skip'

export interface CheckResult {
  status: CheckStatus
  name: string
  detail?: string
  fix?: string
}

export interface DoctorReport {
  results: CheckResult[]
  pass: number
  warn: number
  fail: number
  skip: number
}

const PROVIDER_ENV_KEYS: Record<string, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  gemini: 'GEMINI_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  grok: 'XAI_API_KEY',
  kimi: 'KIMI_API_KEY',
}

const PROVIDER_REACH_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/models',
  anthropic: 'https://api.anthropic.com',
  gemini: 'https://generativelanguage.googleapis.com',
  ollama: 'http://localhost:11434/api/tags',
}

// ============================================================================
// Individual checks
// ============================================================================

export async function checkNodeVersion(): Promise<CheckResult> {
  const major = Number(process.versions.node.split('.')[0])
  if (Number.isNaN(major)) {
    return { status: 'fail', name: 'Node version', detail: 'Could not parse process.versions.node' }
  }
  if (major < 22) {
    return {
      status: 'fail',
      name: 'Node version',
      detail: `Node ${process.versions.node} (need 22+)`,
      fix: 'Install Node 22 LTS or newer (https://nodejs.org)',
    }
  }
  if (major === 25) {
    return {
      status: 'warn',
      name: 'Node version',
      detail: `Node ${process.versions.node} — Docusaurus apps may break here`,
      fix: 'Use Node 22 LTS for the legacy docs app, or stay on 25 for everything else',
    }
  }
  return { status: 'pass', name: 'Node version', detail: `Node ${process.versions.node}` }
}

export async function checkPnpm(): Promise<CheckResult> {
  // We can't run binaries directly, but we can detect the lockfile signal
  const cwd = process.cwd()
  const hasPnpm = existsSync(join(cwd, 'pnpm-lock.yaml')) || existsSync(join(cwd, 'pnpm-workspace.yaml'))
  if (hasPnpm) {
    return { status: 'pass', name: 'Package manager', detail: 'pnpm detected (lockfile)' }
  }
  if (existsSync(join(cwd, 'package-lock.json'))) {
    return { status: 'warn', name: 'Package manager', detail: 'npm detected — pnpm recommended for monorepo workflows' }
  }
  if (existsSync(join(cwd, 'yarn.lock'))) {
    return { status: 'pass', name: 'Package manager', detail: 'yarn detected' }
  }
  if (existsSync(join(cwd, 'bun.lock')) || existsSync(join(cwd, 'bun.lockb'))) {
    return { status: 'pass', name: 'Package manager', detail: 'bun detected' }
  }
  return {
    status: 'skip',
    name: 'Package manager',
    detail: 'No lockfile found in cwd',
  }
}

export async function checkPackageJson(): Promise<CheckResult> {
  const path = join(process.cwd(), 'package.json')
  if (!existsSync(path)) {
    return {
      status: 'warn',
      name: 'package.json',
      detail: 'No package.json in cwd',
      fix: 'Run from a project directory (or use `agentskit init` to create one)',
    }
  }
  try {
    const pkg = JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>
    const deps = {
      ...((pkg.dependencies as Record<string, string>) ?? {}),
      ...((pkg.devDependencies as Record<string, string>) ?? {}),
    }
    const akDeps = Object.entries(deps).filter(([name]) => name.startsWith('@agentskit/'))
    if (akDeps.length === 0) {
      return { status: 'skip', name: 'AgentsKit packages', detail: 'No @agentskit/* deps found in package.json' }
    }
    return {
      status: 'pass',
      name: 'AgentsKit packages',
      detail: `${akDeps.length} installed: ${akDeps.map(([n]) => n.replace('@agentskit/', '')).join(', ')}`,
    }
  } catch (err) {
    return {
      status: 'fail',
      name: 'package.json',
      detail: `Could not parse: ${(err as Error).message}`,
    }
  }
}

export async function checkProviderEnv(provider: string): Promise<CheckResult> {
  const envKey = PROVIDER_ENV_KEYS[provider]
  if (!envKey) {
    return { status: 'skip', name: `${provider} API key`, detail: 'No env-key requirement for this provider' }
  }
  const value = process.env[envKey]
  if (!value) {
    return {
      status: 'fail',
      name: `${provider} API key`,
      detail: `${envKey} is not set`,
      fix: `export ${envKey}=...`,
    }
  }
  if (value.length < 16) {
    return {
      status: 'warn',
      name: `${provider} API key`,
      detail: `${envKey} looks too short (${value.length} chars)`,
      fix: 'Verify the key is complete and not truncated',
    }
  }
  return { status: 'pass', name: `${provider} API key`, detail: `${envKey} set (${value.length} chars)` }
}

export async function checkProviderReachable(
  provider: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 4000,
): Promise<CheckResult> {
  const url = PROVIDER_REACH_URLS[provider]
  if (!url) {
    return { status: 'skip', name: `${provider} reachable`, detail: 'No reachability check for this provider' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      signal: controller.signal,
      // No auth — we just want to confirm DNS + network reach.
    })
    // 401/403 means the host is reachable; anything else status-wise also confirms reach.
    return {
      status: 'pass',
      name: `${provider} reachable`,
      detail: `${url} → HTTP ${res.status}`,
    }
  } catch (err) {
    const reason = (err as Error).name === 'AbortError' ? `timeout after ${timeoutMs}ms` : (err as Error).message
    return {
      status: 'fail',
      name: `${provider} reachable`,
      detail: `${url} → ${reason}`,
      fix:
        provider === 'ollama'
          ? 'Start Ollama: `ollama serve` (or install from https://ollama.com)'
          : 'Check network / firewall / VPN settings',
    }
  } finally {
    clearTimeout(timer)
  }
}

export async function checkConfig(): Promise<CheckResult> {
  try {
    const config = await loadConfig()
    if (!config) {
      return { status: 'skip', name: 'AgentsKit config', detail: 'No .agentskit.config or package.json#agentskit found' }
    }
    return {
      status: 'pass',
      name: 'AgentsKit config',
      detail: `loaded — defaults: ${JSON.stringify(config.defaults ?? {})}`,
    }
  } catch (err) {
    return {
      status: 'warn',
      name: 'AgentsKit config',
      detail: `Could not load: ${(err as Error).message}`,
    }
  }
}

// ============================================================================
// Orchestration
// ============================================================================

export interface DoctorOptions {
  /** Provider names to check. Defaults to all known providers. */
  providers?: string[]
  /** Skip the network reachability checks. */
  noNetwork?: boolean
  /** Custom fetch (for tests). */
  fetchImpl?: typeof fetch
}

export async function runDoctor(options: DoctorOptions = {}): Promise<DoctorReport> {
  const providers = options.providers ?? ['openai', 'anthropic', 'gemini', 'ollama']
  const fetchImpl = options.fetchImpl ?? fetch

  const checks: Array<Promise<CheckResult>> = [
    checkNodeVersion(),
    checkPnpm(),
    checkPackageJson(),
    checkConfig(),
  ]

  for (const provider of providers) {
    checks.push(checkProviderEnv(provider))
    if (!options.noNetwork) {
      checks.push(checkProviderReachable(provider, fetchImpl))
    }
  }

  const results = await Promise.all(checks)

  return {
    results,
    pass: results.filter(r => r.status === 'pass').length,
    warn: results.filter(r => r.status === 'warn').length,
    fail: results.filter(r => r.status === 'fail').length,
    skip: results.filter(r => r.status === 'skip').length,
  }
}

// ============================================================================
// Renderer (TTY-friendly)
// ============================================================================

const ICON: Record<CheckStatus, string> = {
  pass: '✓',
  warn: '!',
  fail: '✗',
  skip: '·',
}

export function renderReport(report: DoctorReport, opts: { color?: boolean } = {}): string {
  const color = opts.color ?? true
  const c = (code: string, text: string) => (color ? `\x1b[${code}m${text}\x1b[0m` : text)
  const colorFor: Record<CheckStatus, (t: string) => string> = {
    pass: t => c('32', t),
    warn: t => c('33', t),
    fail: t => c('31', t),
    skip: t => c('90', t),
  }

  const lines: string[] = []
  lines.push('')
  lines.push(c('1', 'agentskit doctor'))
  lines.push('')
  for (const r of report.results) {
    const icon = colorFor[r.status](ICON[r.status])
    const name = r.name.padEnd(28)
    const detail = r.detail ? c('90', r.detail) : ''
    lines.push(`  ${icon}  ${name} ${detail}`)
    if (r.fix && (r.status === 'fail' || r.status === 'warn')) {
      lines.push(`     ${c('90', '↳ ' + r.fix)}`)
    }
  }
  lines.push('')
  const summary = [
    `${report.pass} pass`,
    report.warn > 0 ? colorFor.warn(`${report.warn} warn`) : `${report.warn} warn`,
    report.fail > 0 ? colorFor.fail(`${report.fail} fail`) : `${report.fail} fail`,
    `${report.skip} skip`,
  ].join('  ·  ')
  lines.push(`  ${c('1', 'Summary:')} ${summary}`)
  lines.push('')
  return lines.join('\n')
}
