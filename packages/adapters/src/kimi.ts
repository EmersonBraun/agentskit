import { createOpenAICompatibleAdapter, type OpenAICompatibleConfig } from './openai-compatible'

export interface KimiConfig extends OpenAICompatibleConfig {}

export const kimi = createOpenAICompatibleAdapter('https://api.moonshot.ai')
