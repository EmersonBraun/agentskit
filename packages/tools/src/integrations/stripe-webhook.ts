import { createHmac, timingSafeEqual } from 'node:crypto'
import { ErrorCodes, ToolError, defineTool } from '@agentskit/core'

export interface StripeWebhookConfig {
  /** Endpoint signing secret from the Stripe dashboard (`whsec_...`). */
  secret: string
  /** Tolerance for the t= timestamp, in seconds. Defaults to 300 (5 min). */
  toleranceSeconds?: number
}

interface ParsedSignature {
  timestamp: number
  signatures: string[]
}

function parseSigHeader(header: string): ParsedSignature | null {
  let timestamp = 0
  const signatures: string[] = []
  for (const part of header.split(',')) {
    const [k, v] = part.split('=', 2)
    if (k === 't' && v) timestamp = Number(v)
    else if (k === 'v1' && v) signatures.push(v)
  }
  return Number.isFinite(timestamp) && timestamp > 0 && signatures.length > 0
    ? { timestamp, signatures }
    : null
}

function constantTimeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

export function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string,
  toleranceSeconds = 300,
  now: () => number = Date.now,
): boolean {
  const parsed = parseSigHeader(header)
  if (!parsed) return false
  const ageSeconds = Math.abs(now() / 1000 - parsed.timestamp)
  if (ageSeconds > toleranceSeconds) return false
  const expected = createHmac('sha256', secret)
    .update(`${parsed.timestamp}.${payload}`, 'utf8')
    .digest('hex')
  return parsed.signatures.some(sig => constantTimeCompare(sig, expected))
}

interface StripeEvent {
  id: string
  type: string
  created: number
  data: { object: Record<string, unknown> }
}

/**
 * Verify a Stripe webhook signature and return the parsed event. The agent
 * should NEVER receive an event whose signature didn't verify — call this
 * tool first in the webhook flow.
 */
export function stripeWebhookTool(config: StripeWebhookConfig) {
  const tolerance = config.toleranceSeconds ?? 300
  return defineTool({
    name: 'stripe_webhook_verify',
    description: 'Verify a Stripe webhook signature and return the parsed event. Throws on invalid signature or expired timestamp.',
    schema: {
      type: 'object',
      properties: {
        payload: { type: 'string', description: 'Raw request body as received (string, not JSON-parsed).' },
        signature: { type: 'string', description: 'Value of the Stripe-Signature header.' },
      },
      required: ['payload', 'signature'],
    } as const,
    async execute({ payload, signature }) {
      const ok = verifyStripeSignature(String(payload), String(signature), config.secret, tolerance)
      if (!ok) {
        throw new ToolError({
          code: ErrorCodes.AK_TOOL_INVALID_INPUT,
          message: 'stripe: webhook signature verification failed',
          hint: 'Check secret matches the endpoint and that the raw body is unparsed.',
        })
      }
      const event = JSON.parse(String(payload)) as StripeEvent
      return {
        id: event.id,
        type: event.type,
        created: event.created,
        object: event.data.object,
      }
    },
  })
}
