import type { ChatMemory, Message, MemoryRecord } from '@agentskit/core'
import { serializeMessages, deserializeMessages } from '@agentskit/core'
import type { RedisClientAdapter, RedisConnectionConfig } from './redis-client'
import { createRedisClientAdapter } from './redis-client'

export interface RedisChatMemoryConfig extends RedisConnectionConfig {
  keyPrefix?: string
  conversationId?: string
}

function encodeMessages(messages: Message[]): string {
  return JSON.stringify(serializeMessages(messages))
}

function decodeMessages(json: string | null): Message[] {
  if (!json) return []
  try {
    return deserializeMessages(JSON.parse(json) as MemoryRecord)
  } catch {
    return []
  }
}

export function redisChatMemory(config: RedisChatMemoryConfig): ChatMemory {
  const prefix = config.keyPrefix ?? 'agentskit:chat'
  const convId = config.conversationId ?? 'default'
  const key = `${prefix}:${convId}`
  let clientPromise: Promise<RedisClientAdapter> | null = null

  const getClient = (): Promise<RedisClientAdapter> => {
    if (config.client) return Promise.resolve(config.client)
    if (!clientPromise) clientPromise = createRedisClientAdapter(config.url)
    return clientPromise
  }

  return {
    async load() {
      const client = await getClient()
      const json = await client.get(key)
      return decodeMessages(json)
    },
    async save(messages) {
      const client = await getClient()
      await client.set(key, encodeMessages(messages))
    },
    async clear() {
      const client = await getClient()
      await client.del(key)
    },
  }
}
