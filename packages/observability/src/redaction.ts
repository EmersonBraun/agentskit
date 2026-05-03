import type { AgentEvent, Observer } from '@agentskit/core'
import {
  tokenize,
  type PIIRedactor,
  type RedactionVault,
  type RedactionAuditSink,
} from '@agentskit/core/security'

/**
 * Wrap any `Observer` so PII is redacted (or tokenized) in event
 * payloads before they hit the underlying sink. Without this, even
 * with send-side redaction in place, sensitive data leaks through
 * Langfuse / Braintrust / local trace storage / replay snapshots.
 *
 * The wrapper edits **content fields only** (`llm:end.content`,
 * `tool:start.args`, `tool:end.result`, `agent:delegate:end.result`).
 * It deliberately does NOT touch numeric / structural fields like
 * `usage`, `durationMs`, `messageCount`, `latencyMs`, `step` — those
 * carry no PII risk and breaking their numeric type would corrupt
 * downstream dashboards.
 *
 * Closes issue #792.
 */

export type RedactionMode = 'redact' | 'tokenize'

export interface ObserverRedactionOptions {
  redactor: PIIRedactor
  mode?: RedactionMode
  vault?: RedactionVault
  allowedRoles?: string[]
  audit?: RedactionAuditSink
}

async function redactString(
  input: string,
  opts: ObserverRedactionOptions,
): Promise<string> {
  if (opts.mode === 'tokenize') {
    if (!opts.vault) {
      throw new Error('wrapObserverWithRedaction: vault is required when mode is "tokenize"')
    }
    if (!opts.allowedRoles) {
      throw new Error('wrapObserverWithRedaction: allowedRoles is required when mode is "tokenize"')
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

async function redactStringValuesDeep(
  value: unknown,
  opts: ObserverRedactionOptions,
): Promise<unknown> {
  if (typeof value === 'string') return redactString(value, opts)
  if (Array.isArray(value)) {
    return Promise.all(value.map(v => redactStringValuesDeep(v, opts)))
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = await redactStringValuesDeep(v, opts)
    }
    return out
  }
  return value
}

async function redactEvent(
  event: AgentEvent,
  opts: ObserverRedactionOptions,
): Promise<AgentEvent> {
  switch (event.type) {
    case 'llm:end':
      return { ...event, content: await redactString(event.content, opts) }
    case 'tool:start': {
      const args = (await redactStringValuesDeep(event.args, opts)) as Record<string, unknown>
      return { ...event, args }
    }
    case 'tool:end':
      return { ...event, result: await redactString(event.result, opts) }
    case 'agent:delegate:end':
      return { ...event, result: await redactString(event.result, opts) }
    case 'error':
      // Errors carry messages that may contain PII (a stringified user
      // input, an HTTP body fragment). Wrap with a fresh Error whose
      // message is the redacted form. Preserve the original name.
      return {
        ...event,
        error: Object.assign(new Error(await redactString(event.error.message, opts)), {
          name: event.error.name,
        }),
      }
    default:
      return event
  }
}

export function wrapObserverWithRedaction(
  inner: Observer,
  options: ObserverRedactionOptions,
): Observer {
  return {
    name: `redacted(${inner.name})`,
    on: async event => {
      const safe = await redactEvent(event, options)
      await inner.on(safe)
    },
  }
}
