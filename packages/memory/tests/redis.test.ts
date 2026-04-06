import { describe, it, expect } from 'vitest'
import { redisChatMemory } from '../src/redis-chat'
import { redisVectorMemory } from '../src/redis-vector'
import type { RedisClientAdapter } from '../src/redis-client'
import type { Message } from '@agentskit/core'

// Mock Redis client for unit testing (no real Redis needed)
function createMockRedisClient(): RedisClientAdapter {
  const store = new Map<string, string>()

  return {
    async get(key) { return store.get(key) ?? null },
    async set(key, value) { store.set(key, value) },
    async del(key) {
      const keys = Array.isArray(key) ? key : [key]
      for (const k of keys) store.delete(k)
    },
    async keys(pattern) {
      const prefix = pattern.replace('*', '')
      return [...store.keys()].filter(k => k.startsWith(prefix))
    },
    async disconnect() {},
    async call() { return null },
  }
}

const sampleMessage: Message = {
  id: 'test-1',
  role: 'user',
  content: 'hello from redis',
  status: 'complete',
  createdAt: new Date('2026-01-01T00:00:00Z'),
}

describe('redisChatMemory', () => {
  it('returns empty array when no messages saved', async () => {
    const client = createMockRedisClient()
    const mem = redisChatMemory({ url: '', client })
    expect(await mem.load()).toEqual([])
  })

  it('save then load round-trips with date serialization', async () => {
    const client = createMockRedisClient()
    const mem = redisChatMemory({ url: '', client })
    await mem.save([sampleMessage])
    const loaded = await mem.load()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].content).toBe('hello from redis')
    expect(loaded[0].createdAt).toBeInstanceOf(Date)
    expect(loaded[0].createdAt.toISOString()).toBe('2026-01-01T00:00:00.000Z')
  })

  it('overwrites previous messages on save', async () => {
    const client = createMockRedisClient()
    const mem = redisChatMemory({ url: '', client })
    await mem.save([sampleMessage])
    await mem.save([{ ...sampleMessage, id: 'test-2', content: 'updated' }])
    const loaded = await mem.load()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].content).toBe('updated')
  })

  it('clear removes messages', async () => {
    const client = createMockRedisClient()
    const mem = redisChatMemory({ url: '', client })
    await mem.save([sampleMessage])
    await mem.clear!()
    expect(await mem.load()).toEqual([])
  })

  it('uses custom key prefix and conversation ID', async () => {
    const client = createMockRedisClient()
    const mem = redisChatMemory({ url: '', client, keyPrefix: 'myapp:chat', conversationId: 'conv1' })
    await mem.save([sampleMessage])
    // Verify the key was set with custom prefix
    const keys = await client.keys('myapp:chat:*')
    expect(keys).toContain('myapp:chat:conv1')
  })

  it('preserves toolCalls and metadata', async () => {
    const client = createMockRedisClient()
    const mem = redisChatMemory({ url: '', client })
    const msg: Message = {
      ...sampleMessage,
      toolCalls: [{ id: 'tc1', name: 'test', args: { x: 1 }, status: 'complete', result: 'ok' }],
      metadata: { key: 'value' },
    }
    await mem.save([msg])
    const loaded = await mem.load()
    expect(loaded[0].toolCalls?.[0].name).toBe('test')
    expect(loaded[0].metadata?.key).toBe('value')
  })
})

describe('redisVectorMemory', () => {
  it('can be instantiated with mock client', () => {
    const client = createMockRedisClient()
    const mem = redisVectorMemory({ url: '', client })
    expect(mem.store).toBeTypeOf('function')
    expect(mem.search).toBeTypeOf('function')
    expect(mem.delete).toBeTypeOf('function')
  })
})
