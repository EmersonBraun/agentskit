'use client'

import { useMemo } from 'react'
import { useChat, ChatContainer, Message, InputBar } from '@agentskit/react'
import '@/styles/agentskit-theme.css'
import { createMockAdapter, initialAssistant, toolsFor } from './_shared/mock-adapter'
import { ToolBadge } from './_shared/tool-badge'
import { IntegrationCard } from '@/app/(home)/_components/hero-demo/widgets'

const TURNS = [
  {
    toolCalls: [
      {
        name: 'slack_send',
        args: { channel: '#product', text: 'launch update — agentskit v0.3' },
        result: { ok: true, ts: '1714612812.001' },
        durationMs: 600,
      },
    ],
    text: 'Posted to #product. 1 reaction so far.',
  },
  {
    toolCalls: [
      {
        name: 'github_create_issue',
        args: { repo: 'agentskit/agentskit', title: 'docs: add showcase tags' },
        result: { number: 142, url: 'github.com/agentskit/agentskit/issues/142' },
        durationMs: 700,
      },
    ],
    text: 'Filed issue #142. Linked to the docs label.',
  },
]

export function SlackIntegration() {
  const adapter = useMemo(() => createMockAdapter(TURNS), [])
  const tools = useMemo(() => toolsFor(TURNS), [])
  const chat = useChat({
    adapter,
    tools,
    maxToolIterations: 1,
    initialMessages: [
      initialAssistant(
        "I'm wired to Slack + GitHub via @agentskit/tools. Ask me to send a message or open an issue.",
      ),
    ],
  })

  return (
    <div
      data-ak-example
      className="flex h-[480px] flex-col overflow-hidden rounded-lg border border-ak-border bg-ak-surface"
    >
      <ChatContainer className="flex-1 space-y-2 p-4">
        {chat.messages
          .filter(m => m.role !== 'tool')
          .map(m => (
            <div key={m.id} className="flex flex-col gap-1.5">
              {m.toolCalls?.map(t => (
                <div key={t.id} className="flex flex-col gap-2">
                  <ToolBadge call={t} />
                  {t.status === 'complete' && t.name === 'slack_send' && <IntegrationCard />}
                </div>
              ))}
              {m.content ? <Message message={m} /> : null}
            </div>
          ))}
      </ChatContainer>
      <InputBar chat={chat} />
    </div>
  )
}
