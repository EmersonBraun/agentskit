import { describe, expect, it, vi } from 'vitest'
import {
  createInMemoryRedactionVault,
  createPIIRedactor,
  reveal,
  tokenize,
  type RedactionAuditEvent,
} from '../src/security'

describe('tokenize + reveal — round-trip', () => {
  it('tokenizes PII and reveals it back when actor has the right role', async () => {
    const redactor = createPIIRedactor()
    const vault = createInMemoryRedactionVault()
    const input = 'Contact alice@example.com or 555-123-4567'

    const { value: tokenized, tokens } = await tokenize(input, {
      redactor,
      vault,
      allowedRoles: ['support-lead'],
    })
    expect(tokenized).toMatch(/<<piitoken:[a-f0-9]{32}>>/)
    expect(tokenized).not.toContain('alice@example.com')
    expect(tokenized).not.toContain('555-123-4567')
    expect(tokens).toHaveLength(2)

    const revealed = await reveal(tokenized, {
      vault,
      actor: { id: 'lead@co', roles: ['support-lead'] },
    })
    expect(revealed.value).toBe(input)
    expect(revealed.revealed).toBe(2)
    expect(revealed.denied).toBe(0)
  })

  it('denies reveal when actor has no matching role', async () => {
    const redactor = createPIIRedactor()
    const vault = createInMemoryRedactionVault()
    const { value: tokenized } = await tokenize('email alice@example.com', {
      redactor,
      vault,
      allowedRoles: ['support-lead'],
    })

    const revealed = await reveal(tokenized, {
      vault,
      actor: { id: 'agent@co', roles: ['agent'] },
    })
    expect(revealed.value).toBe(tokenized)
    expect(revealed.revealed).toBe(0)
    expect(revealed.denied).toBe(1)
  })

  it('reveals only the tokens whose roles match (partial reveal)', async () => {
    const redactor = createPIIRedactor()
    const vault = createInMemoryRedactionVault()
    const input = 'Contact alice@example.com or 555-123-4567'

    // First tokenize the email with one role-set
    const { value: stage1 } = await tokenize(input, {
      redactor: createPIIRedactor({
        rules: [{ name: 'email', pattern: /[a-z@.]+@[a-z.]+/g, replacer: '[REDACTED_EMAIL]' }],
      }),
      vault,
      allowedRoles: ['email-only'],
    })
    // Then tokenize the phone with a different role-set
    const { value: stage2 } = await tokenize(stage1, {
      redactor: createPIIRedactor({
        rules: [{ name: 'phone', pattern: /\d{3}-\d{3}-\d{4}/g, replacer: '[REDACTED_PHONE]' }],
      }),
      vault,
      allowedRoles: ['phone-only'],
    })

    const revealed = await reveal(stage2, {
      vault,
      actor: { id: 'a', roles: ['email-only'] },
    })
    expect(revealed.value).toContain('alice@example.com')
    expect(revealed.value).not.toContain('555-123-4567')
    expect(revealed.value).toMatch(/<<piitoken:[a-f0-9]{32}>>/)
    expect(revealed.revealed).toBe(1)
    expect(revealed.denied).toBe(1)
  })

  it('passes input through unchanged when no PII matches', async () => {
    const redactor = createPIIRedactor()
    const vault = createInMemoryRedactionVault()
    const { value, tokens } = await tokenize('all clean here', {
      redactor,
      vault,
      allowedRoles: ['x'],
    })
    expect(value).toBe('all clean here')
    expect(tokens).toHaveLength(0)
  })

  it('returns input unchanged when no tokens present on reveal', async () => {
    const vault = createInMemoryRedactionVault()
    const result = await reveal('plain text', {
      vault,
      actor: { id: 'a', roles: ['x'] },
    })
    expect(result.value).toBe('plain text')
    expect(result.revealed).toBe(0)
    expect(result.denied).toBe(0)
  })

  it('treats unknown tokens as denied (leaves placeholder)', async () => {
    const vault = createInMemoryRedactionVault()
    const stale = '<<piitoken:' + 'a'.repeat(32) + '>>'
    const result = await reveal(stale, {
      vault,
      actor: { id: 'a', roles: ['x'] },
    })
    expect(result.value).toBe(stale)
    expect(result.denied).toBe(1)
  })

  it('emits pii:redact audit event with rule hit counts', async () => {
    const events: RedactionAuditEvent[] = []
    const audit = vi.fn(async (e: RedactionAuditEvent) => { events.push(e) })
    const redactor = createPIIRedactor()
    const vault = createInMemoryRedactionVault()
    await tokenize('a@b.co and c@d.io', {
      redactor,
      vault,
      allowedRoles: ['x'],
      audit,
    })
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('pii:redact')
    expect(events[0].tokens).toBe(2)
    expect(events[0].rules).toEqual([{ rule: 'email', count: 2 }])
  })

  it('emits pii:reveal + pii:reveal-denied separately', async () => {
    const events: RedactionAuditEvent[] = []
    const audit = vi.fn(async (e: RedactionAuditEvent) => { events.push(e) })
    const redactor = createPIIRedactor()
    const vault = createInMemoryRedactionVault()
    const { value: t1 } = await tokenize('a@b.co', { redactor, vault, allowedRoles: ['ok'] })
    const { value: t2 } = await tokenize(`${t1} c@d.io`, { redactor, vault, allowedRoles: ['nope'] })
    await reveal(t2, {
      vault,
      actor: { id: 'a', roles: ['ok'] },
      audit,
    })
    expect(events.find(e => e.type === 'pii:reveal')?.tokens).toBe(1)
    expect(events.find(e => e.type === 'pii:reveal-denied')?.tokens).toBe(1)
  })
})

describe('config errors', () => {
  it('tokenize: throws when redactor missing', async () => {
    const vault = createInMemoryRedactionVault()
    await expect(
      tokenize('x', { redactor: undefined as never, vault, allowedRoles: ['x'] }),
    ).rejects.toThrow(/redactor is required/)
  })

  it('tokenize: throws when vault missing', async () => {
    await expect(
      tokenize('x', { redactor: createPIIRedactor(), vault: undefined as never, allowedRoles: ['x'] }),
    ).rejects.toThrow(/vault is required/)
  })

  it('reveal: throws when actor.roles missing', async () => {
    const vault = createInMemoryRedactionVault()
    await expect(
      reveal('x', { vault, actor: undefined as never }),
    ).rejects.toThrow(/actor with roles/)
  })
})
