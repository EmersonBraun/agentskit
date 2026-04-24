'use client'

import { useMemo } from 'react'
import type { AdapterFactory, StreamChunk, ToolDefinition } from '@agentskit/core'
import { useChat, ChatContainer, InputBar } from '@agentskit/react'
import '@/styles/agentskit-theme.css'
import { initialAssistant } from './_shared/mock-adapter'
import { ToolBadge } from './_shared/tool-badge'
import { MdRenderer } from './_shared/md-renderer'

/**
 * Narrative demo of a planner → researcher → drafter → reviewer topology.
 * One send cycles through four agent tools (each executed by the runtime)
 * then streams a composed markdown report showing every agent's contribution.
 */

type AgentTool = {
  name: string
  args: Record<string, unknown>
  result: unknown
  durationMs: number
}

const PLAN_TOOLS: AgentTool[] = [
  {
    name: 'planner.decompose',
    args: { goal: 'Launch announcement for AgentsKit 2.0' },
    result: {
      subtasks: [
        'Gather shipped features since 1.8',
        'Draft a punchy hero paragraph',
        'Bullet the top three developer wins',
        'Review tone + compliance',
      ],
    },
    durationMs: 420,
  },
  {
    name: 'researcher.search',
    args: { query: 'AgentsKit 2.0 changelog highlights' },
    result: {
      hits: 8,
      highlights: [
        'New shared-state hooks (useFramework / useProvider / useMemory)',
        '19 provider adapters, 10 memory backends',
        'First-class tool_call streaming + confirmation gates',
      ],
    },
    durationMs: 560,
  },
  {
    name: 'drafter.compose',
    args: { tone: 'confident-but-chill' },
    result: { words: 142, sections: 3 },
    durationMs: 640,
  },
  {
    name: 'reviewer.critique',
    args: { target: 'draft-v1' },
    result: { verdict: 'approved', edits: ['tighten the CTA line', 'drop the "very"'] },
    durationMs: 380,
  },
]

const FINAL_REPORT = `### Draft ready

> Shipped by the planner → researcher → drafter → reviewer topology.

**Title.** AgentsKit 2.0 — the agent toolkit JavaScript actually deserves.

**Hero.** AgentsKit 2.0 is the biggest release since launch. One mental model, 19 providers, 10 memory backends, and a shared-state layer so your stack selector, docs, and IDE agree on what you picked.

**Top wins**

1. **Shared stack hooks** — \`useFramework\`, \`useProvider\`, \`useMemory\`, \`usePackageManager\` sync across every surface.
2. **Tool-first streaming** — \`tool_call\` chunks, confirmation gates, and live \`ToolBadge\` UI out of the box.
3. **Bring your own provider** — openai, anthropic, gemini, grok, groq, mistral, together, cohere, deepseek, fireworks, huggingface, kimi, llamacpp, lm-studio, vllm, langchain, vercel-ai.

**Reviewer notes.** Approved. Minor edits: tighten the CTA line, drop the \\"very\\". Shipping to the blog queue.

\`\`\`ts
// ship it
await publish('blog/agentskit-2-0.mdx', { status: 'scheduled' })
\`\`\``

const PLANNER_REASONING = `[planner] decompose the launch brief into research → draft → review.
[planner] hand research off to researcher with search scope "changelog since 1.8".
[planner] drafter gets the highlights + tone brief.
[planner] reviewer has final sign-off before queue.`

function createMultiAgentAdapter(): AdapterFactory {
  let phase: 'tools' | 'final' = 'tools'
  return {
    createSource: () => ({
      stream: async function* (): AsyncIterableIterator<StreamChunk> {
        if (phase === 'tools') {
          for (const ch of PLANNER_REASONING) {
            await sleep(10)
            yield { type: 'reasoning', content: ch }
          }
          for (const tool of PLAN_TOOLS) {
            yield {
              type: 'tool_call',
              toolCall: {
                id: `call-${tool.name}`,
                name: tool.name,
                args: JSON.stringify(tool.args),
              },
            }
          }
          phase = 'final'
          yield { type: 'done' }
          return
        }
        phase = 'tools'
        for (const ch of FINAL_REPORT) {
          await sleep(8)
          yield { type: 'text', content: ch }
        }
        yield { type: 'done' }
      },
      abort() {},
    }),
    capabilities: { streaming: true, tools: true, reasoning: true },
  }
}

function buildTools(): ToolDefinition[] {
  return PLAN_TOOLS.map<ToolDefinition>((t) => ({
    name: t.name,
    description: `Mock ${t.name}`,
    schema: {},
    async execute() {
      await sleep(t.durationMs)
      return JSON.stringify(t.result)
    },
  }))
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

export function MultiAgentChat() {
  const adapter = useMemo(() => createMultiAgentAdapter(), [])
  const tools = useMemo(() => buildTools(), [])
  const chat = useChat({
    adapter,
    tools,
    // Two passes: first streams reasoning + tool_calls, runtime executes the
    // four agent tools, then the adapter's second pass streams the final
    // composed markdown report.
    maxToolIterations: 2,
    initialMessages: [
      initialAssistant(
        'Planner → Researcher → Drafter → Reviewer. Ask me to draft something — you will see every hand-off live.',
      ),
    ],
  })

  return (
    <div
      data-ak-example
      className="flex h-[640px] flex-col overflow-hidden rounded-lg border border-ak-border bg-ak-surface"
    >
      <ChatContainer className="flex-1 space-y-3 p-4">
        {chat.messages
          .filter((m) => m.role !== 'tool')
          .map((m) => {
            const reasoning = (m.metadata?.reasoning as string | undefined) ?? null
            return (
              <div key={m.id} className="flex flex-col gap-2">
                {reasoning ? <ReasoningTrace text={reasoning} /> : null}
                {m.toolCalls?.map((t) => (
                  <ToolBadge key={t.id} call={t} />
                ))}
                {m.content ? (
                  <div
                    data-ak-message
                    data-ak-role={m.role}
                    className="rounded-lg bg-ak-midnight/40 p-3"
                  >
                    <MdRenderer content={m.content} />
                  </div>
                ) : null}
              </div>
            )
          })}
        {chat.status === 'streaming' ? (
          <div className="inline-flex items-center gap-2 font-mono text-[11px] text-ak-graphite">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-ak-blue" />
            agents coordinating…
          </div>
        ) : null}
      </ChatContainer>
      <InputBar chat={chat} />
    </div>
  )
}

function ReasoningTrace({ text }: { text: string }) {
  return (
    <details className="rounded border border-ak-border bg-ak-midnight/40 p-2 font-mono text-[11px] text-ak-graphite">
      <summary className="cursor-pointer uppercase tracking-widest">Planner reasoning</summary>
      <pre className="mt-2 whitespace-pre-wrap">{text}</pre>
    </details>
  )
}
