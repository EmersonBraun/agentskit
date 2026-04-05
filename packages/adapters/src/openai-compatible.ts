import type { AdapterFactory } from '@agentskit/core'
import { openai, type OpenAIConfig } from './openai'

export interface OpenAICompatibleConfig extends OpenAIConfig {}

export function createOpenAICompatibleAdapter(defaultBaseUrl: string) {
  return function openAICompatibleAdapter(config: OpenAICompatibleConfig): AdapterFactory {
    return openai({
      ...config,
      baseUrl: config.baseUrl ?? defaultBaseUrl,
    })
  }
}
