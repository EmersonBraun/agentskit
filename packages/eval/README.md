# @agentskit/eval

Measure agent quality with numbers, not vibes — ship with confidence.

## Why

- **Replace "it seemed to work" with real metrics** — accuracy, per-case latency, token cost, and pass/fail for every test case in a single result object
- **CI/CD ready** — exit codes reflect suite results; gate deployments on accuracy thresholds so regressions never reach production
- **Flexible assertions** — exact string matching, `includes` for LLM verbosity, or full control with a custom `(result) => boolean` function per case

## Install

```bash
npm install @agentskit/eval
```

## Quick example

```ts
import { runEval } from '@agentskit/eval'
import { createRuntime } from '@agentskit/runtime'
import { anthropic } from '@agentskit/adapters'

const runtime = createRuntime({
  adapter: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-sonnet-4-6' }),
})

const result = await runEval({
  agent: async (input) => {
    const r = await runtime.run(input)
    return r.content
  },
  suite: {
    name: 'qa-baseline',
    cases: [
      { input: 'What is 2+2?', expected: '4' },
      { input: 'Capital of France?', expected: 'Paris' },
      { input: 'Is TypeScript a superset of JavaScript?', expected: (r) => r.toLowerCase().includes('yes') },
    ],
  },
})

console.log(`Accuracy: ${(result.accuracy * 100).toFixed(1)}%`)
console.log(`Passed: ${result.passed}/${result.totalCases}`)
```

## Docs

[Full documentation](https://emersonbraun.github.io/agentskit/)
