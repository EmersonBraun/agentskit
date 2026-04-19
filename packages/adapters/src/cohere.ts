import { createOpenAICompatibleAdapter, type OpenAICompatibleConfig } from './openai-compatible'

export interface CohereConfig extends OpenAICompatibleConfig {}

/**
 * Cohere Command models via the OpenAI-compatibility endpoint.
 * Default models: `command-r-plus`, `command-r`, `command-light`.
 */
export const cohere = createOpenAICompatibleAdapter('https://api.cohere.com/compatibility/v1')
