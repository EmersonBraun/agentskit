import { describe, it, expect, vi } from 'vitest'
import {
  twilio,
  twilioSendSms,
  pagerduty,
  pagerdutyTrigger,
  pagerdutyAcknowledge,
  pagerdutyResolve,
  pagerdutyOncall,
  stripeWebhookTool,
  verifyStripeSignature,
  cloudflareR2,
  postgresWithRoles,
} from '../src/integrations/index'
import { createHmac } from 'node:crypto'

function fakeFetch(impl: (url: string, init: RequestInit) => Response | Promise<Response>): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
    impl(String(input), init ?? {})
  ) as unknown as typeof fetch
}

describe('twilioSendSms', () => {
  it('rejects non-E.164 fromNumber at construction', () => {
    expect(() => twilio({ accountSid: 'AC1', authToken: 't', fromNumber: '5551234' })).toThrow(/E\.164/)
  })

  it('rejects non-E.164 to', async () => {
    const fetchMock = fakeFetch(() => new Response('{}', { status: 200 }))
    const tool = twilioSendSms({ accountSid: 'AC1', authToken: 't', fromNumber: '+14155551234', fetch: fetchMock })
    await expect(tool.execute({ to: '5551234', body: 'hi' })).rejects.toThrow(/E\.164/)
  })

  it('POSTs form-encoded body to Twilio Messages endpoint', async () => {
    let capturedUrl = ''
    let capturedBody = ''
    let capturedAuth = ''
    const fetchMock = fakeFetch((url, init) => {
      capturedUrl = url
      capturedBody = String(init.body)
      capturedAuth = (init.headers as Record<string, string>).Authorization
      return new Response(JSON.stringify({ sid: 'SM_test', status: 'queued' }), { status: 201 })
    })
    const tool = twilioSendSms({ accountSid: 'AC1', authToken: 'token', fromNumber: '+14155551234', fetch: fetchMock })
    const result = await tool.execute({ to: '+14155559999', body: 'hello' }) as { sid: string; status: string }
    expect(capturedUrl).toBe('https://api.twilio.com/2010-04-01/Accounts/AC1/Messages.json')
    expect(capturedBody).toContain('To=%2B14155559999')
    expect(capturedBody).toContain('From=%2B14155551234')
    expect(capturedBody).toContain('Body=hello')
    expect(capturedAuth.startsWith('Basic ')).toBe(true)
    expect(result.sid).toBe('SM_test')
  })

  it('twilio() returns the SMS tool', () => {
    const tools = twilio({ accountSid: 'AC1', authToken: 't', fromNumber: '+14155551234' })
    expect(tools.map(t => t.name)).toEqual(['twilio_send_sms'])
  })
})

describe('pagerduty', () => {
  it('trigger sends event_action: trigger to events endpoint', async () => {
    let captured: Record<string, unknown> = {}
    const fetchMock = fakeFetch((_url, init) => {
      captured = JSON.parse(String(init.body))
      return new Response(JSON.stringify({ status: 'success', dedup_key: 'k1' }), { status: 200 })
    })
    const tool = pagerdutyTrigger({ routingKey: 'r1', fetch: fetchMock })
    const result = await tool.execute({ summary: 'oops', source: 'api-1', severity: 'critical' }) as { dedup_key: string }
    expect(captured.event_action).toBe('trigger')
    expect(captured.routing_key).toBe('r1')
    expect((captured.payload as Record<string, unknown>).severity).toBe('critical')
    expect(result.dedup_key).toBe('k1')
  })

  it('acknowledge + resolve send the right event_action', async () => {
    const seen: string[] = []
    const fetchMock = fakeFetch((_url, init) => {
      seen.push(JSON.parse(String(init.body)).event_action)
      return new Response(JSON.stringify({ status: 'success' }), { status: 200 })
    })
    await pagerdutyAcknowledge({ routingKey: 'r1', fetch: fetchMock }).execute({ dedup_key: 'k1' })
    await pagerdutyResolve({ routingKey: 'r1', fetch: fetchMock }).execute({ dedup_key: 'k1' })
    expect(seen).toEqual(['acknowledge', 'resolve'])
  })

  it('throws on non-success status', async () => {
    const fetchMock = fakeFetch(() => new Response(JSON.stringify({ status: 'invalid', message: 'bad key' }), { status: 200 }))
    const tool = pagerdutyTrigger({ routingKey: 'r1', fetch: fetchMock })
    await expect(tool.execute({ summary: 'x', source: 's', severity: 'error' })).rejects.toThrow(/bad key/)
  })

  it('oncall requires apiToken', () => {
    expect(() => pagerdutyOncall({ routingKey: 'r1' }).execute({ schedule_id: 'S1' })).toThrow(/apiToken/)
  })

  it('pagerduty() omits oncall when apiToken is absent', () => {
    const tools = pagerduty({ routingKey: 'r1' })
    expect(tools.map(t => t.name)).toEqual([
      'pagerduty_trigger', 'pagerduty_acknowledge', 'pagerduty_resolve',
    ])
  })

  it('pagerduty() includes oncall when apiToken is set', () => {
    const tools = pagerduty({ routingKey: 'r1', apiToken: 't1' })
    expect(tools.map(t => t.name)).toContain('pagerduty_oncall')
  })
})

describe('stripeWebhookTool', () => {
  const SECRET = 'whsec_test'
  const NOW = 1_700_000_000

  function signedHeader(payload: string, t: number = NOW): string {
    const sig = createHmac('sha256', SECRET).update(`${t}.${payload}`, 'utf8').digest('hex')
    return `t=${t},v1=${sig}`
  }

  it('verifyStripeSignature accepts a valid signature', () => {
    const payload = '{"id":"evt_1","type":"charge.succeeded","created":1,"data":{"object":{}}}'
    const header = signedHeader(payload)
    expect(verifyStripeSignature(payload, header, SECRET, 300, () => NOW * 1000)).toBe(true)
  })

  it('verifyStripeSignature rejects when header is wrong', () => {
    const payload = '{}'
    expect(verifyStripeSignature(payload, 't=1,v1=deadbeef', SECRET, 300, () => NOW * 1000)).toBe(false)
  })

  it('verifyStripeSignature rejects when timestamp is outside tolerance', () => {
    const payload = '{}'
    const header = signedHeader(payload, NOW - 10_000)
    expect(verifyStripeSignature(payload, header, SECRET, 300, () => NOW * 1000)).toBe(false)
  })

  it('tool returns parsed event on valid signature', async () => {
    const payload = '{"id":"evt_1","type":"charge.succeeded","created":1700000000,"data":{"object":{"id":"ch_1","amount":100}}}'
    const header = signedHeader(payload)
    const tool = stripeWebhookTool({ secret: SECRET, toleranceSeconds: 9_999_999_999 })
    const result = await tool.execute({ payload, signature: header }) as {
      id: string; type: string; object: Record<string, unknown>
    }
    expect(result.id).toBe('evt_1')
    expect(result.type).toBe('charge.succeeded')
    expect((result.object as { id: string }).id).toBe('ch_1')
  })

  it('tool throws on invalid signature', async () => {
    const tool = stripeWebhookTool({ secret: SECRET })
    await expect(tool.execute({ payload: '{}', signature: 't=1,v1=bad' })).rejects.toThrow(/signature/)
  })
})

describe('cloudflareR2', () => {
  it('exposes get/put/list/delete', () => {
    const client = { send: vi.fn() }
    const tools = cloudflareR2({ client, bucket: 'b1' })
    const names = tools.map(t => t.name)
    expect(names).toEqual(['r2_get', 'r2_put', 'r2_list', 'r2_delete'])
  })

  it('includes signed-url tool when signGetUrl is provided', () => {
    const client = { send: vi.fn() }
    const tools = cloudflareR2({
      client,
      bucket: 'b1',
      signGetUrl: async () => 'https://signed.example/x',
    })
    expect(tools.map(t => t.name)).toContain('r2_signed_url')
  })

  it('signed-url tool calls signGetUrl with bucket + key + expiry', async () => {
    const sign = vi.fn(async () => 'https://signed.example/abc')
    const client = { send: vi.fn() }
    const tools = cloudflareR2({ client, bucket: 'b1', signGetUrl: sign })
    const signedTool = tools.find(t => t.name === 'r2_signed_url')!
    const result = await signedTool.execute({ key: 'a/b.txt', expiresIn: 600 }) as { url: string }
    expect(sign).toHaveBeenCalledWith({ Bucket: 'b1', Key: 'a/b.txt', expiresIn: 600 })
    expect(result.url).toBe('https://signed.example/abc')
  })
})

describe('postgresWithRoles', () => {
  const noopRows = async () => ({ rows: [], rowCount: 0 })

  it('exposes only postgres_read when writeClient is omitted', () => {
    const tools = postgresWithRoles({ readClient: noopRows })
    expect(tools.map(t => t.name)).toEqual(['postgres_read'])
  })

  it('exposes both postgres_read + postgres_write when writeClient is set', () => {
    const tools = postgresWithRoles({ readClient: noopRows, writeClient: noopRows })
    expect(tools.map(t => t.name)).toEqual(['postgres_read', 'postgres_write'])
  })

  it('postgres_read refuses INSERT', async () => {
    const [read] = postgresWithRoles({ readClient: noopRows })
    await expect(read.execute({ sql: "INSERT INTO t VALUES (1)" })).rejects.toThrow(/INSERT/)
  })

  it('postgres_write allows INSERT', async () => {
    const tools = postgresWithRoles({ readClient: noopRows, writeClient: noopRows })
    const write = tools[1]!
    await expect(write.execute({ sql: "INSERT INTO t VALUES (1)", params: [] })).resolves.toBeDefined()
  })

  it('uses readClient for postgres_read and writeClient for postgres_write', async () => {
    const readSpy = vi.fn(async () => ({ rows: [{ x: 1 }], rowCount: 1 }))
    const writeSpy = vi.fn(async () => ({ rows: [], rowCount: 1 }))
    const [read, write] = postgresWithRoles({ readClient: readSpy, writeClient: writeSpy })
    await read.execute({ sql: 'SELECT 1', params: [] })
    await write!.execute({ sql: 'UPDATE t SET x = 1', params: [] })
    expect(readSpy).toHaveBeenCalledTimes(1)
    expect(writeSpy).toHaveBeenCalledTimes(1)
  })
})
