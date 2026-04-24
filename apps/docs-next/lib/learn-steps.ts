import type { PlaygroundPreset } from '@/components/mdx/playground-presets'

export type LearnStep = {
  slug: string
  title: string
  intro: string
  body: string
  preset?: string
  files?: Record<string, string>
  entry?: string
  key: string
}

const chatAppFiles: Record<string, string> = {
  '/App.tsx': `import { useState } from 'react'

const FAKE_REPLIES = [
  'Welcome to AgentsKit. Streaming is on by default.',
  'Swap the adapter in 1 line to change providers.',
  'Tools and memory are optional — compose what you need.',
]

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi, ask me something.' },
  ])
  const [input, setInput] = useState('')

  async function send() {
    if (!input.trim()) return
    const next = [...messages, { role: 'user', content: input }]
    setMessages(next)
    setInput('')
    const reply = FAKE_REPLIES[next.length % FAKE_REPLIES.length]
    let streamed = ''
    setMessages([...next, { role: 'assistant', content: '' }])
    for (const ch of reply) {
      await new Promise((r) => setTimeout(r, 14))
      streamed += ch
      setMessages([...next, { role: 'assistant', content: streamed }])
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui', padding: 16, maxWidth: 520 }}>
      {messages.map((m, i) => (
        <div
          key={i}
          style={{
            margin: '6px 0',
            padding: '8px 12px',
            background: m.role === 'user' ? '#2563eb' : '#1e293b',
            color: 'white',
            borderRadius: 12,
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
          }}
        >
          {m.content}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #334155' }}
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  )
}
`,
}

const toolFiles: Record<string, string> = {
  '/App.tsx': `import { useState } from 'react'

const tools = {
  get_weather: ({ city }) => ({ city, tempC: 22 }),
  get_time: () => ({ time: new Date().toLocaleTimeString() }),
}

export default function App() {
  const [out, setOut] = useState({})
  return (
    <div style={{ fontFamily: 'system-ui', padding: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setOut(tools.get_weather({ city: 'Lisbon' }))}>weather</button>
        <button onClick={() => setOut(tools.get_time())}>time</button>
      </div>
      <pre>{JSON.stringify(out, null, 2)}</pre>
    </div>
  )
}
`,
}

export const STEPS: LearnStep[] = [
  {
    slug: 'install',
    key: 'learn:install',
    title: 'Install AgentsKit',
    intro: 'Start from zero. One package. Zero build config.',
    body: `AgentsKit is installable **per package**. Pick only what you need:

\`\`\`bash
pnpm add @agentskit/react @agentskit/core
\`\`\`

Each package is tree-shakable, dual-format (ESM + CJS), and ships its own types.`,
  },
  {
    slug: 'chat',
    key: 'learn:chat',
    title: 'Ship a streaming chat UI',
    intro: 'Build a complete chat interface with streaming — without a backend.',
    body: `\`useChat\` wires state, streaming, abort, and retries. Drop it into any component.

\`\`\`tsx
import { useChat } from '@agentskit/react'
\`\`\`

The playground below runs a mock adapter. Try it: send a message, watch it stream.`,
    files: chatAppFiles,
    entry: '/App.tsx',
  },
  {
    slug: 'adapter',
    key: 'learn:adapter',
    title: 'Swap the provider',
    intro: 'Change one line to switch from mock to OpenAI, Anthropic, or Gemini.',
    body: `Adapters are pure contracts. Swap the import, keep the rest of your app identical.

\`\`\`ts
import { openai } from '@agentskit/adapters/openai'
export const adapter = openai({ model: 'gpt-4o-mini' })
\`\`\`

The UI does not need to know which provider is behind it.`,
  },
  {
    slug: 'tools',
    key: 'learn:tools',
    title: 'Give the agent tools',
    intro: 'Register functions the model can call.',
    body: `A tool is a named function with a schema. AgentsKit runs it when the model decides to.

\`\`\`ts
import { defineTool } from '@agentskit/tools'

export const getWeather = defineTool({
  name: 'get_weather',
  description: 'Get current weather for a city',
  schema: { city: 'string' },
  async execute({ city }) { return { city, tempC: 22 } },
})
\`\`\``,
    files: toolFiles,
    entry: '/App.tsx',
  },
  {
    slug: 'memory',
    key: 'learn:memory',
    title: 'Persist the conversation',
    intro: 'Swap ephemeral state for SQLite, Redis, or a vector store.',
    body: `Memory is another contract. Default is in-memory; for production, pick an adapter.

\`\`\`ts
import { fileMemory } from '@agentskit/memory/file'
export const memory = fileMemory({ path: './threads.json' })
\`\`\`

Hydration, serialization, and long-term storage work the same across every memory backend.`,
  },
]

export type Progress = Record<string, boolean>
export const PROGRESS_KEY = 'ak:learn-progress'
