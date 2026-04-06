---
sidebar_position: 1
---

# Observability

`@agentskit/observability` provides pluggable tracing and logging for AgentsKit agents. All observers are lazy-loaded — only the code you use is bundled.

## Installation

```bash
npm install @agentskit/observability
```

## Built-in Observers

### Console Logger

Logs agent events to the terminal in human-readable or structured JSON format.

```ts
import { consoleLogger } from '@agentskit/observability'

const logger = consoleLogger({ format: 'human' }) // or 'json'
```

**Human format** prints colored, indented output for local development. **JSON format** emits newline-delimited JSON suitable for log aggregation pipelines.

### LangSmith

Sends a full trace hierarchy to LangSmith, including nested runs, token usage, and latency.

```ts
import { langsmith } from '@agentskit/observability'

const observer = langsmith({
  apiKey: process.env.LANGSMITH_API_KEY,
  project: 'my-agent',
})
```

Each agent run becomes a root trace in LangSmith. Tool calls, retrieval steps, and sub-agent invocations are recorded as child runs, preserving the full call hierarchy.

### OpenTelemetry

Exports spans using the [GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) over OTLP.

```ts
import { opentelemetry } from '@agentskit/observability'

const observer = opentelemetry({
  endpoint: 'http://localhost:4318/v1/traces', // OTLP HTTP endpoint
  serviceName: 'my-agent-service',
})
```

Spans include `gen_ai.system`, `gen_ai.request.model`, `gen_ai.usage.input_tokens`, and `gen_ai.usage.output_tokens` attributes. Compatible with Jaeger, Tempo, Honeycomb, and any OTLP-capable backend.

## Shared Span Management

`createTraceTracker` coordinates span context across multiple observers, ensuring parent–child relationships are consistent even when several observers run in parallel.

```ts
import { createTraceTracker } from '@agentskit/observability'

const tracker = createTraceTracker()

agent.use(tracker.middleware())
```

Use this when combining multiple observers so span IDs propagate correctly.

## Custom Observers

Implement the observer interface to integrate any tracing backend:

```ts
import type { Observer } from '@agentskit/observability'

const myObserver: Observer = {
  name: 'my-backend',
  on(event) {
    if (event.type === 'run:start') {
      myBackend.startTrace({ id: event.runId, input: event.input })
    }
    if (event.type === 'run:end') {
      myBackend.endTrace({ id: event.runId, output: event.output })
    }
  },
}
```

### Observer Events

| Event | Payload |
|-------|---------|
| `run:start` | `{ runId, input, metadata }` |
| `run:end` | `{ runId, output, tokenUsage, durationMs }` |
| `tool:start` | `{ runId, toolName, args }` |
| `tool:end` | `{ runId, toolName, result, durationMs }` |
| `error` | `{ runId, error }` |

## Attaching Observers to an Agent

```ts
import { createAgent } from '@agentskit/core'
import { consoleLogger, langsmith } from '@agentskit/observability'

const agent = createAgent({
  adapter,
  observers: [
    consoleLogger({ format: 'human' }),
    langsmith({ apiKey: process.env.LANGSMITH_API_KEY }),
  ],
})
```

Multiple observers can run side-by-side; events are dispatched to all of them.

## Related

- [Eval](./eval.md) — measure agent quality with structured test suites
- [Runtime](../agents/runtime.md) — agent configuration and lifecycle
