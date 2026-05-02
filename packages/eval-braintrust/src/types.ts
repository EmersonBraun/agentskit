export interface ScorerInput<TExpected = unknown, TMeta = Record<string, unknown>> {
  input: string
  output: string
  expected?: TExpected
  metadata?: TMeta
}

export interface ScorerResult {
  name: string
  score: number
  rationale?: string
  metadata?: Record<string, unknown>
}

export type Scorer<TExpected = unknown, TMeta = Record<string, unknown>> = (
  args: ScorerInput<TExpected, TMeta>,
) => ScorerResult | Promise<ScorerResult>

export interface ScorerFamily {
  family: 'quality' | 'robustness'
  scorers: Scorer[]
}
