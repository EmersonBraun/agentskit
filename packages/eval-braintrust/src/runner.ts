import type { Scorer, ScorerInput, ScorerResult } from './types'

export interface BraintrustRunOptions {
  apiKey?: string
  projectName: string
  experimentName?: string
  baseUrl?: string
  metadata?: Record<string, unknown>
}

export interface ScoredCase {
  input: string
  output: string
  expected?: unknown
  metadata?: Record<string, unknown>
  scores: ScorerResult[]
  durationMs?: number
}

export interface ExperimentResult {
  projectName: string
  experimentName: string
  cases: ScoredCase[]
  summary: Record<string, { mean: number; n: number }>
  url?: string
}

interface BraintrustExperiment {
  log(p: Record<string, unknown>): unknown
  summarize?(): Promise<{ experimentUrl?: string }>
}

interface BraintrustModule {
  init(p: Record<string, unknown>): BraintrustExperiment | Promise<BraintrustExperiment>
}

const envOr = (k: string, fallback?: string): string | undefined => {
  if (typeof process === 'undefined' || !process.env) return fallback
  return process.env[k] ?? fallback
}

export async function scoreCase(
  scorers: Scorer[],
  args: ScorerInput,
): Promise<ScorerResult[]> {
  const out: ScorerResult[] = []
  for (const s of scorers) {
    try {
      out.push(await s(args))
    } catch (err) {
      out.push({
        name: 'scorer_error',
        score: 0,
        rationale: err instanceof Error ? err.message : String(err),
      })
    }
  }
  return out
}

export function summarize(cases: ScoredCase[]): Record<string, { mean: number; n: number }> {
  const acc = new Map<string, { sum: number; n: number }>()
  for (const c of cases) {
    for (const s of c.scores) {
      const cur = acc.get(s.name) ?? { sum: 0, n: 0 }
      cur.sum += s.score
      cur.n += 1
      acc.set(s.name, cur)
    }
  }
  const out: Record<string, { mean: number; n: number }> = {}
  for (const [name, { sum, n }] of acc) {
    out[name] = { mean: n > 0 ? sum / n : 0, n }
  }
  return out
}

export interface RunBraintrustEvalArgs<TCase extends ScorerInput = ScorerInput> {
  cases: TCase[]
  agent: (input: string) => Promise<{ output: string; metadata?: Record<string, unknown> }>
  scorers: Scorer[]
  options: BraintrustRunOptions
}

export interface RunBraintrustEvalInternals {
  bt?: BraintrustModule
}

export async function runBraintrustEval<TCase extends ScorerInput = ScorerInput>(
  args: RunBraintrustEvalArgs<TCase>,
  internals: RunBraintrustEvalInternals = {},
): Promise<ExperimentResult> {
  const { cases, agent, scorers, options } = args
  const apiKey = options.apiKey ?? envOr('BRAINTRUST_API_KEY')
  const baseUrl = options.baseUrl ?? envOr('BRAINTRUST_BASE_URL')

  let experiment: BraintrustExperiment | null = null
  try {
    const mod = internals.bt ?? ((await import('braintrust')) as unknown as BraintrustModule)
    if (apiKey) {
      const init = await mod.init({
        project: options.projectName,
        experiment: options.experimentName,
        apiKey,
        appUrl: baseUrl,
        metadata: options.metadata,
      })
      experiment = init
    }
  } catch {
    experiment = null
  }

  const out: ScoredCase[] = []
  for (const c of cases) {
    const t0 = Date.now()
    let output = ''
    let runMeta: Record<string, unknown> | undefined
    try {
      const r = await agent(c.input)
      output = r.output
      runMeta = r.metadata
    } catch (err) {
      runMeta = {
        primaryError: err instanceof Error ? err.message : String(err),
        crashed: true,
        uncaughtException: err instanceof Error ? err.name : String(err),
      }
    }
    const scores = await scoreCase(scorers, {
      input: c.input,
      output,
      expected: c.expected,
      metadata: { ...(c.metadata ?? {}), ...(runMeta ?? {}) },
    })
    const durationMs = Date.now() - t0
    const scored: ScoredCase = {
      input: c.input,
      output,
      expected: c.expected,
      metadata: { ...(c.metadata ?? {}), ...(runMeta ?? {}) },
      scores,
      durationMs,
    }
    out.push(scored)

    if (experiment) {
      try {
        experiment.log({
          input: c.input,
          output,
          expected: c.expected,
          scores: Object.fromEntries(scores.map(s => [s.name, s.score])),
          metadata: { ...(c.metadata ?? {}), ...(runMeta ?? {}), durationMs },
        })
      } catch {
      }
    }
  }

  let url: string | undefined
  if (experiment?.summarize) {
    try {
      const s = await experiment.summarize()
      url = s.experimentUrl
    } catch {
    }
  }

  return {
    projectName: options.projectName,
    experimentName: options.experimentName ?? 'agentskit-eval',
    cases: out,
    summary: summarize(out),
    url,
  }
}
