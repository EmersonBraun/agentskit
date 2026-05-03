import { describe, expect, it } from 'vitest'
import {
  wrapChatMemoryWithRedaction,
  wrapVectorMemoryWithRedaction,
} from '../src/redaction'
import {
  createInMemoryRedactionVault,
  DEFAULT_PII_RULES,
} from '@agentskit/core/security'
import type { ChatMemory, VectorDocument, VectorMemory, Message } from '@agentskit/core'

function buildChatMemory(): { mem: ChatMemory; saved: Message[][] } {
  const saved: Message[][] = []
  const mem: ChatMemory = {
    load: async () => saved.at(-1) ?? [],
    save: async messages => { saved.push(messages) },
    clear: async () => { saved.length = 0 },
  }
  return { mem, saved }
}

function buildVectorMemory(): { mem: VectorMemory; stored: VectorDocument[] } {
  const stored: VectorDocument[] = []
  const mem: VectorMemory = {
    store: async docs => { stored.push(...docs) },
    search: async () => [],
    delete: async ids => {
      const drop = new Set(ids)
      stored.splice(0, stored.length, ...stored.filter(d => !drop.has(d.id)))
    },
  }
  return { mem, stored }
}

const msg = (content: string, role: Message['role'] = 'user'): Message => ({
  id: `m-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  status: 'complete',
  createdAt: new Date(0),
})

describe('wrapChatMemoryWithRedaction — redact mode', () => {
  it('replaces PII in saved messages with bracket markers', async () => {
    const { mem, saved } = buildChatMemory()
    const wrapped = wrapChatMemoryWithRedaction(mem, {
      rules: DEFAULT_PII_RULES,
    })
    await wrapped.save([msg('email me alice@example.com'), msg('hi', 'assistant')])
    expect(saved[0][0].content).toContain('[REDACTED_EMAIL]')
    expect(saved[0][0].content).not.toContain('alice@example.com')
    expect(saved[0][1].content).toBe('hi')
  })

  it('passes load + clear through unchanged', async () => {
    const { mem, saved } = buildChatMemory()
    const wrapped = wrapChatMemoryWithRedaction(mem, { rules: DEFAULT_PII_RULES })
    await wrapped.save([msg('plain')])
    const loaded = await wrapped.load()
    expect(loaded[0].content).toBe('plain')
    await wrapped.clear?.()
    expect(saved).toEqual([])
  })
})

describe('wrapChatMemoryWithRedaction — tokenize mode', () => {
  it('tokenizes saved messages and stores originals in the vault', async () => {
    const { mem, saved } = buildChatMemory()
    const vault = createInMemoryRedactionVault()
    const wrapped = wrapChatMemoryWithRedaction(mem, {
      rules: DEFAULT_PII_RULES,
      mode: 'tokenize',
      vault,
      allowedRoles: ['support'],
    })
    await wrapped.save([msg('reach me at alice@example.com')])
    const stored = saved[0][0].content
    expect(stored).toMatch(/<<piitoken:[a-f0-9]{32}>>/)
    expect(stored).not.toContain('alice@example.com')
    const tokenMatch = stored.match(/<<piitoken:[a-f0-9]{32}>>/)
    const entry = await vault.get(tokenMatch![0])
    expect(entry?.plaintext).toBe('alice@example.com')
    expect(entry?.allowedRoles).toEqual(['support'])
  })

  it('throws when vault missing in tokenize mode', async () => {
    const { mem } = buildChatMemory()
    const wrapped = wrapChatMemoryWithRedaction(mem, {
      rules: DEFAULT_PII_RULES,
      mode: 'tokenize',
      allowedRoles: ['x'],
    })
    await expect(wrapped.save([msg('alice@b.co')])).rejects.toThrow(/vault is required/)
  })

  it('throws when allowedRoles missing in tokenize mode', async () => {
    const { mem } = buildChatMemory()
    const wrapped = wrapChatMemoryWithRedaction(mem, {
      rules: DEFAULT_PII_RULES,
      mode: 'tokenize',
      vault: createInMemoryRedactionVault(),
    })
    await expect(wrapped.save([msg('alice@b.co')])).rejects.toThrow(/allowedRoles is required/)
  })
})

describe('wrapVectorMemoryWithRedaction', () => {
  it('redacts content but preserves embedding + id + metadata', async () => {
    const { mem, stored } = buildVectorMemory()
    const wrapped = wrapVectorMemoryWithRedaction(mem, {
      rules: DEFAULT_PII_RULES,
    })
    await wrapped.store([
      { id: 'd1', content: 'support@example.com asked about pricing', embedding: [0.1, 0.2], metadata: { source: 'sf' } },
    ])
    expect(stored[0].id).toBe('d1')
    expect(stored[0].content).toContain('[REDACTED_EMAIL]')
    expect(stored[0].embedding).toEqual([0.1, 0.2])
    expect(stored[0].metadata).toEqual({ source: 'sf' })
  })

  it('passes search + delete through unchanged', async () => {
    const { mem, stored } = buildVectorMemory()
    const wrapped = wrapVectorMemoryWithRedaction(mem, { rules: DEFAULT_PII_RULES })
    await wrapped.store([{ id: 'd1', content: 'a@b.co', embedding: [0.1] }])
    expect(stored).toHaveLength(1)
    await wrapped.delete!(['d1'])
    expect(stored).toHaveLength(0)
  })
})
