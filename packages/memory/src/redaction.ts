import type {
  ChatMemory,
  Message,
  VectorDocument,
  VectorMemory,
} from '@agentskit/core'
import {
  tokenize,
  type PIIRedactor,
  type RedactionAuditSink,
  type RedactionVault,
} from '@agentskit/core/security'

/**
 * Wrap any `ChatMemory` so PII is redacted (or tokenized) on every
 * `save()`. Works with the in-memory, file, sqlite, turso, and redis
 * chat memories. The wrapped memory's `load()` and `clear()` are
 * passthrough — reveal happens at read time via
 * `@agentskit/core/security` `reveal()`, not inside the memory.
 *
 * `mode: 'redact'` (default) replaces matches with `[REDACTED_*]`
 * markers — irreversible. `mode: 'tokenize'` replaces matches with
 * opaque `<<piitoken:…>>` markers and stores originals in the vault
 * so role-gated `reveal()` can recover them.
 *
 * Closes the memory-write half of issue #791.
 */

export type RedactionMode = 'redact' | 'tokenize'

export interface ChatMemoryRedactionOptions {
  redactor: PIIRedactor
  mode?: RedactionMode
  /** Required when `mode === 'tokenize'`. */
  vault?: RedactionVault
  /** Roles allowed to reveal — required when `mode === 'tokenize'`. */
  allowedRoles?: string[]
  /** Optional audit sink threaded into the vault tokenize() calls. */
  audit?: RedactionAuditSink
}

export interface VectorMemoryRedactionOptions extends ChatMemoryRedactionOptions {}

async function redactString(
  input: string,
  opts: ChatMemoryRedactionOptions,
): Promise<string> {
  if (opts.mode === 'tokenize') {
    if (!opts.vault) {
      throw new Error('wrapChatMemoryWithRedaction: vault is required when mode is "tokenize"')
    }
    if (!opts.allowedRoles) {
      throw new Error('wrapChatMemoryWithRedaction: allowedRoles is required when mode is "tokenize"')
    }
    const result = await tokenize(input, {
      redactor: opts.redactor,
      vault: opts.vault,
      allowedRoles: opts.allowedRoles,
      audit: opts.audit,
    })
    return result.value
  }
  return opts.redactor.redact(input).value
}

export function wrapChatMemoryWithRedaction(
  inner: ChatMemory,
  options: ChatMemoryRedactionOptions,
): ChatMemory {
  return {
    load: () => inner.load(),
    save: async messages => {
      const redacted: Message[] = await Promise.all(
        messages.map(async m => ({
          ...m,
          content: await redactString(m.content ?? '', options),
        })),
      )
      await inner.save(redacted)
    },
    clear: inner.clear ? () => inner.clear!() : undefined,
  }
}

/**
 * Wrap any `VectorMemory` so each document's `content` is redacted (or
 * tokenized) before `store()`. `metadata.original_content` is *not*
 * preserved — that would defeat the purpose. `search()` and `delete()`
 * are passthrough.
 *
 * Note: embeddings are passed through verbatim. Customers who embed
 * plaintext PII separately (e.g. via a hosted embedding provider) need
 * to redact the input to their embedder, not just to this wrapper.
 */
export function wrapVectorMemoryWithRedaction(
  inner: VectorMemory,
  options: VectorMemoryRedactionOptions,
): VectorMemory {
  return {
    store: async docs => {
      const redacted: VectorDocument[] = await Promise.all(
        docs.map(async d => ({
          ...d,
          content: await redactString(d.content, options),
        })),
      )
      await inner.store(redacted)
    },
    search: (embedding, opts) => inner.search(embedding, opts),
    delete: inner.delete ? ids => inner.delete!(ids) : undefined,
  }
}
