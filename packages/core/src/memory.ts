import type { ChatMemory, MemoryRecord, Message } from './types'

function serializeMessages(messages: Message[]): MemoryRecord {
  return {
    version: 1,
    messages: messages.map(message => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
    })),
  }
}

function deserializeMessages(record: MemoryRecord | null | undefined): Message[] {
  if (!record?.messages) return []
  return record.messages.map(message => ({
    ...message,
    createdAt: new Date(message.createdAt),
  }))
}

export function createInMemoryMemory(initialMessages: Message[] = []): ChatMemory {
  let messages = [...initialMessages]

  return {
    async load() {
      return [...messages]
    },
    async save(nextMessages) {
      messages = [...nextMessages]
    },
    async clear() {
      messages = []
    },
  }
}

export function createLocalStorageMemory(key: string): ChatMemory {
  return {
    async load() {
      if (typeof localStorage === 'undefined') return []
      const raw = localStorage.getItem(key)
      if (!raw) return []
      try {
        return deserializeMessages(JSON.parse(raw) as MemoryRecord)
      } catch {
        return []
      }
    },
    async save(messages) {
      if (typeof localStorage === 'undefined') return
      localStorage.setItem(key, JSON.stringify(serializeMessages(messages)))
    },
    async clear() {
      if (typeof localStorage === 'undefined') return
      localStorage.removeItem(key)
    },
  }
}

export function createFileMemory(path: string): ChatMemory {
  return {
    async load() {
      try {
        const fs = await import('node:fs/promises')
        const raw = await fs.readFile(path, 'utf8')
        return deserializeMessages(JSON.parse(raw) as MemoryRecord)
      } catch {
        return []
      }
    },
    async save(messages) {
      const fs = await import('node:fs/promises')
      await fs.writeFile(path, JSON.stringify(serializeMessages(messages), null, 2), 'utf8')
    },
    async clear() {
      try {
        const fs = await import('node:fs/promises')
        await fs.unlink(path)
      } catch {
        // Ignore missing files.
      }
    },
  }
}
