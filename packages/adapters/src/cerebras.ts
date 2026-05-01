import type { AdapterFactory } from '@agentskit/core'
import { createOpenAICompatibleAdapter, type OpenAICompatibleConfig } from './openai-compatible'

export interface CerebrasConfig extends OpenAICompatibleConfig {}

const CEREBRAS_BASE_URL = 'https://api.cerebras.ai/v1'
const DEFAULT_MODEL = 'llama-3.3-70b'

const baseFactory = createOpenAICompatibleAdapter(CEREBRAS_BASE_URL)

/**
 * Cerebras — ultra-fast inference on wafer-scale chips. OpenAI-compatible
 * endpoint serving Llama / Qwen models with very low first-token latency.
 *
 * Default model: `llama-3.3-70b`.
 */
export function cerebras(config: Partial<CerebrasConfig> & { apiKey: string }): AdapterFactory {
  const factory = baseFactory({
    model: DEFAULT_MODEL,
    ...config,
  } as CerebrasConfig)
  return {
    ...factory,
    capabilities: {
      streaming: true,
      tools: true,
      usage: true,
    },
  }
}

export const cerebrasAdapter = cerebras
