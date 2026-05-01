import { defineTool } from '@agentskit/core'

export interface TwilioConfig {
  accountSid: string
  authToken: string
  /** Default `from` number in E.164 format (e.g. `+14155551234`). */
  fromNumber: string
  baseUrl?: string
  fetch?: typeof globalThis.fetch
}

const E164 = /^\+[1-9]\d{6,14}$/

function assertE164(label: string, value: string): void {
  if (!E164.test(value)) {
    throw new Error(`twilio: ${label} must be E.164 (e.g. +14155551234), got "${value}"`)
  }
}

export function twilioSendSms(config: TwilioConfig) {
  assertE164('fromNumber', config.fromNumber)
  const fetchImpl = config.fetch ?? globalThis.fetch
  const baseUrl = config.baseUrl ?? 'https://api.twilio.com'
  const auth = `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`

  return defineTool({
    name: 'twilio_send_sms',
    description: 'Send an SMS via Twilio. Returns Twilio message SID + status.',
    schema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient phone number in E.164 format.' },
        body: { type: 'string', description: 'Message body (max 1600 chars; Twilio segments at 160).' },
        from: { type: 'string', description: 'Override sender number (E.164). Defaults to the config fromNumber.' },
      },
      required: ['to', 'body'],
    } as const,
    async execute({ to, body, from }) {
      assertE164('to', String(to))
      const sender = from ? String(from) : config.fromNumber
      assertE164('from', sender)

      const params = new URLSearchParams({ To: String(to), From: sender, Body: String(body) })
      const url = `${baseUrl}/2010-04-01/Accounts/${config.accountSid}/Messages.json`
      const response = await fetchImpl(url, {
        method: 'POST',
        headers: { 'Authorization': auth, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })
      const data = await response.json() as { sid?: string; status?: string; message?: string; code?: number }
      if (!response.ok) {
        throw new Error(`twilio: ${data.code ?? response.status} ${data.message ?? 'request failed'}`)
      }
      return { sid: data.sid, status: data.status }
    },
  })
}

export function twilio(config: TwilioConfig) {
  return [twilioSendSms(config)]
}
