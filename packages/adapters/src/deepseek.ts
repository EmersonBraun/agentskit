import { createOpenAICompatibleAdapter, type OpenAICompatibleConfig } from './openai-compatible'

export interface DeepSeekConfig extends OpenAICompatibleConfig {}

export const deepseek = createOpenAICompatibleAdapter('https://api.deepseek.com')
