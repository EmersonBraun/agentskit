---
'@agentskit/observability': minor
---

New `costGuard` observer — enforce a dollar budget per run.

```ts
import { createRuntime } from '@agentskit/runtime'
import { costGuard } from '@agentskit/observability'

const controller = new AbortController()

const runtime = createRuntime({
  adapter,
  observers: [
    costGuard({
      budgetUsd: 0.10,
      controller,
      onCost: ({ costUsd, budgetRemainingUsd }) =>
        process.stdout.write(`\r$${costUsd.toFixed(4)} (remaining $${budgetRemainingUsd.toFixed(4)})`),
    }),
  ],
})

try {
  await runtime.run('long task', { signal: controller.signal })
} catch (err) {
  if ((err as Error).name === 'AbortError') {
    console.log('Aborted due to cost budget.')
  }
}
```

- Reads token usage from `llm:end` events and computes cost per [provider pricing](../packages/observability/src/cost-guard.ts) with a built-in `DEFAULT_PRICES` table (OpenAI, Anthropic, Gemini, Ollama free tier).
- Aborts via your `AbortController` when the budget is exceeded — the runtime picks it up via RT13 (prompt + clean abort).
- Reset counters between runs: `guard.reset()`.
- Override prices per-call: `costGuard({ prices: { 'my-model': { input: 0.1, output: 0.2 } } })`.
- Also exports the pieces individually: `priceFor(model)`, `computeCost(usage, price)`, `DEFAULT_PRICES`.

The `onExceeded` callback fires exactly once even if more events arrive after the budget is blown — safe for audit logs and quota trackers.
