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
  /** Interactive widget rendered below the body. */
  kind?: 'install' | 'chat' | 'adapter' | 'tools' | 'memory'
}

const MOCK_ADAPTER_SNIPPET = `// Mock adapter — streams fake replies. Swap for \`anthropic({ apiKey })\`, \`openai({ apiKey })\`,
// or any adapter from @agentskit/adapters in your own app.
const FAKE = [
  'Welcome to AgentsKit. Streaming is on by default.',
  'Swap the adapter in one line to change providers.',
  'Tools and memory are optional — compose what you need.',
]
let turn = 0

const mockAdapter = {
  createSource: () => ({
    async *stream() {
      const reply = FAKE[turn++ % FAKE.length]
      for (const ch of reply) {
        await new Promise((r) => setTimeout(r, 18))
        yield { type: 'text', content: ch }
      }
      yield { type: 'done' }
    },
    abort() {},
  }),
}`

const CHAT_CSS = `html, body, #root { height: 100%; margin: 0; }
.ak-chat { flex: 1 1 auto; min-height: 0; padding: 12px; }
.ak-chat > * + * { margin-top: 8px; }
[data-ak-message] { padding: 8px 12px; border-radius: 12px; max-width: 80%; display: block; }
[data-ak-message][data-ak-role="user"] { background: #2563eb; color: white; margin-left: auto; }
[data-ak-message][data-ak-role="assistant"] { background: #1e293b; color: white; }
[data-ak-input-bar] { display: flex; gap: 8px; padding: 12px; border-top: 1px solid #e5e7eb; }
[data-ak-input-bar] input { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #334155; }
[data-ak-input-bar] button { padding: 8px 16px; border-radius: 8px; background: #2563eb; color: white; border: 0; cursor: pointer; }`

const chatAppFiles: Record<string, string> = {
  '/styles.css': CHAT_CSS,
  '/App.tsx': `import { useChat, ChatContainer, Message, InputBar } from '@agentskit/react'
import '@agentskit/react/theme'
import './styles.css'

${MOCK_ADAPTER_SNIPPET}

export default function App() {
  const chat = useChat({
    adapter: mockAdapter,
    initialMessages: [
      { id: 'init', role: 'assistant', content: 'Hi, ask me something.', status: 'complete' },
    ],
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui' }}>
      <ChatContainer className="ak-chat">
        {chat.messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
      </ChatContainer>
      <InputBar chat={chat} />
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
    body: `AgentsKit is installable **per package**. Pick only what you need — each is tree-shakable, dual-format (ESM + CJS), and ships its own types. Switch package manager below and the command updates everywhere.`,
    kind: 'install',
  },
  {
    slug: 'chat',
    key: 'learn:chat',
    title: 'Ship a streaming chat UI',
    intro: 'Build a complete chat interface with streaming — without a backend.',
    body: `\`useChat\` wires state, streaming, abort, and retries. Drop it into any component. The preview below runs a mock adapter. Try it: send a message, watch it stream.`,
    kind: 'chat',
    files: chatAppFiles,
    entry: '/App.tsx',
  },
  {
    slug: 'adapter',
    key: 'learn:adapter',
    title: 'Swap the provider',
    intro: 'Change one line to switch from mock to OpenAI, Anthropic, or Gemini.',
    body: `Adapters are pure contracts. Pick a provider — the UI does not need to know which one is behind it.`,
    kind: 'adapter',
  },
  {
    slug: 'tools',
    key: 'learn:tools',
    title: 'Build your first agent',
    intro: 'Register functions the model can call. Watch it choose and render live results.',
    body: `A tool is a named function with a schema. AgentsKit runs it when the model decides to. Pick a tool below — the mock adapter calls it and streams a summary while the widget renders the structured result.`,
    kind: 'tools',
  },
  {
    slug: 'memory',
    key: 'learn:memory',
    title: 'Persist the conversation',
    intro: 'Swap ephemeral state for SQLite, Redis, or a vector store.',
    body: `Memory is another contract. Default is in-memory; for production, pick an adapter. Hydration, serialization, and long-term storage work the same across every backend.`,
    kind: 'memory',
  },
]

export type Progress = Record<string, boolean>
export const PROGRESS_KEY = 'ak:learn-progress'
