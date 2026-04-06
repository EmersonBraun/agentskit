import { ChatContainer, InputBar, Message, useChat } from '@agentskit/react'
import type { AdapterFactory } from '@agentskit/react'
import { planner } from '@agentskit/skills'
// @ts-expect-error CSS side-effect import has no type declarations
import '@agentskit/react/theme'

let callCount = 0

function createMultiAgentDemoAdapter(): AdapterFactory {
  return {
    createSource: () => {
      let cancelled = false
      const isFirstCall = callCount === 0
      callCount++

      return {
        stream: async function* () {
          if (isFirstCall) {
            // First call: simulate planner delegating to researcher and coder
            const chunks = [
              { type: 'text' as const, content: '## Plan\n\n' },
              { type: 'text' as const, content: '1. **Research** (→ researcher): Investigate best practices\n' },
              { type: 'text' as const, content: '2. **Implement** (→ coder): Write the code\n' },
              { type: 'text' as const, content: '3. **Review**: Verify the output\n\n' },
              { type: 'text' as const, content: '---\n\n' },
              { type: 'text' as const, content: '### Step 1: Research (delegated to researcher)\n' },
              { type: 'text' as const, content: 'Found 3 relevant patterns for this task.\n\n' },
              { type: 'text' as const, content: '### Step 2: Implementation (delegated to coder)\n' },
              { type: 'text' as const, content: 'Code has been written following the identified patterns.\n\n' },
              { type: 'text' as const, content: '### Summary\n' },
              { type: 'text' as const, content: 'Task completed successfully with researcher and coder collaboration.' },
              { type: 'done' as const },
            ]

            for (const chunk of chunks) {
              if (cancelled) return
              await new Promise(resolve => setTimeout(resolve, 60))
              yield chunk
            }
          } else {
            // Subsequent calls: regular planning responses
            const response = [
              '## Plan\n\n',
              'Breaking down your request into steps:\n\n',
              '1. **Analyze** (→ researcher): Gather context and requirements\n',
              '2. **Design** (→ coder): Draft the solution architecture\n',
              '3. **Execute** (→ coder): Implement the solution\n\n',
              '---\n\n',
              'Each step has been delegated to the appropriate specialist agent.\n',
              'Results are reviewed and integrated by the planner before delivery.',
            ]

            for (const part of response) {
              if (cancelled) return
              await new Promise(resolve => setTimeout(resolve, 60))
              yield { type: 'text' as const, content: part }
            }

            yield { type: 'done' as const }
          }
        },
        abort: () => {
          cancelled = true
        },
      }
    },
  }
}

export function App() {
  const chat = useChat({
    adapter: createMultiAgentDemoAdapter(),
    systemPrompt: planner.systemPrompt,
  })

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">AgentsKit Multi-Agent Example</p>
        <h1>Planner-driven multi-agent delegation</h1>
        <p className="lede">
          This demo uses the <code>planner</code> skill from{' '}
          <code>@agentskit/skills</code> to simulate a coordinator agent that breaks tasks into
          steps and delegates to <strong>researcher</strong> and <strong>coder</strong>{' '}
          specialists. No API keys required.
        </p>
        <div className="agent-badges">
          <span className="badge badge--planner">Planner</span>
          <span className="badge-arrow">delegates to</span>
          <span className="badge badge--researcher">Researcher</span>
          <span className="badge-sep">+</span>
          <span className="badge badge--coder">Coder</span>
        </div>
      </section>

      <section className="chat-card">
        <ChatContainer className="chat-surface">
          {chat.messages.map(message => (
            <Message key={message.id} message={message} />
          ))}
          <InputBar chat={chat} placeholder="Give the planner a task to delegate..." />
        </ChatContainer>
      </section>
    </main>
  )
}
