---
sidebar_position: 4
---

# CLI

`@agentskit/cli` provides terminal commands for chatting with agents, scaffolding new projects, and running runtime agents without a UI.

## Installation

```bash
npm install -g @agentskit/cli
# or use without installing:
npx @agentskit/cli <command>
```

## Commands

### `agentskit chat`

Start an interactive chat session in the terminal.

```bash
agentskit chat [options]
```

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--provider` | `string` | `demo` | AI provider: `anthropic`, `openai`, `demo` |
| `--model` | `string` | Provider default | Model name, e.g. `claude-sonnet-4-6`, `gpt-4o` |
| `--tools` | `string[]` | `[]` | Tool names to enable, e.g. `--tools search calculator` |
| `--skill` | `string` | — | Load a pre-built skill by name, e.g. `--skill code-assistant` |
| `--memory-backend` | `string` | `in-memory` | Memory backend: `in-memory`, `redis`, `postgres` |

**Examples:**

```bash
# Chat with Claude using the code-assistant skill
agentskit chat --provider anthropic --model claude-sonnet-4-6 --skill code-assistant

# Chat with GPT-4o and specific tools
agentskit chat --provider openai --model gpt-4o --tools search calculator

# Use a persistent Redis memory backend
agentskit chat --provider anthropic --memory-backend redis
```

Provider API keys are read from environment variables (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`).

---

### `agentskit init`

Scaffold a new AgentsKit project from a template.

```bash
agentskit init [project-name] [options]
```

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--template` | `'react' \| 'ink'` | `react` | Project template to use |

**Templates:**

| Template | Description |
|----------|-------------|
| `react` | Browser chat app with `@agentskit/react` and Vite |
| `ink` | Terminal chat app with `@agentskit/ink` and Ink |

**Examples:**

```bash
# Create a React chat app
agentskit init my-chat-app --template react

# Create a terminal (Ink) app
agentskit init my-terminal-agent --template ink
```

After scaffolding, follow the printed instructions:

```bash
cd my-chat-app
npm install
npm run dev
```

---

### `agentskit run`

Execute a runtime agent script directly from the terminal without a UI. Useful for automation, batch jobs, and testing agents in CI.

```bash
agentskit run <file> [options]
```

| Flag | Type | Description |
|------|------|-------------|
| `--input` | `string` | Initial input to pass to the agent |
| `--output` | `'text' \| 'json'` | Output format (default: `text`) |

**Example:**

```bash
# Run an agent script with a prompt
agentskit run ./agents/summarizer.ts --input "Summarize the Q3 report"

# Emit JSON output for pipeline consumption
agentskit run ./agents/classifier.ts --input "Is this spam?" --output json
```

The agent file must export a default `AgentFn` or an AgentsKit agent instance:

```ts
// agents/summarizer.ts
import { createAgent } from '@agentskit/core'
import { anthropic } from '@agentskit/adapters'

export default createAgent({
  adapter: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
  system: 'You are a concise summarizer.',
})
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | API key for the Anthropic provider |
| `OPENAI_API_KEY` | API key for the OpenAI provider |
| `REDIS_URL` | Connection string for the Redis memory backend |
| `DATABASE_URL` | Connection string for the Postgres memory backend |

## Related

- [Quick Start](../getting-started/quick-start.md) — build your first agent
- [Eval](./eval.md) — use `agentskit run` in CI eval pipelines
- [Adapters overview](../adapters/overview.md) — available providers and models
