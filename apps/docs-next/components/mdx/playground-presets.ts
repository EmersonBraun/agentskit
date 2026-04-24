export type PlaygroundPreset = {
  name: string
  description: string
  entry: string
  files: Record<string, string>
  dependencies?: Record<string, string>
}

const basicChat = `import { useState } from 'react'

const MOCK_REPLIES = [
  'Streaming works by flushing tokens as they arrive.',
  'AgentsKit wires the provider, runtime, and UI with one hook.',
  'Swap the adapter and the rest of the app stays identical.',
]

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! Ask me anything about AgentsKit.' },
  ])
  const [input, setInput] = useState('')

  async function send() {
    if (!input.trim()) return
    const next = [...messages, { role: 'user', content: input }]
    setMessages(next)
    setInput('')
    const reply = MOCK_REPLIES[next.length % MOCK_REPLIES.length]
    let streamed = ''
    setMessages([...next, { role: 'assistant', content: '' }])
    for (const char of reply) {
      await new Promise((r) => setTimeout(r, 12))
      streamed += char
      setMessages([...next, { role: 'assistant', content: streamed }])
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui', padding: 16, maxWidth: 520 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' ? '#2563eb' : '#1e293b',
              color: 'white',
              padding: '8px 12px',
              borderRadius: 12,
              maxWidth: '80%',
            }}
          >
            {m.content}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message…"
          style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #334155' }}
        />
        <button onClick={send} style={{ padding: '8px 16px', borderRadius: 8, background: '#2563eb', color: 'white', border: 0 }}>
          Send
        </button>
      </div>
    </div>
  )
}
`

const toolCall = `import { useState } from 'react'

const TOOLS = {
  get_weather: ({ city }) => ({ city, tempC: 22, condition: 'sunny' }),
  search_docs: ({ query }) => ({ query, hits: ['intro.mdx', 'runtime.mdx'] }),
}

export default function App() {
  const [log, setLog] = useState([])

  function runTool(name, args) {
    const result = TOOLS[name](args)
    setLog((l) => [...l, { name, args, result }])
  }

  return (
    <div style={{ fontFamily: 'system-ui', padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Tool calls</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => runTool('get_weather', { city: 'Lisbon' })}>get_weather(Lisbon)</button>
        <button onClick={() => runTool('search_docs', { query: 'runtime' })}>search_docs(runtime)</button>
      </div>
      <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 8, fontSize: 12 }}>
        {JSON.stringify(log, null, 2) || '// run a tool'}
      </pre>
    </div>
  )
}
`

export const PRESETS: Record<string, PlaygroundPreset> = {
  'basic-chat': {
    name: 'Basic chat',
    description: 'Streaming chat with a mock adapter.',
    entry: '/App.tsx',
    files: { '/App.tsx': basicChat },
  },
  'tool-call': {
    name: 'Tool call',
    description: 'Invoke deterministic tools and view results.',
    entry: '/App.tsx',
    files: { '/App.tsx': toolCall },
  },
}
