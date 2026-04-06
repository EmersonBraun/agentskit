---
sidebar_position: 2
---

# Tools

`@agentskit/tools` provides ready-made tool definitions for web search, filesystem access, and shell execution. Pass them to `createRuntime` or any `runtime.run()` call.

## Install

```bash
npm install @agentskit/tools
```

## `webSearch`

Search the web and return titles, URLs, and snippets.

**Default provider:** DuckDuckGo (no API key required).

```ts
import { createRuntime } from '@agentskit/runtime'
import { webSearch } from '@agentskit/tools'
import { anthropic } from '@agentskit/adapters'

const runtime = createRuntime({
  adapter: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, model: 'claude-sonnet-4-6' }),
  tools: [webSearch()],
})

const result = await runtime.run('Who won the 2024 Nobel Prize in Physics?')
```

### Serper (Google results)

```ts
webSearch({ provider: 'serper', apiKey: process.env.SERPER_API_KEY, maxResults: 8 })
```

### Bring your own search (BYOS)

Provide a custom `search` function to use any backend:

```ts
webSearch({
  search: async (query) => {
    const hits = await mySearchClient.query(query)
    return hits.map(h => ({ title: h.title, url: h.href, snippet: h.body }))
  },
})
```

### Schema

```json
{
  "name": "web_search",
  "description": "Search the web for information. Returns titles, URLs, and snippets.",
  "schema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "The search query" }
    },
    "required": ["query"]
  }
}
```

## `filesystem`

Read, write, and list files within a sandboxed `basePath`. All paths passed by the model are resolved relative to `basePath`; any attempt to escape it throws an access-denied error.

```ts
import { filesystem } from '@agentskit/tools'

const fsTools = filesystem({ basePath: '/tmp/workspace' })
// Returns: [read_file, write_file, list_directory]
```

Pass the array directly to the runtime:

```ts
const runtime = createRuntime({
  adapter: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, model: 'claude-sonnet-4-6' }),
  tools: fsTools,
})
```

### `read_file`

```json
{
  "name": "read_file",
  "description": "Read the contents of a file. Path is relative to the workspace.",
  "schema": {
    "type": "object",
    "properties": {
      "path": { "type": "string", "description": "File path relative to workspace" }
    },
    "required": ["path"]
  }
}
```

### `write_file`

```json
{
  "name": "write_file",
  "description": "Write content to a file. Creates the file if it does not exist.",
  "schema": {
    "type": "object",
    "properties": {
      "path":    { "type": "string", "description": "File path relative to workspace" },
      "content": { "type": "string", "description": "Content to write" }
    },
    "required": ["path", "content"]
  }
}
```

### `list_directory`

```json
{
  "name": "list_directory",
  "description": "List files and directories at a path.",
  "schema": {
    "type": "object",
    "properties": {
      "path": { "type": "string", "description": "Directory path relative to workspace (default: root)" }
    }
  }
}
```

## `shell`

Execute shell commands from inside the agent. Use the `allowed` list to restrict which commands the model may run.

```ts
import { shell } from '@agentskit/tools'

// Allow only git and npm
const shellTool = shell({
  allowed: ['git', 'npm'],
  timeout: 15_000,
})
```

### Config

| Option     | Type       | Default      | Description                                          |
| ---------- | ---------- | ------------ | ---------------------------------------------------- |
| `timeout`  | `number`   | `30_000` ms  | Kill the process after this many milliseconds        |
| `allowed`  | `string[]` | _(any)_      | Whitelist of command names (first word of the input) |
| `maxOutput`| `number`   | `1_000_000`  | Maximum bytes captured from stdout + stderr          |

### Schema

```json
{
  "name": "shell",
  "description": "Execute a shell command. Returns stdout, stderr, and exit code.",
  "schema": {
    "type": "object",
    "properties": {
      "command": { "type": "string", "description": "The shell command to execute" }
    },
    "required": ["command"]
  }
}
```

The tool always returns a string ending with `[exit code: N]` or `[killed: command timed out after Nms]`.

## `listTools`

Discover all available tools and their metadata at runtime — useful for building dashboards or validating skill hints.

```ts
import { listTools } from '@agentskit/tools'

const tools = listTools()
// [
//   { name: 'web_search', description: '...', tags: ['web', 'search'], category: 'retrieval', schema: {...} },
//   { name: 'read_file', ... },
//   { name: 'write_file', ... },
//   { name: 'list_directory', ... },
//   { name: 'shell', ... },
// ]
```

Each entry is a `ToolMetadata` object:

```ts
interface ToolMetadata {
  name: string
  description: string
  tags: string[]
  category: string
  schema: JSONSchema7
}
```

## Related

- [Runtime](./runtime.md) — how tools are executed inside the ReAct loop
- [Skills](./skills.md) — role-based `tools` hints that filter the active tool set
