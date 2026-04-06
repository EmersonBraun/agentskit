# @agentskit/skills

Pre-tuned agent personas that work out of the box — skills are what your agent IS, tools are what it CAN DO.

## Why

- **Skip prompt engineering** — `researcher`, `coder`, `planner`, `critic`, and `summarizer` are battle-tested behavioral profiles; activate one and your agent immediately behaves like a specialist
- **Composable by design** — combine skills with `composeSkills` to merge prompts, tools, and delegates; build a research-and-code pipeline in one line
- **Multi-agent delegation built in** — the `planner` skill knows how to coordinate `researcher` and `coder` as sub-agents, so you get multi-agent workflows without writing orchestration code

## Install

```bash
npm install @agentskit/skills
```

## Quick example

```ts
import { createRuntime } from '@agentskit/runtime'
import { anthropic } from '@agentskit/adapters'
import { researcher, coder, composeSkills } from '@agentskit/skills'
import { webSearch, filesystem } from '@agentskit/tools'

const runtime = createRuntime({
  adapter: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-sonnet-4-6' }),
  tools: [webSearch(), ...filesystem({ basePath: './workspace' })],
})

const result = await runtime.run('Research best practices for TypeScript error handling and write an example', {
  skill: composeSkills(researcher, coder),
})
console.log(result.content)
```

## Docs

[Full documentation](https://emersonbraun.github.io/agentskit/)
