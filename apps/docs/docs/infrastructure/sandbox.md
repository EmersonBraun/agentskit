---
sidebar_position: 2
---

# Sandbox

`@agentskit/sandbox` lets agents execute untrusted code safely. It ships with an E2B integration and a `SandboxBackend` interface for custom runtimes.

## Installation

```bash
npm install @agentskit/sandbox
```

## Creating a Sandbox

```ts
import { createSandbox } from '@agentskit/sandbox'

const sandbox = createSandbox()
```

By default the sandbox uses the E2B backend. Pass a custom backend to override.

## Executing Code

```ts
const result = await sandbox.execute(`print("hello")`, {
  language: 'python',
  timeout: 10_000,  // ms — overrides the 30s default
  maxMemoryMb: 25,  // overrides the 50 MB default
})

console.log(result.stdout)  // "hello\n"
console.log(result.stderr)  // ""
console.log(result.exitCode) // 0
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `language` | `'js' \| 'python'` | `'js'` | Runtime to use |
| `timeout` | `number` | `30000` | Max execution time in ms |
| `maxMemoryMb` | `number` | `50` | Memory cap in MB |
| `network` | `boolean` | `false` | Allow outbound network access |

## Security Defaults

Every sandbox session runs with conservative defaults:

- **No network access** — outbound connections are blocked unless `network: true`
- **30-second timeout** — long-running code is killed automatically
- **50 MB memory cap** — prevents memory exhaustion attacks
- **Isolated filesystem** — each session gets a clean ephemeral directory

## Language Support

| Language | Identifier | Runtime |
|----------|-----------|---------|
| JavaScript / Node.js | `'js'` | Node 20 |
| Python | `'python'` | Python 3.12 |

## Using Sandbox as a Tool

`sandboxTool()` wraps the sandbox in an AgentsKit-compatible tool so agents can execute code during a run:

```ts
import { createAgent } from '@agentskit/core'
import { createSandbox, sandboxTool } from '@agentskit/sandbox'

const sandbox = createSandbox()

const agent = createAgent({
  adapter,
  tools: [sandboxTool(sandbox)],
})
```

The agent can now call `run_code` during inference. The tool accepts `language` and `code` parameters and returns `stdout`, `stderr`, and `exitCode`.

## Custom Backends

Implement `SandboxBackend` to bring your own execution environment:

```ts
import type { SandboxBackend, ExecuteOptions, ExecuteResult } from '@agentskit/sandbox'

const myBackend: SandboxBackend = {
  async execute(code: string, options: ExecuteOptions): Promise<ExecuteResult> {
    // spin up your container, VM, or WASM runtime
    return { stdout: '', stderr: '', exitCode: 0 }
  },
  async dispose() {
    // clean up resources
  },
}

const sandbox = createSandbox({ backend: myBackend })
```

## E2B Integration

The default backend uses [E2B](https://e2b.dev) cloud sandboxes. Set your API key before creating a sandbox:

```ts
const sandbox = createSandbox({
  e2b: { apiKey: process.env.E2B_API_KEY },
})
```

E2B sessions are reused across `execute` calls and automatically cleaned up when `sandbox.dispose()` is called.

```ts
// Always dispose when done to avoid idle billing
await sandbox.dispose()
```

## Related

- [Observability](./observability.md) — trace sandbox execution alongside agent runs
- [Eval](./eval.md) — use sandboxed execution in evaluation test cases
