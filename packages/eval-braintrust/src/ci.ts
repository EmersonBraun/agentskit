import type { ExperimentResult } from './runner'

export interface RegressionThresholds {
  default?: number
  perScorer?: Record<string, number>
}

export interface RegressionAlert {
  scorer: string
  baseline: number
  current: number
  delta: number
  threshold: number
}

export function detectRegressions(
  baseline: ExperimentResult['summary'],
  current: ExperimentResult['summary'],
  thresholds: RegressionThresholds = {},
): RegressionAlert[] {
  const def = thresholds.default ?? 0.05
  const out: RegressionAlert[] = []
  for (const [scorer, { mean }] of Object.entries(current)) {
    const base = baseline[scorer]?.mean
    if (base === undefined) continue
    const t = thresholds.perScorer?.[scorer] ?? def
    const delta = base - mean
    if (delta > t) {
      out.push({ scorer, baseline: base, current: mean, delta, threshold: t })
    }
  }
  return out
}

export function formatAlertsMarkdown(alerts: RegressionAlert[]): string {
  if (alerts.length === 0) return '✅ No regressions detected.'
  const rows = alerts
    .map(
      a =>
        `| \`${a.scorer}\` | ${a.baseline.toFixed(3)} | ${a.current.toFixed(3)} | -${a.delta.toFixed(3)} | ${a.threshold.toFixed(3)} |`,
    )
    .join('\n')
  return [
    '### ⚠️ Eval regressions detected',
    '',
    '| Scorer | Baseline | Current | Delta | Threshold |',
    '|---|---|---|---|---|',
    rows,
  ].join('\n')
}
