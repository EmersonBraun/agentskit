import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const promptsDir = join(here, '..', 'prompts')

export type PromptVariant = 'baseline' | 'optimized'

export const loadPrompt = (variant: PromptVariant): string =>
  readFileSync(join(promptsDir, `${variant}.txt`), 'utf-8')

export interface AgentRun {
  output: string
  metadata: {
    schemaValid: boolean
    parseError: string | null
    hitlTriggered: boolean
    fallbackFired: boolean
    primaryError: string | null
    crashed: boolean
    toolCalls: Array<{ name: string; args: Record<string, unknown>; schemaValid: boolean }>
  }
}

const isIrreversible = (input: string): boolean =>
  /\b(delete|drop|remove|truncate|purge|wipe|send|pay|charge)\b/i.test(input)

const isAbsentFromKnowledge = (input: string): boolean => /agentskit/i.test(input)

const FACTS: Array<{ match: string; answer: string }> = [
  { match: 'apollo', answer: '1969 — Neil Armstrong walked on the Moon' },
  { match: 'pragmatic', answer: 'Andrew Hunt and David Thomas' },
  { match: 'australia', answer: 'Canberra' },
]

const CITATIONS: Array<{ match: string; tag: string }> = [
  { match: 'apollo', tag: ' <source>nasa-1</source> <source>history-12</source>' },
  { match: 'pragmatic', tag: ' <source>amazon-isbn-1</source> <source>oreilly-pp</source>' },
  { match: 'australia', tag: ' <source>wiki-au</source>' },
]

const UNKNOWN_REFUSAL = 'I do not know'
const UNKNOWN_GUESS = 'Based on what I recall, the answer is likely related to your query.'

function lookupFact(lower: string, refusesUnknown: boolean): string {
  const hit = FACTS.find(f => lower.includes(f.match))
  if (hit) return hit.answer
  return refusesUnknown ? UNKNOWN_REFUSAL : UNKNOWN_GUESS
}

function lookupCitations(lower: string): string {
  const hit = CITATIONS.find(c => lower.includes(c.match))
  return hit?.tag ?? ''
}

interface SimulatedConfig {
  emitsCitations: boolean
  honorsHitl: boolean
  validatesToolArgs: boolean
  refusesUnknown: boolean
}

const variantConfig: Record<PromptVariant, SimulatedConfig> = {
  baseline: {
    emitsCitations: false,
    honorsHitl: false,
    validatesToolArgs: false,
    refusesUnknown: false,
  },
  optimized: {
    emitsCitations: true,
    honorsHitl: true,
    validatesToolArgs: true,
    refusesUnknown: true,
  },
}

export function makeAgent(variant: PromptVariant) {
  const cfg = variantConfig[variant]
  return async (input: string): Promise<AgentRun> => {
    const meta: AgentRun['metadata'] = {
      schemaValid: true,
      parseError: null,
      hitlTriggered: false,
      fallbackFired: false,
      primaryError: null,
      crashed: false,
      toolCalls: [],
    }

    if (isIrreversible(input)) {
      if (cfg.honorsHitl) {
        meta.hitlTriggered = true
        return {
          output: 'Confirm: this is irreversible. Proceed? (y/n)',
          metadata: meta,
        }
      }
      return {
        output: 'Done.',
        metadata: meta,
      }
    }

    if (isAbsentFromKnowledge(input) && cfg.refusesUnknown) {
      meta.toolCalls.push({
        name: 'search',
        args: { query: input.slice(0, 64) },
        schemaValid: cfg.validatesToolArgs,
      })
      const cite = cfg.emitsCitations ? ' <source>agentskit-docs-1</source>' : ''
      return {
        output: `AgentsKit emphasizes observability via tracing and langfuse adapters.${cite}`,
        metadata: meta,
      }
    }

    meta.toolCalls.push({
      name: 'search',
      args: cfg.validatesToolArgs
        ? { query: input.slice(0, 64) }
        : { q: input, depth: 'deep', misc: 'extra-field' },
      schemaValid: cfg.validatesToolArgs,
    })

    const lower = input.toLowerCase()
    const fact = lookupFact(lower, cfg.refusesUnknown)
    const citations = cfg.emitsCitations ? lookupCitations(lower) : ''

    return {
      output: `${fact}.${citations}`,
      metadata: meta,
    }
  }
}
