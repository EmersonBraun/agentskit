import { createOpenAICompatibleAdapter, type OpenAICompatibleConfig } from './openai-compatible'

export interface GrokConfig extends OpenAICompatibleConfig {}

export const grok = createOpenAICompatibleAdapter('https://api.x.ai')
