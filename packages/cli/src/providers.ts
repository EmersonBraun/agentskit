import {
  anthropic,
  deepseek,
  gemini,
  grok,
  kimi,
  ollama,
  openai,
} from '@agentskit/adapters'
import type { AdapterFactory } from '@agentskit/core'

export interface ChatProviderOptions {
  provider: string
  model?: string
  apiKey?: string
  baseUrl?: string
}

export interface ResolvedChatProvider {
  adapter: AdapterFactory
  provider: string
  model?: string
  mode: 'demo' | 'live'
  summary: string
}

function createDemoAdapter(provider: string, model?: string): AdapterFactory {
  return {
    createSource: ({ messages }) => {
      let cancelled = false

      return {
        stream: async function* () {
          const userMessages = messages.filter(message => message.role === 'user')
          const lastMessage = userMessages[userMessages.length - 1]
          const reply = [
            `Provider: ${provider}${model ? ` (${model})` : ''}.`,
            'This is the AgentsKit CLI demo adapter.',
            `You said: ${lastMessage?.content ?? ''}`,
          ].join(' ')

          for (const chunk of reply.match(/.{1,18}/g) ?? []) {
            if (cancelled) return
            await new Promise(resolve => setTimeout(resolve, 35))
            yield { type: 'text' as const, content: chunk }
          }

          yield { type: 'done' as const }
        },
        abort: () => {
          cancelled = true
        },
      }
    },
  }
}

function requireApiKey(
  label: string,
  explicitKey: string | undefined,
  envKey: string | undefined,
  envName: string
) {
  const apiKey = explicitKey ?? envKey
  if (!apiKey) {
    throw new Error(`${label} requires an API key. Pass --api-key or set ${envName}.`)
  }
  return apiKey
}

function requireModel(label: string, model: string | undefined) {
  if (!model) {
    throw new Error(`${label} requires --model in the current CLI version.`)
  }
  return model
}

export function resolveChatProvider(options: ChatProviderOptions): ResolvedChatProvider {
  const provider = options.provider.toLowerCase()

  switch (provider) {
    case 'demo':
      return {
        adapter: createDemoAdapter(provider, options.model),
        provider,
        model: options.model,
        mode: 'demo',
        summary: 'demo adapter (no network, no API key required)',
      }
    case 'openai': {
      const apiKey = requireApiKey('OpenAI', options.apiKey, process.env.OPENAI_API_KEY, 'OPENAI_API_KEY')
      const model = options.model ?? 'gpt-4o-mini'
      return {
        adapter: openai({ apiKey, model, baseUrl: options.baseUrl }),
        provider,
        model,
        mode: 'live',
        summary: 'OpenAI live adapter',
      }
    }
    case 'anthropic': {
      const apiKey = requireApiKey('Anthropic', options.apiKey, process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY')
      const model = options.model ?? 'claude-3-5-sonnet-latest'
      return {
        adapter: anthropic({ apiKey, model, baseUrl: options.baseUrl }),
        provider,
        model,
        mode: 'live',
        summary: 'Anthropic live adapter',
      }
    }
    case 'gemini': {
      const apiKey = requireApiKey('Gemini', options.apiKey, process.env.GEMINI_API_KEY, 'GEMINI_API_KEY')
      const model = options.model ?? 'gemini-2.5-flash'
      return {
        adapter: gemini({ apiKey, model, baseUrl: options.baseUrl }),
        provider,
        model,
        mode: 'live',
        summary: 'Gemini live adapter',
      }
    }
    case 'ollama': {
      const model = options.model ?? 'llama3.1'
      return {
        adapter: ollama({ model, baseUrl: options.baseUrl }),
        provider,
        model,
        mode: 'live',
        summary: 'Ollama live adapter',
      }
    }
    case 'deepseek': {
      const apiKey = requireApiKey('DeepSeek', options.apiKey, process.env.DEEPSEEK_API_KEY, 'DEEPSEEK_API_KEY')
      const model = options.model ?? 'deepseek-chat'
      return {
        adapter: deepseek({ apiKey, model, baseUrl: options.baseUrl }),
        provider,
        model,
        mode: 'live',
        summary: 'DeepSeek live adapter',
      }
    }
    case 'grok': {
      const apiKey = requireApiKey('Grok', options.apiKey, process.env.XAI_API_KEY, 'XAI_API_KEY')
      const model = requireModel('Grok', options.model)
      return {
        adapter: grok({ apiKey, model, baseUrl: options.baseUrl }),
        provider,
        model,
        mode: 'live',
        summary: 'xAI Grok live adapter',
      }
    }
    case 'kimi': {
      const apiKey = requireApiKey(
        'Kimi',
        options.apiKey,
        process.env.KIMI_API_KEY ?? process.env.MOONSHOT_API_KEY,
        'KIMI_API_KEY'
      )
      const model = requireModel('Kimi', options.model)
      return {
        adapter: kimi({ apiKey, model, baseUrl: options.baseUrl }),
        provider,
        model,
        mode: 'live',
        summary: 'Kimi live adapter',
      }
    }
    default:
      throw new Error(
        `Unsupported provider "${options.provider}". Try demo, openai, anthropic, gemini, ollama, deepseek, grok, or kimi.`
      )
  }
}
