import type { AdapterFactory } from '@agentskit/core'
import { createOpenAICompatibleAdapter, type OpenAICompatibleConfig } from './openai-compatible'

export interface GroqConfig extends OpenAICompatibleConfig {}

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'
const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

const baseFactory = createOpenAICompatibleAdapter(GROQ_BASE_URL)

/**
 * Groq — OpenAI-compatible endpoint serving Llama / Mixtral on LPUs.
 * Known for very low first-token latency.
 *
 * Default model: `llama-3.3-70b-versatile`.
 */
export function groq(config: Partial<GroqConfig> & { apiKey: string }): AdapterFactory {
  const factory = baseFactory({
    model: DEFAULT_MODEL,
    ...config,
  } as GroqConfig)
  return {
    ...factory,
    capabilities: {
      streaming: true,
      tools: true,
      usage: true,
    },
  }
}

/** Alias for naming consistency with other native adapters. */
export const groqAdapter = groq
