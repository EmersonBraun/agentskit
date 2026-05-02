export {
  taskSuccess,
  factualGrounding,
  citationCorrectness,
  toolArgValidity,
} from './quality'
export type {
  FactualGroundingMeta,
  CitationMeta,
  ToolArgValidityInput,
} from './quality'

export {
  schemaSurvival,
  hitlGateCorrectness,
  fallbackResilience,
  noCrashSurvival,
} from './robustness'
export type {
  SchemaValidityMeta,
  HitlMeta,
  FallbackMeta,
  CrashMeta,
} from './robustness'

import { taskSuccess, factualGrounding, citationCorrectness, toolArgValidity } from './quality'
import {
  schemaSurvival,
  hitlGateCorrectness,
  fallbackResilience,
  noCrashSurvival,
} from './robustness'
import type { ScorerFamily } from '../types'

export const qualityFamily: ScorerFamily = {
  family: 'quality',
  scorers: [
    taskSuccess as ScorerFamily['scorers'][number],
    factualGrounding as ScorerFamily['scorers'][number],
    citationCorrectness as ScorerFamily['scorers'][number],
    toolArgValidity as ScorerFamily['scorers'][number],
  ],
}

export const robustnessFamily: ScorerFamily = {
  family: 'robustness',
  scorers: [
    schemaSurvival as ScorerFamily['scorers'][number],
    hitlGateCorrectness as ScorerFamily['scorers'][number],
    fallbackResilience as ScorerFamily['scorers'][number],
    noCrashSurvival as ScorerFamily['scorers'][number],
  ],
}

export const ALL_SCORERS: ScorerFamily['scorers'] = [
  ...qualityFamily.scorers,
  ...robustnessFamily.scorers,
]
