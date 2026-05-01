import { defineTool, type ToolDefinition } from '@agentskit/core'
import { httpJson, type HttpToolOptions } from './http'

export interface PagerDutyConfig extends HttpToolOptions {
  /** Integration / routing key (Events API v2). Required for trigger/ack/resolve. */
  routingKey: string
  /** REST API token, required only for schedule queries. */
  apiToken?: string
}

const EVENTS_BASE = 'https://events.pagerduty.com'
const REST_BASE = 'https://api.pagerduty.com'

function eventsOpts(config: PagerDutyConfig): HttpToolOptions {
  return {
    baseUrl: config.baseUrl ?? EVENTS_BASE,
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    timeoutMs: config.timeoutMs,
    fetch: config.fetch,
  }
}

function restOpts(config: PagerDutyConfig): HttpToolOptions {
  if (!config.apiToken) throw new Error('pagerduty: apiToken required for REST queries')
  return {
    baseUrl: REST_BASE,
    headers: {
      'authorization': `Token token=${config.apiToken}`,
      'accept': 'application/vnd.pagerduty+json;version=2',
    },
    timeoutMs: config.timeoutMs,
    fetch: config.fetch,
  }
}

export function pagerdutyTrigger(config: PagerDutyConfig) {
  const opts = eventsOpts(config)
  return defineTool({
    name: 'pagerduty_trigger',
    description: 'Trigger a PagerDuty incident via the Events API v2.',
    schema: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'Short human-readable summary.' },
        source: { type: 'string', description: 'Affected component / host.' },
        severity: { type: 'string', enum: ['critical', 'error', 'warning', 'info'] },
        dedup_key: { type: 'string', description: 'Idempotency / dedup key to ack/resolve later.' },
      },
      required: ['summary', 'source', 'severity'],
    } as const,
    async execute({ summary, source, severity, dedup_key }) {
      const result = await httpJson<{ status: string; dedup_key?: string; message?: string }>(opts, {
        method: 'POST',
        path: '/v2/enqueue',
        body: {
          routing_key: config.routingKey,
          event_action: 'trigger',
          dedup_key,
          payload: { summary, source, severity },
        },
      })
      if (result.status !== 'success') throw new Error(`pagerduty: ${result.message ?? 'trigger failed'}`)
      return { dedup_key: result.dedup_key }
    },
  })
}

function eventActionTool(config: PagerDutyConfig, action: 'acknowledge' | 'resolve') {
  const opts = eventsOpts(config)
  return defineTool({
    name: `pagerduty_${action}`,
    description: `${action[0].toUpperCase() + action.slice(1)} a PagerDuty incident by dedup_key.`,
    schema: {
      type: 'object',
      properties: {
        dedup_key: { type: 'string', description: 'The dedup key returned by pagerduty_trigger.' },
      },
      required: ['dedup_key'],
    } as const,
    async execute({ dedup_key }) {
      const result = await httpJson<{ status: string; message?: string }>(opts, {
        method: 'POST',
        path: '/v2/enqueue',
        body: {
          routing_key: config.routingKey,
          event_action: action,
          dedup_key,
        },
      })
      if (result.status !== 'success') throw new Error(`pagerduty: ${result.message ?? `${action} failed`}`)
      return { ok: true }
    },
  })
}

export function pagerdutyAcknowledge(config: PagerDutyConfig) {
  return eventActionTool(config, 'acknowledge')
}

export function pagerdutyResolve(config: PagerDutyConfig) {
  return eventActionTool(config, 'resolve')
}

export function pagerdutyOncall(config: PagerDutyConfig) {
  const opts = restOpts(config)
  return defineTool({
    name: 'pagerduty_oncall',
    description: 'Look up the current on-call user for a PagerDuty schedule.',
    schema: {
      type: 'object',
      properties: {
        schedule_id: { type: 'string', description: 'Schedule ID.' },
      },
      required: ['schedule_id'],
    } as const,
    async execute({ schedule_id }) {
      const result = await httpJson<{
        users?: Array<{ id: string; name: string; email: string }>
      }>(opts, {
        method: 'GET',
        path: `/schedules/${schedule_id}/users`,
        query: { since: new Date().toISOString(), until: new Date(Date.now() + 60_000).toISOString() },
      })
      const user = result.users?.[0]
      return user ? { id: user.id, name: user.name, email: user.email } : null
    },
  })
}

export function pagerduty(config: PagerDutyConfig): ToolDefinition[] {
  const tools: ToolDefinition[] = [
    pagerdutyTrigger(config) as unknown as ToolDefinition,
    pagerdutyAcknowledge(config) as unknown as ToolDefinition,
    pagerdutyResolve(config) as unknown as ToolDefinition,
  ]
  if (config.apiToken) tools.push(pagerdutyOncall(config) as unknown as ToolDefinition)
  return tools
}
