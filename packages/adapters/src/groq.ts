import { createOpenAICompatibleAdapter, type OpenAICompatibleConfig } from './openai-compatible'

export interface GroqConfig extends OpenAICompatibleConfig {}

/**
 * Groq. OpenAI-compatible endpoint serving Llama / Mixtral on LPU.
 * Known for very low first-token latency.
 */
export const groq = createOpenAICompatibleAdapter('https://api.groq.com/openai/v1')
