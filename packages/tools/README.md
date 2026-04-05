# @agentskit/tools

Reusable executable tools for [AgentsKit](https://github.com/EmersonBraun/agentskit) agents.

## Install

```bash
npm install @agentskit/tools
```

## Available tools

| Tool | Description |
|------|-------------|
| `web_search` | Search the web (DuckDuckGo default, configurable) |
| `read_file` | Read file contents (sandboxed to basePath) |
| `write_file` | Write to files (sandboxed to basePath) |
| `list_directory` | List directory contents (sandboxed to basePath) |
| `shell` | Execute shell commands with streaming output |

## Quick example

```ts
import { createRuntime } from '@agentskit/runtime'
import { openai } from '@agentskit/adapters'
import { webSearch, filesystem, shell } from '@agentskit/tools'

const runtime = createRuntime({
  adapter: openai({ apiKey, model: 'gpt-4o' }),
  tools: [
    webSearch(),
    ...filesystem({ basePath: './workspace' }),
    shell({ timeout: 10_000, allowed: ['ls', 'cat', 'grep'] }),
  ],
})

const result = await runtime.run('Find and summarize the README')
```

## Tool discovery

```ts
import { listTools } from '@agentskit/tools'

listTools()
// → [{ name, description, tags, category, schema }, ...]
```

## Custom search provider

```ts
// Serper (needs API key)
webSearch({ provider: 'serper', apiKey: '...' })

// Bring your own
webSearch({ search: async (query) => mySearchAPI(query) })
```

## Docs

[Full documentation](https://emersonbraun.github.io/agentskit/)
