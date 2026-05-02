'use client'

import { useEffect, useMemo, useState } from 'react'
import { createChatController } from '@agentskit/core'
import type {
  AdapterFactory,
  ChatController,
  ChatState,
  StreamChunk,
} from '@agentskit/core'

const REPLIES = [
  'Sunny saturday, showers sun → mon. Pack a light jacket.',
  '12 units in LAX warehouse, ships same-day.',
  'Three options under $320. Delta 06:15 is fastest nonstop.',
]

const inkAdapter: AdapterFactory = {
  capabilities: { streaming: true, tools: false },
  createSource: () => {
    let i = 0
    return {
      stream: async function* (): AsyncIterableIterator<StreamChunk> {
        const reply = REPLIES[i % REPLIES.length]
        i += 1
        for (const ch of reply) {
          await new Promise(r => setTimeout(r, 18))
          yield { type: 'text', content: ch }
        }
        yield { type: 'done' }
      },
      abort() {},
    }
  },
}

const PROMPTS = [
  'weather in tokyo this weekend',
  'inventory for sku h-42',
  'flights LAX to NYC tomorrow',
]

export function InkTerminal() {
  const controller: ChatController = useMemo(
    () => createChatController({ adapter: inkAdapter, initialMessages: [] }),
    [],
  )
  const [state, setState] = useState<ChatState>(controller.getState())
  const [idx, setIdx] = useState(0)

  useEffect(() => controller.subscribe(() => setState(controller.getState())), [controller])

  const send = () => {
    void controller.send(PROMPTS[idx % PROMPTS.length])
    setIdx(idx + 1)
  }

  const reset = () => {
    controller.setMessages([])
    setIdx(0)
  }

  const lines: Array<{ kind: 'user' | 'assistant'; text: string }> = []
  for (const m of state.messages) {
    if (m.role === 'user' || m.role === 'assistant') {
      lines.push({ kind: m.role, text: m.content })
    }
  }

  return (
    <div data-ak-example className="flex flex-col gap-3 rounded-lg border border-ak-border bg-ak-surface p-4">
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="text-ak-graphite">@agentskit/core · createChatController · same controller, terminal renderer</span>
        <span className="text-ak-graphite">@agentskit/ink uses this</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={send}
          disabled={state.status === 'streaming'}
          className="rounded-md bg-ak-blue/20 px-3 py-1.5 font-mono text-xs text-ak-blue disabled:opacity-50"
        >
          {state.status === 'streaming' ? 'streaming…' : '▶ send next prompt'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-ak-border px-3 py-1.5 font-mono text-xs text-ak-graphite"
        >
          reset
        </button>
        <span className="ml-auto font-mono text-[10px] text-ak-graphite">
          status: {state.status}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-ak-border bg-black shadow-lg">
        <div className="flex items-center justify-between border-b border-ak-border bg-ak-surface px-3 py-1.5">
          <div className="font-mono text-xs text-ak-foam">~/agentskit · ink · tty</div>
          <span className="font-mono text-[10px] text-ak-green">● {state.status === 'streaming' ? 'streaming' : 'idle'}</span>
        </div>
        <pre className="min-h-[180px] px-3 py-2 font-mono text-[11px] leading-relaxed">
          {lines.length === 0 && (
            <span className="text-[#a6adc8]">{'> waiting for input…'}</span>
          )}
          {lines.map((l, i) => (
            <span key={i}>
              {l.kind === 'user' ? (
                <span className="text-[#89b4fa]">› {l.text}{'\n'}</span>
              ) : (
                <span className="text-[#a6e3a1]">▎ {l.text}{'\n'}</span>
              )}
            </span>
          ))}
        </pre>
        <div className="border-t border-ak-border bg-ak-surface px-3 py-1.5 font-mono text-[10px] text-ak-graphite">
          messages: {state.messages.length} · controller drives both react + ink renderers
        </div>
      </div>
    </div>
  )
}
