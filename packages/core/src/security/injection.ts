export interface InjectionHeuristic {
  name: string
  pattern: RegExp
  /** Weight contribution when pattern matches. Range ~0..1. */
  weight: number
}

export interface InjectionVerdict {
  score: number
  blocked: boolean
  hits: Array<{ name: string; weight: number }>
  source: 'heuristic' | 'classifier' | 'hybrid'
}

export interface InjectionDetectorOptions {
  /** Threshold above which `blocked = true`. Default 0.7. */
  threshold?: number
  /** Extra or replacement heuristics. */
  heuristics?: InjectionHeuristic[]
  /**
   * External classifier — Llama Guard, Prompt Guard, Rebuff, any HTTP
   * moderation endpoint. When provided, its score is blended with
   * the heuristic score (max of the two).
   */
  classifier?: (input: string) => Promise<number> | number
}

export interface InjectionDetector {
  check: (input: string) => Promise<InjectionVerdict>
}

/**
 * Default heuristics aimed at the classic prompt-injection families:
 * instruction override, system-prompt leakage, tool-call smuggling,
 * role confusion, and policy-bypass attempts. Curated — not
 * exhaustive; pair with a model classifier for production.
 */
export const DEFAULT_INJECTION_HEURISTICS: InjectionHeuristic[] = [
  { name: 'ignore-previous', pattern: /ignore (?:all |the )?(?:previous|prior|earlier|above) (?:instructions?|prompts?|rules?)/i, weight: 0.9 },
  { name: 'disregard-instructions', pattern: /disregard (?:all |the )?(?:previous|prior|earlier) (?:instructions?|prompts?|rules?)/i, weight: 0.9 },
  { name: 'role-reset', pattern: /you are now (?:a|an) (?!helpful|assistant)/i, weight: 0.6 },
  { name: 'system-leak', pattern: /(?:what is|show me|print|reveal) (?:your|the) (?:system prompt|instructions|rules)/i, weight: 0.8 },
  { name: 'developer-mode', pattern: /\b(?:developer|dan|jailbreak|god) mode\b/i, weight: 0.8 },
  { name: 'policy-bypass', pattern: /(?:ignore|bypass|disable) (?:all |the )?(?:safety|content|moderation) (?:filters?|rules?|policies)/i, weight: 0.9 },
  { name: 'tool-smuggle', pattern: /```(?:json|tool_call)\s*\{[^}]*"function"/i, weight: 0.6 },
  { name: 'role-confusion', pattern: /^\s*(?:system|assistant):\s/im, weight: 0.4 },
]

/**
 * Build a detector that scores input against heuristics and (optionally)
 * a model classifier. The returned `verdict.score` is the max of both
 * sources, so a single strong signal flags the request.
 */
export function createInjectionDetector(
  options: InjectionDetectorOptions = {},
): InjectionDetector {
  const threshold = options.threshold ?? 0.7
  const heuristics = options.heuristics ?? DEFAULT_INJECTION_HEURISTICS

  const heuristicScore = (input: string): { score: number; hits: InjectionVerdict['hits'] } => {
    const hits: InjectionVerdict['hits'] = []
    let score = 0
    for (const rule of heuristics) {
      if (rule.pattern.test(input)) {
        hits.push({ name: rule.name, weight: rule.weight })
        if (rule.weight > score) score = rule.weight
      }
    }
    return { score, hits }
  }

  return {
    async check(input) {
      const { score: h, hits } = heuristicScore(input)
      if (!options.classifier) {
        return {
          score: h,
          hits,
          blocked: h >= threshold,
          source: 'heuristic',
        }
      }
      let classifier = 0
      try {
        classifier = (await options.classifier(input)) ?? 0
      } catch {
        classifier = 0
      }
      const score = Math.max(h, classifier)
      return {
        score,
        hits,
        blocked: score >= threshold,
        source: 'hybrid',
      }
    },
  }
}
