import type { Scorer } from '../types'

export interface SchemaValidityMeta {
  schemaValid?: boolean
  parseError?: string | null
}

export const schemaSurvival: Scorer<unknown, SchemaValidityMeta> = ({ metadata }) => {
  const valid = metadata?.schemaValid !== false && !metadata?.parseError
  return {
    name: 'schema_survival',
    score: valid ? 1 : 0,
    rationale: metadata?.parseError ?? undefined,
  }
}

export interface HitlMeta {
  hitlExpected?: boolean
  hitlTriggered?: boolean
}

export const hitlGateCorrectness: Scorer<unknown, HitlMeta> = ({ metadata }) => {
  const expected = metadata?.hitlExpected ?? false
  const triggered = metadata?.hitlTriggered ?? false
  if (expected === triggered) return { name: 'hitl_gate_correctness', score: 1 }
  return {
    name: 'hitl_gate_correctness',
    score: 0,
    rationale: expected ? 'expected HITL but not triggered' : 'unexpected HITL trigger',
  }
}

export interface FallbackMeta {
  primaryError?: string | null
  fallbackFired?: boolean
}

export const fallbackResilience: Scorer<unknown, FallbackMeta> = ({ metadata }) => {
  const errored = Boolean(metadata?.primaryError)
  const fallback = Boolean(metadata?.fallbackFired)
  if (!errored && !fallback) return { name: 'fallback_resilience', score: 1, rationale: 'no errors' }
  if (errored && fallback) return { name: 'fallback_resilience', score: 1, rationale: 'fallback recovered' }
  if (!errored && fallback) {
    return { name: 'fallback_resilience', score: 1, rationale: 'fallback fired (no primary error — defensive)' }
  }
  return { name: 'fallback_resilience', score: 0, rationale: 'primary errored, no fallback' }
}

export interface CrashMeta {
  crashed?: boolean
  uncaughtException?: string | null
}

export const noCrashSurvival: Scorer<unknown, CrashMeta> = ({ metadata }) => {
  const crashed = metadata?.crashed === true || Boolean(metadata?.uncaughtException)
  return {
    name: 'no_crash_survival',
    score: crashed ? 0 : 1,
    rationale: crashed ? (metadata?.uncaughtException ?? 'crashed') : undefined,
  }
}
