---
'@agentskit/core': minor
'@agentskit/adapters': minor
---

Adapters now advertise their capabilities, and a `simulateStream` helper lets you wrap non-streaming endpoints transparently.

## Capabilities

`AdapterFactory` gained an optional `capabilities` field describing what the adapter can do:

```ts
interface AdapterCapabilities {
  streaming?: boolean
  tools?: boolean
  reasoning?: boolean       // o1 / o3 / Claude-level reasoning stream
  multiModal?: boolean
  structuredOutput?: boolean
  usage?: boolean            // token counts in chunk metadata
  extensions?: Record<string, unknown>
}
```

Additive, backwards-compatible — adapters without `capabilities` stay compliant with ADR 0001. Consumers that care (router adapters, UI toggles for tools, etc.) can read the hints.

Built-in adapters now advertise:

| Adapter | streaming | tools | reasoning | multiModal | usage |
|---|---|---|---|---|---|
| `openai` | ✓ | ✓ | ✓ (o1/o3 only) | ✓ (gpt-4/o) | ✓ |
| `anthropic` | ✓ | ✓ | ✓ (sonnet/opus) | ✓ | ✓ |
| `gemini` | ✓ | ✓ | — | ✓ | ✓ |
| `ollama` | ✓ | — | — | ✓ (llava/vision) | — |
| `mockAdapter` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `vercelAI` | (unknown — provider-dependent) |

## `simulateStream` for non-streaming providers

```ts
import { simulateStream } from '@agentskit/adapters'

// Wrap any one-shot endpoint so consumers see a streaming shape
const source = simulateStream(
  signal => fetch('https://my-legacy-api/respond', { signal }),
  async res => (await res.json()).text,
  'MyAPI',
  { chunkSize: 40, delayMs: 10 },
)
```

Also exports `chunkText(text, targetSize)` for breaking text on whitespace boundaries.
