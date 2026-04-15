import type { AdapterFactory, AdapterRequest, StreamSource } from '@agentskit/core'
import { createStreamSource, parseOpenAIStream, toProviderMessages, type RetryOptions } from './utils'

export interface OpenAIConfig {
  apiKey: string
  model: string
  baseUrl?: string
  retry?: RetryOptions
}

export function openai(config: OpenAIConfig): AdapterFactory {
  const { apiKey, model, baseUrl = 'https://api.openai.com', retry } = config

  return {
    capabilities: {
      streaming: true,
      tools: true,
      // o1 / o3 models emit reasoning; older models don't. Accurate per-model
      // detection would need a model registry; 'true' is the safer default here.
      reasoning: model.startsWith('o1') || model.startsWith('o3'),
      multiModal: model.startsWith('gpt-4') || model.startsWith('o'),
      usage: true,
    },
    createSource: (request: AdapterRequest): StreamSource => {
      const body = {
        model,
        messages: toProviderMessages(request.messages),
        tools: request.context?.tools?.map(tool => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.schema,
          },
        })),
        temperature: request.context?.temperature,
        max_tokens: request.context?.maxTokens,
        stream: true,
      }

      return createStreamSource(
        (signal) => fetch(`${baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
          signal,
        }),
        parseOpenAIStream,
        'OpenAI API',
        retry,
      )
    },
  }
}
