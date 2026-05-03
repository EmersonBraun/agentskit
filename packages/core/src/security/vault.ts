import { randomBytes } from 'node:crypto'
import { ConfigError, ErrorCodes } from '../errors'
import type { PIIRedactor } from './pii'

/**
 * Reveal-by-role flow for PII that must be recoverable. Where the
 * default `createPIIRedactor` produces irreversible `[REDACTED_*]`
 * tags, `tokenize()` stores the original keyed by an opaque token in
 * a `RedactionVault`. `reveal()` looks the originals back up only
 * when an actor matches the configured `allowedRoles`.
 *
 * The vault contract is one interface with three methods so it can
 * be backed by anything append-only: in-memory (this module), KMS-
 * encrypted blob storage, HSM, etc. Originals never live on the write
 * path the agent / model can see.
 *
 * Closes the reveal-by-role half of issue #791.
 */

export interface RevealActor {
  /** Stable identity (email, OIDC subject, service-account name). */
  id: string
  /** Roles granted to this actor. Match against `allowedRoles` on reveal. */
  roles: string[]
}

export interface VaultEntry {
  /** ISO 8601 timestamp the value was tokenized. */
  storedAt: string
  /** Originally redacted text. */
  plaintext: string
  /** Roles permitted to reveal. Empty array means no actor can reveal. */
  allowedRoles: string[]
  /** Opaque metadata to help auditors correlate (request id, tenant id). */
  metadata?: Record<string, unknown>
}

export interface RedactionVault {
  put: (token: string, entry: VaultEntry) => Promise<void>
  /** Returns the entry with no role-check; reveal() does the check. */
  get: (token: string) => Promise<VaultEntry | null>
  delete?: (token: string) => Promise<void>
}

export interface RedactionAuditEvent {
  type: 'pii:redact' | 'pii:reveal' | 'pii:reveal-denied'
  /** ISO 8601 timestamp. */
  at: string
  /** Number of distinct tokens involved. */
  tokens: number
  /** Per-rule hit counts (only for redact events). */
  rules?: Array<{ rule: string; count: number }>
  /** Actor id for reveal events. */
  actor?: string
  /** Optional opaque correlation id. */
  context?: Record<string, unknown>
}

export type RedactionAuditSink = (event: RedactionAuditEvent) => void | Promise<void>

export interface TokenizeOptions {
  redactor: PIIRedactor
  vault: RedactionVault
  /** Roles allowed to reveal the originals. */
  allowedRoles: string[]
  /** Optional audit sink — receives one `pii:redact` event per call. */
  audit?: RedactionAuditSink
  /** Per-call correlation metadata threaded into both vault + audit. */
  context?: Record<string, unknown>
}

export interface RevealOptions {
  vault: RedactionVault
  actor: RevealActor
  /** Optional audit sink — receives `pii:reveal` or `pii:reveal-denied`. */
  audit?: RedactionAuditSink
  context?: Record<string, unknown>
}

const TOKEN_PATTERN = /<<piitoken:([a-f0-9]{32})>>/g
const REDACTION_MARKER = /\[REDACTED_[A-Z][A-Z_-]*\]/g

function newToken(): string {
  return `<<piitoken:${randomBytes(16).toString('hex')}>>`
}

/**
 * Replace every PII match in `input` with an opaque `<<piitoken:…>>`
 * marker, storing the original in the vault keyed by the marker.
 * Emits one `pii:redact` audit event per call.
 *
 * Implementation walks the redactor's first-pass output (with
 * `[REDACTED_*]` tags) and pairs each tag back to its source slice in
 * the original input by anchoring on the post-tag prefix. Works for
 * any rule list as long as the replacer output uses the bracketed
 * upper-case form.
 */
export async function tokenize(
  input: string,
  options: TokenizeOptions,
): Promise<{ value: string; tokens: string[] }> {
  if (!options.redactor) {
    throw new ConfigError({
      code: ErrorCodes.AK_CONFIG_INVALID,
      message: 'tokenize: redactor is required',
    })
  }
  if (!options.vault) {
    throw new ConfigError({
      code: ErrorCodes.AK_CONFIG_INVALID,
      message: 'tokenize: vault is required',
    })
  }

  const tokens: string[] = []
  const redacted = options.redactor.redact(input)

  if (redacted.hits.length === 0) {
    await options.audit?.({
      type: 'pii:redact',
      at: new Date().toISOString(),
      tokens: 0,
      rules: [],
      context: options.context,
    })
    return { value: input, tokens: [] }
  }

  const markers = Array.from(redacted.value.matchAll(REDACTION_MARKER))
  let cursor = 0
  let inputCursor = 0
  let tokenized = ''
  for (const marker of markers) {
    const markerStart = marker.index ?? 0
    const prefix = redacted.value.slice(cursor, markerStart)
    tokenized += prefix
    inputCursor += prefix.length

    const postIndex = markerStart + marker[0].length
    // Look at the redacted output AFTER this marker, but stop at the
    // next marker — the slice between two markers in the redacted
    // string corresponds verbatim to the same slice in `input`.
    const tail = redacted.value.slice(postIndex)
    const nextMarker = tail.search(REDACTION_MARKER)
    const literalTail = nextMarker >= 0 ? tail.slice(0, nextMarker) : tail
    const postPrefix = literalTail.slice(0, Math.min(32, literalTail.length))
    let originalEnd: number
    if (postPrefix.length === 0) {
      // Marker is at the very end (or another marker abuts it). Find
      // the original by scanning forward in `input` to the end OR to
      // wherever the next post-marker prefix would start.
      originalEnd = input.length
    } else {
      const idx = input.indexOf(postPrefix, inputCursor)
      originalEnd = idx >= 0 ? idx : input.length
    }
    const original = input.slice(inputCursor, originalEnd)
    inputCursor = originalEnd

    const token = newToken()
    tokens.push(token)
    await options.vault.put(token, {
      storedAt: new Date().toISOString(),
      plaintext: original,
      allowedRoles: [...options.allowedRoles],
      metadata: options.context,
    })
    tokenized += token
    cursor = postIndex
  }
  tokenized += redacted.value.slice(cursor)

  await options.audit?.({
    type: 'pii:redact',
    at: new Date().toISOString(),
    tokens: tokens.length,
    rules: redacted.hits.map(h => ({ rule: h.rule, count: h.count })),
    context: options.context,
  })

  return { value: tokenized, tokens }
}

/**
 * Replace every `<<piitoken:…>>` in `input` with the original from the
 * vault, but only for tokens whose `allowedRoles` overlap with the
 * actor's roles. Tokens the actor cannot reveal are left in place
 * unchanged. Emits at most one `pii:reveal` event (when something was
 * revealed) and at most one `pii:reveal-denied` (when something was
 * denied) per call.
 */
export async function reveal(
  input: string,
  options: RevealOptions,
): Promise<{ value: string; revealed: number; denied: number }> {
  if (!options.vault) {
    throw new ConfigError({
      code: ErrorCodes.AK_CONFIG_INVALID,
      message: 'reveal: vault is required',
    })
  }
  if (!options.actor || !Array.isArray(options.actor.roles)) {
    throw new ConfigError({
      code: ErrorCodes.AK_CONFIG_INVALID,
      message: 'reveal: actor with roles[] is required',
    })
  }

  const actorRoles = new Set(options.actor.roles)
  let revealed = 0
  let denied = 0

  const matches = Array.from(input.matchAll(TOKEN_PATTERN))
  if (matches.length === 0) {
    return { value: input, revealed: 0, denied: 0 }
  }

  let out = ''
  let cursor = 0
  for (const match of matches) {
    const token = match[0]
    const start = match.index ?? 0
    out += input.slice(cursor, start)
    const entry = await options.vault.get(token)
    if (!entry) {
      out += token
      denied++
    } else {
      const allowed =
        entry.allowedRoles.length > 0 &&
        entry.allowedRoles.some(role => actorRoles.has(role))
      if (allowed) {
        out += entry.plaintext
        revealed++
      } else {
        out += token
        denied++
      }
    }
    cursor = start + token.length
  }
  out += input.slice(cursor)

  if (revealed > 0) {
    await options.audit?.({
      type: 'pii:reveal',
      at: new Date().toISOString(),
      tokens: revealed,
      actor: options.actor.id,
      context: options.context,
    })
  }
  if (denied > 0) {
    await options.audit?.({
      type: 'pii:reveal-denied',
      at: new Date().toISOString(),
      tokens: denied,
      actor: options.actor.id,
      context: options.context,
    })
  }

  return { value: out, revealed, denied }
}

/**
 * Process-local in-memory vault. Suitable for tests and single-node
 * deployments. Production should back the vault with KMS-encrypted
 * blob storage so plaintext never lives unencrypted at rest.
 */
export function createInMemoryRedactionVault(): RedactionVault {
  const map = new Map<string, VaultEntry>()
  return {
    async put(token, entry) {
      map.set(token, entry)
    },
    async get(token) {
      return map.get(token) ?? null
    },
    async delete(token) {
      map.delete(token)
    },
  }
}
