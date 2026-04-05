import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createInMemoryMemory, createFileMemory } from '../src/memory'
import type { Message } from '../src/types'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const sampleMessage: Message = {
  id: 'test-1',
  role: 'user',
  content: 'hello',
  status: 'complete',
  createdAt: new Date('2026-01-01T00:00:00Z'),
}

describe('createInMemoryMemory', () => {
  it('starts empty by default', async () => {
    const mem = createInMemoryMemory()
    expect(await mem.load()).toEqual([])
  })

  it('starts with initial messages', async () => {
    const mem = createInMemoryMemory([sampleMessage])
    const loaded = await mem.load()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].content).toBe('hello')
  })

  it('save then load round-trips', async () => {
    const mem = createInMemoryMemory()
    await mem.save([sampleMessage])
    const loaded = await mem.load()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe('test-1')
  })

  it('clear empties messages', async () => {
    const mem = createInMemoryMemory([sampleMessage])
    await mem.clear!()
    expect(await mem.load()).toEqual([])
  })

  it('returns copies, not references', async () => {
    const mem = createInMemoryMemory([sampleMessage])
    const loaded1 = await mem.load()
    const loaded2 = await mem.load()
    expect(loaded1).not.toBe(loaded2)
  })
})

describe('createFileMemory', () => {
  let filepath: string

  beforeEach(() => {
    filepath = join(tmpdir(), `agentskit-test-${Date.now()}.json`)
  })

  afterEach(async () => {
    try { await unlink(filepath) } catch {}
  })

  it('returns empty array when file does not exist', async () => {
    const mem = createFileMemory(filepath)
    expect(await mem.load()).toEqual([])
  })

  it('save then load round-trips with date serialization', async () => {
    const mem = createFileMemory(filepath)
    await mem.save([sampleMessage])
    const loaded = await mem.load()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].content).toBe('hello')
    expect(loaded[0].createdAt).toBeInstanceOf(Date)
    expect(loaded[0].createdAt.toISOString()).toBe('2026-01-01T00:00:00.000Z')
  })

  it('clear removes the file', async () => {
    const mem = createFileMemory(filepath)
    await mem.save([sampleMessage])
    await mem.clear!()
    expect(await mem.load()).toEqual([])
  })

  it('clear on non-existent file does not throw', async () => {
    const mem = createFileMemory(filepath)
    await expect(mem.clear!()).resolves.toBeUndefined()
  })
})
