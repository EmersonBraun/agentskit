# @agentskit/skills

Ready-made skills (prompts + behavioral instructions) for [AgentsKit](https://github.com/EmersonBraun/agentskit) agents.

## Install

```bash
npm install @agentskit/skills
```

## Built-in skills

| Skill | Description | Tools | Delegates |
|-------|-------------|-------|-----------|
| `researcher` | Methodical web research with source cross-referencing | web_search | — |
| `coder` | Production-ready code with best practices | read_file, write_file, shell | — |
| `planner` | Task decomposition and specialist coordination | — | researcher, coder |
| `critic` | Constructive review for correctness and quality | read_file | — |
| `summarizer` | Concise summaries preserving nuance | — | — |

## Quick example

```ts
import { createRuntime } from '@agentskit/runtime'
import { openai } from '@agentskit/adapters'
import { researcher } from '@agentskit/skills'
import { webSearch } from '@agentskit/tools'

const runtime = createRuntime({
  adapter: openai({ apiKey, model: 'gpt-4o' }),
  tools: [webSearch()],
})

const result = await runtime.run('Research quantum computing advances in 2025', {
  skill: researcher,
})
```

## Compose skills

```ts
import { composeSkills, researcher, coder } from '@agentskit/skills'

const researchAndCode = composeSkills(researcher, coder)
// Merges prompts, tools, delegates, examples
```

## Discover skills

```ts
import { listSkills } from '@agentskit/skills'

listSkills()
// → [{ name, description, tools, delegates }, ...]
```

## Docs

[Full documentation](https://emersonbraun.github.io/agentskit/)
