import React from 'react'
import Layout from '@theme/Layout'
import Link from '@docusaurus/Link'

function StreamingDemo() {
  const [text, setText] = React.useState('')
  const fullText = `import { useChat, ChatContainer, Message, InputBar } from 'react-arrow'
import 'react-arrow/theme'

function App() {
  const chat = useChat({ adapter: anthropic({ model: 'claude-sonnet-4-6' }) })
  return (
    <ChatContainer>
      {chat.messages.map(msg => <Message key={msg.id} message={msg} />)}
      <InputBar chat={chat} />
    </ChatContainer>
  )
}`

  React.useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setText(fullText.slice(0, i))
        i++
      } else {
        clearInterval(interval)
      }
    }, 25)
    return () => clearInterval(interval)
  }, [])

  return (
    <pre style={{
      background: 'var(--ifm-color-emphasis-100)',
      padding: '1.5rem',
      borderRadius: '8px',
      fontSize: '13px',
      lineHeight: 1.6,
      overflow: 'auto',
      minHeight: '280px',
    }}>
      <code>{text}<span style={{ animation: 'blink 1s step-end infinite' }}>&#9608;</span></code>
    </pre>
  )
}

export default function Home(): React.JSX.Element {
  return (
    <Layout title="React Arrow" description="A hooks-first React library for the agentic era">
      <main style={{ padding: '4rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800 }}>
            React Arrow <span style={{ opacity: 0.5 }}>&rarr;</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--ifm-color-emphasis-700)' }}>
            A hooks-first React library for the agentic era.
          </p>
          <p style={{ fontSize: '0.95rem', color: 'var(--ifm-color-emphasis-600)' }}>
            Inspired by <a href="https://arrow-js.com/" target="_blank" rel="noopener noreferrer">Arrow.js</a>
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <Link className="button button--primary button--lg" to="/docs/getting-started/quick-start">
              Get Started
            </Link>
            <Link className="button button--secondary button--lg" to="/docs/getting-started/for-ai-agents">
              For AI Agents
            </Link>
          </div>
        </div>

        <StreamingDemo />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginTop: '3rem',
        }}>
          <div style={{ padding: '1.5rem', borderRadius: '8px', background: 'var(--ifm-color-emphasis-100)' }}>
            <h3>3 Hooks</h3>
            <p>useStream, useReactive, useChat &mdash; that's the whole API. Simple enough for agents, powerful enough for production.</p>
          </div>
          <div style={{ padding: '1.5rem', borderRadius: '8px', background: 'var(--ifm-color-emphasis-100)' }}>
            <h3>Stream-Native</h3>
            <p>Built around async streams. Works with Anthropic, OpenAI, Vercel AI SDK, or any ReadableStream.</p>
          </div>
          <div style={{ padding: '1.5rem', borderRadius: '8px', background: 'var(--ifm-color-emphasis-100)' }}>
            <h3>Headless + Theme</h3>
            <p>Components ship unstyled with data attributes. Import the optional theme or style your own way.</p>
          </div>
        </div>
      </main>
    </Layout>
  )
}
