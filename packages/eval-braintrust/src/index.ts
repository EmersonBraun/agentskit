export type { Scorer, ScorerInput, ScorerResult, ScorerFamily } from './types'

export {
  scoreCase,
  summarize,
  runBraintrustEval,
} from './runner'
export type {
  BraintrustRunOptions,
  ScoredCase,
  ExperimentResult,
  RunBraintrustEvalArgs,
} from './runner'

export {
  qualityFamily,
  robustnessFamily,
  ALL_SCORERS,
  taskSuccess,
  factualGrounding,
  citationCorrectness,
  toolArgValidity,
  schemaSurvival,
  hitlGateCorrectness,
  fallbackResilience,
  noCrashSurvival,
} from './scorers'

export { detectRegressions, formatAlertsMarkdown } from './ci'
export type { RegressionThresholds, RegressionAlert } from './ci'
