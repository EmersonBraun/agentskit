import React, { useState, useEffect, useRef, useCallback } from 'react'
import Layout from '@theme/Layout'
import Link from '@docusaurus/Link'

const GITHUB_REPO = 'EmersonBraun/agentskit'
const GITHUB_URL = `https://github.com/${GITHUB_REPO}`
const GITHUB_DISCUSSIONS = `${GITHUB_URL}/discussions`
const GITHUB_ISSUES = `${GITHUB_URL}/issues`
const NPM_REACT = 'https://www.npmjs.com/package/@agentskit/react'
const NPM_ORG = 'https://www.npmjs.com/org/agentskit'

/** All published workspace packages — used for aggregated download counts (npm API has no scoped bulk endpoint). */
const AGENTSKIT_NPM_PACKAGES = [
  '@agentskit/adapters',
  '@agentskit/cli',
  '@agentskit/core',
  '@agentskit/eval',
  '@agentskit/ink',
  '@agentskit/memory',
  '@agentskit/observability',
  '@agentskit/rag',
  '@agentskit/react',
  '@agentskit/runtime',
  '@agentskit/sandbox',
  '@agentskit/skills',
  '@agentskit/templates',
  '@agentskit/tools',
] as const

async function fetchLastWeekDownloads(pkg: string): Promise<number> {
  const enc = encodeURIComponent(pkg)
  const res = await fetch(`https://api.npmjs.org/downloads/point/last-week/${enc}`)
  if (!res.ok) return 0
  const data: { downloads?: number; error?: string } = await res.json()
  if (data.error || typeof data.downloads !== 'number') return 0
  return data.downloads
}

function formatCompactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`
  return String(n)
}

/** Weekly downloads summed across all @agentskit/* packages (npm does not expose scope totals in one call). */
function AggregatedNpmDownloadsBadge() {
  const [total, setTotal] = useState<number | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const counts = await Promise.all(AGENTSKIT_NPM_PACKAGES.map(p => fetchLastWeekDownloads(p)))
        if (cancelled) return
        setTotal(counts.reduce((a, b) => a + b, 0))
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const label = 'downloads'
  const message =
    failed ? '—' : total === null ? '…' : formatCompactCount(total)

  return (
    <a
      href={NPM_ORG}
      target="_blank"
      rel="noopener noreferrer"
      className="social-proof-badge ak-shield-badge ak-shield-badge--downloads"
      title="Sum of last-week npm downloads across all @agentskit packages"
    >
      <span className="ak-shield-badge__label">{label}</span>
      <span className="ak-shield-badge__value">{message}</span>
    </a>
  )
}

// ─── Floating Keywords Background ───
const KEYWORDS = [
  'useChat()', 'useStream()', 'useReactive()', 'adapter', 'streaming',
  'ChatContainer', 'Message', 'InputBar', '<5KB', 'anthropic()',
  'openai()', 'send()', 'stop()', 'retry()', 'data-ak-*',
  'onMessage', 'onChunk', 'headless', 'theme', 'hooks',
  'createRuntime()', 'RAG', 'Ink', 'CLI', 'tools', 'memory',
]

function FloatingKeywords() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {KEYWORDS.map((kw, i) => (
        <span
          key={i}
          className="floating-keyword"
          style={{
            left: `${(i * 5.2) % 100}%`,
            animationDuration: `${12 + (i % 8) * 3}s`,
            animationDelay: `${(i * 1.7) % 10}s`,
            fontSize: `${11 + (i % 4) * 2}px`,
          }}
        >
          {kw}
        </span>
      ))}
    </div>
  )
}

// ─── Social proof (live badges) ───
function SocialProofBar() {
  return (
    <div className="social-proof-bar">
      <a href={NPM_REACT} target="_blank" rel="noopener noreferrer" className="social-proof-badge">
        <img
          src="https://img.shields.io/npm/v/@agentskit/react?style=flat-square&logo=npm&label=npm&color=0891b2"
          alt="npm package version for @agentskit/react"
          height={20}
          loading="lazy"
        />
      </a>
      <AggregatedNpmDownloadsBadge />
      <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="social-proof-badge">
        <img
          src={`https://img.shields.io/github/stars/${GITHUB_REPO}?style=flat-square&logo=github&label=stars&color=64748b`}
          alt="GitHub stars for AgentsKit"
          height={20}
          loading="lazy"
        />
      </a>
      <span className="social-proof-meta">14 packages on npm · MIT · Open source</span>
    </div>
  )
}

// ─── Copy Install Command ───
function InstallCommand() {
  const [copied, setCopied] = useState(false)
  const cmd = 'npm install @agentskit/react'

  const copy = () => {
    navigator.clipboard?.writeText(cmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="install-block">
      <button type="button" onClick={copy} className="install-cmd">
        <span className="dollar">$</span>
        <span>{cmd}</span>
        <span className={`install-copy-badge${copied ? ' install-copy-badge--done' : ''}`}>
          {copied ? '✓ Copied' : 'Copy'}
        </span>
      </button>
      <p className="install-hint">
        <Link to="/docs/getting-started/installation">CLI, Runtime, Ink, RAG — full install guide →</Link>
      </p>
    </div>
  )
}

// ─── Compare approaches (factual framing) ───
function CompareApproachesSection() {
  return (
    <section id="compare" className="compare-section">
      <h2 className="section-title">How AgentsKit fits the landscape</h2>
      <p className="section-subtitle">
        A practical lens — not a performance benchmark. Choose what matches your stack and how much control you need.
      </p>
      <p className="compare-scroll-hint">
        This table is wide — scroll sideways on small screens to compare all columns.
      </p>
      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col">Dimension</th>
              <th scope="col">Vendor-tied or closed UI SDKs</th>
              <th scope="col">Opinionated web framework paths</th>
              <th scope="col">AgentsKit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Ownership</th>
              <td>Often bound to one vendor console, hosted-only features, or opaque upgrade paths.</td>
              <td>Open source with a strong &ldquo;happy path&rdquo; for a specific ecosystem (e.g. React streaming patterns).</td>
              <td><strong>MIT, modular npm packages</strong> — you own deployment; swap adapters without rewriting the UI layer.</td>
            </tr>
            <tr>
              <th scope="row">UI model</th>
              <td>Pre-built widgets; limited theming or escape hatches.</td>
              <td>Conventions and examples centered on one stack&apos;s idioms.</td>
              <td><strong>Headless primitives</strong> (<code className="compare-inline-code">data-ak-*</code>) plus optional theme — bring MUI, shadcn, or your design system.</td>
            </tr>
            <tr>
              <th scope="row">Surfaces</th>
              <td>Usually web-first; terminal or headless agents are an afterthought.</td>
              <td>Web-first; depth outside the browser varies.</td>
              <td><strong>Same contracts</strong> for React, Ink (terminal), CLI, and headless <code className="compare-inline-code">runtime</code>.</td>
            </tr>
            <tr>
              <th scope="row">Extension</th>
              <td>Plugin tiers, closed extension APIs, or vendor-specific tool schemas.</td>
              <td>Composable inside the framework&apos;s world.</td>
              <td><strong>Shared core types</strong> — adapters, tools, memory, RAG, skills compose on <code className="compare-inline-code">@agentskit/core</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="compare-note">
        <strong>Best fit:</strong> one stack across browser, terminal, and headless agents, with control over adapters and tools.{' '}
        <strong>Skip if:</strong> a single vendor widget is enough, or you are fully committed to one framework&apos;s AI path.
      </p>
    </section>
  )
}

// ─── Live Interactive Widgets (rendered inside chat) ───
function WidgetColorPicker() {
  const [hue, setHue] = useState(210)
  const colors = [0, 60, 120, 180, 240].map(offset => `hsl(${(hue + offset) % 360}, 72%, 58%)`)

  return (
    <div style={{ marginTop: 10 }}>
      <div className="widget-swatch-row">
        {colors.map((c, i) => (
          <div key={i} style={{ width: 40, height: 40, borderRadius: 8, background: c, cursor: 'pointer', transition: 'transform 0.15s', border: '2px solid rgba(255,255,255,0.1)' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            onClick={() => navigator.clipboard?.writeText(c)}
          />
        ))}
      </div>
      <input type="range" min={0} max={360} value={hue} onChange={e => setHue(Number(e.target.value))}
        style={{ width: '100%', accentColor: `hsl(${hue}, 72%, 58%)` }}
      />
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Drag to shift hue &middot; Click swatch to copy</div>
    </div>
  )
}

function WidgetTimer() {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(true)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  const pct = (seconds % 60) / 60
  const r = 28
  const circ = 2 * Math.PI * r

  return (
    <div className="widget-timer-row">
      <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
        <circle cx={36} cy={36} r={r} fill="none" stroke="#3b82f6" strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.3s' }}
        />
        <text x={36} y={38} textAnchor="middle" fill="#e2e8f0" fontSize={14} fontWeight={700}
          style={{ transform: 'rotate(90deg)', transformOrigin: '36px 36px' }}>
          {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
        </text>
      </svg>
      <div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setRunning(!running)} style={{ background: running ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', color: running ? '#ef4444' : '#22c55e', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}>
            {running ? 'Pause' : 'Resume'}
          </button>
          <button onClick={() => { setSeconds(0); setRunning(true) }} style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}>
            Reset
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>Live timer — reactive state updates</div>
      </div>
    </div>
  )
}

function WidgetPoll() {
  const [votes, setVotes] = useState([
    { label: 'React', count: 42 },
    { label: 'Vue', count: 28 },
    { label: 'Svelte', count: 18 },
    { label: 'Solid', count: 12 },
  ])
  const total = votes.reduce((s, v) => s + v.count, 0)

  const vote = (i: number) => {
    setVotes(prev => prev.map((v, j) => j === i ? { ...v, count: v.count + 1 } : v))
  }

  return (
    <div style={{ marginTop: 10 }}>
      {votes.map((v, i) => {
        const pct = Math.round((v.count / total) * 100)
        return (
          <div key={v.label} onClick={() => vote(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, cursor: 'pointer', padding: '4px 0' }}>
            <div style={{ width: 60, fontSize: 12, fontWeight: 600 }}>{v.label}</div>
            <div style={{ flex: 1, height: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `hsl(${210 + i * 30}, 70%, 55%)`, borderRadius: 6, transition: 'width 0.3s ease' }} />
            </div>
            <div style={{ width: 36, fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>{pct}%</div>
          </div>
        )
      })}
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Click to vote &middot; {total} total votes</div>
    </div>
  )
}

// ─── Conversation Script ───
type MsgItem = { role: 'user' | 'assistant'; content: string; widget?: React.ReactNode }

const SCRIPT: Array<{ role: 'user' | 'assistant'; text: string; widget?: () => React.ReactNode; delay: number }> = [
  { role: 'user', text: 'Generate a color palette', delay: 0 },
  { role: 'assistant', text: 'Here\'s an interactive palette — drag the slider to shift the hue, click any swatch to copy:', delay: 600, widget: () => <WidgetColorPicker /> },
  { role: 'user', text: 'Now create a live timer', delay: 2000 },
  { role: 'assistant', text: 'Done! A reactive timer with SVG progress ring — all powered by useReactive:', delay: 600, widget: () => <WidgetTimer /> },
  { role: 'user', text: 'Show me a live poll', delay: 2500 },
  { role: 'assistant', text: 'Interactive poll with reactive bar charts — click to vote and watch the bars update instantly:', delay: 600, widget: () => <WidgetPoll /> },
]

// ─── Live Chat Demo ───
function LiveChatDemo() {
  const [messages, setMessages] = useState<MsgItem[]>([])
  const [streamText, setStreamText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [input, setInput] = useState('')
  const [demoFinished, setDemoFinished] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  const scroll = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }

  useEffect(scroll, [messages, streamText])

  const streamMessage = useCallback(async (text: string, widget?: React.ReactNode) => {
    setIsStreaming(true)
    setStreamText('')
    for (let i = 0; i < text.length; i++) {
      await new Promise(r => setTimeout(r, 15))
      setStreamText(text.slice(0, i + 1))
    }
    setIsStreaming(false)
    setStreamText('')
    setMessages(prev => [...prev, { role: 'assistant', content: text, widget }])
  }, [])

  const runDemo = useCallback(async () => {
    if (startedRef.current) return
    startedRef.current = true

    await new Promise(r => setTimeout(r, 1200))

    for (const step of SCRIPT) {
      await new Promise(r => setTimeout(r, step.delay))
      if (step.role === 'user') {
        setMessages(prev => [...prev, { role: 'user', content: step.text }])
      } else {
        await streamMessage(step.text, step.widget?.())
      }
    }
    setDemoFinished(true)
  }, [streamMessage])

  useEffect(() => { runDemo() }, [runDemo])

  const handleSend = () => {
    if (!input.trim() || isStreaming) return
    const text = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setTimeout(async () => {
      const responses = [
        { text: 'That\'s a great question! The same streaming hooks power React UIs, Ink terminals, and headless runtimes — one mental model across surfaces.', widget: undefined },
        { text: 'AgentsKit keeps adapters and tools on shared core types, so you extend with memory, RAG, or new providers without rewriting your chat layer.', widget: undefined },
        { text: 'Try it: npm install @agentskit/react for the fastest path, or follow the install guide for CLI and runtime — you\'ll stream a first message in minutes.', widget: undefined },
      ]
      const resp = responses[Math.floor(Math.random() * responses.length)]
      await streamMessage(resp.text, resp.widget)
    }, 400)
  }

  return (
    <div className="demo-window" style={{ maxWidth: 520, width: '100%' }}>
      <div className="demo-titlebar">
        <div className="demo-dot" style={{ background: '#ef4444' }} />
        <div className="demo-dot" style={{ background: '#eab308' }} />
        <div className="demo-dot" style={{ background: '#22c55e' }} />
        <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8, fontFamily: 'monospace' }}>AgentsKit Demo</span>
        <span className="live-badge">LIVE</span>
      </div>
      <div ref={scrollRef} className="demo-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`demo-msg demo-msg-${msg.role}`}>
            <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
            {msg.widget}
          </div>
        ))}
        {isStreaming && streamText && (
          <div className="demo-msg demo-msg-assistant">
            <span style={{ whiteSpace: 'pre-wrap' }}>{streamText}</span>
            <span className="cursor" style={{ marginLeft: 1 }}>|</span>
          </div>
        )}
        {messages.length === 0 && (
          <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>⚡</div>
            Starting demo...
          </div>
        )}
      </div>
      <form onSubmit={e => { e.preventDefault(); handleSend() }} className="demo-input-bar">
        <input
          className="demo-input"
          placeholder={demoFinished ? 'Type anything — try it!' : 'Watching demo...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={!demoFinished}
          style={{ opacity: demoFinished ? 1 : 0.5 }}
        />
        <button type="submit" className="demo-send" disabled={!demoFinished || !input.trim() || isStreaming}>Send</button>
      </form>
    </div>
  )
}

// ─── Code Comparison ───
const BEFORE_CODE = `const [messages, setMessages] = useState([])
const [input, setInput] = useState('')
const [streaming, setStreaming] = useState(false)
const abortRef = useRef(null)

const send = async () => {
  setStreaming(true)
  const userMsg = { role: 'user', content: input }
  setMessages(prev => [...prev, userMsg])
  const res = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ messages: [...messages, userMsg] }),
    signal: abortRef.current?.signal,
  })
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let text = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    text += decoder.decode(value)
    setMessages(prev => [...prev.slice(0,-1),
      { role: 'assistant', content: text }])
  }
  setStreaming(false)
}
// + error handling, auto-scroll, cleanup...`

const AFTER_CODE = `import { useChat, ChatContainer, Message, InputBar }
  from '@agentskit/react'
import { anthropic } from '@agentskit/adapters'
import '@agentskit/react/theme'

function Chat() {
  const chat = useChat({
    adapter: anthropic({ model: 'claude-sonnet-4-6' })
  })
  return (
    <ChatContainer>
      {chat.messages.map(msg =>
        <Message key={msg.id} message={msg} />
      )}
      <InputBar chat={chat} />
    </ChatContainer>
  )
}`

// ─── Examples Data ───
const EXAMPLES = [
  { emoji: '💬', name: 'Basic Chat', desc: 'Streaming conversation', href: '/docs/examples/basic-chat' },
  { emoji: '🔧', name: 'Tool Use', desc: 'Function calling & results', href: '/docs/examples/tool-use' },
  { emoji: '⚖️', name: 'Multi-Model', desc: 'Side-by-side comparison', href: '/docs/examples/multi-model' },
  { emoji: '👨‍💻', name: 'Code Assistant', desc: 'Syntax-highlighted code', href: '/docs/examples/code-assistant' },
  { emoji: '🎧', name: 'Support Bot', desc: 'Quick replies & escalation', href: '/docs/examples/support-bot' },
  { emoji: '📚', name: 'RAG Chat', desc: 'Documents & citations', href: '/docs/examples/rag-chat' },
  { emoji: '🤖', name: 'Agent Actions', desc: 'AI generates live UI', href: '/docs/examples/agent-actions' },
  { emoji: '📝', name: 'Markdown Chat', desc: 'Rich formatted responses', href: '/docs/examples/markdown-chat' },
  { emoji: '🎭', name: 'MUI Chat', desc: 'Material UI integration', href: '/docs/examples/mui-chat' },
  { emoji: '✨', name: 'shadcn Chat', desc: 'shadcn/ui integration', href: '/docs/examples/shadcn-chat' },
]

// ─── Main Page ───
export default function Home(): React.JSX.Element {
  return (
    <Layout
      title="AgentsKit"
      description="Open-source, extensible JavaScript toolkit for AI agents and streaming chat: shared core types, pluggable adapters, React & Ink UIs, CLI, runtime, RAG, tools, and memory."
    >
      {/* ══════════ HERO ══════════ */}
      <section className="ak-hero">
        <div className="hero-grid" />
        <div className="hero-glow" />
        <FloatingKeywords />

        <div className="ak-hero-inner">
          {/* Left: Copy */}
          <div>
            <div className="ak-hero-pill">
              Open source · Extensible — React, terminal &amp; headless
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.2rem)', fontWeight: 800, lineHeight: 1.08, margin: '0 0 1rem 0', color: 'var(--ak-text)' }}>
              One agent toolkit for JavaScript
            </h1>
            <p style={{ fontSize: 'clamp(1.1rem, 3vw, 1.35rem)', fontWeight: 700, lineHeight: 1.35, margin: '0 0 1.25rem 0', color: 'var(--ak-text-muted)' }}>
              <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% auto' }}>
                React · CLI · Runtime · RAG · Tools
              </span>
              {' '}— same contracts everywhere
            </p>
            <p style={{ fontSize: '1.1rem', color: 'var(--ak-text-muted)', lineHeight: 1.6, marginBottom: '1.75rem', maxWidth: 540 }}>
              Pluggable adapters and shared types on <code className="compare-inline-code">@agentskit/core</code>, optional UI. Start in <strong style={{ color: 'var(--ak-text)' }}>React</strong>; reuse the same ideas in <strong style={{ color: 'var(--ak-text)' }}>Ink</strong>, the <strong style={{ color: 'var(--ak-text)' }}>CLI</strong>, or <strong style={{ color: 'var(--ak-text)' }}>runtime</strong> — swap models in one line.
            </p>

            <div className="ak-hero-primary-row">
              <Link
                className="button button--primary button--lg"
                to="/docs/getting-started/quick-start"
                style={{ borderRadius: 10 }}
                data-ak-cta="quick-start-hero"
              >
                Run the 2-minute quick start
              </Link>
            </div>
            <p className="hero-friction-line">
              MIT · No signup · First streaming UI in under a minute · pnpm, yarn, or npm
            </p>
            <div className="hero-secondary-links">
              <Link to="/docs/getting-started/read-this-first">Docs: Start here →</Link>
              <span aria-hidden="true" className="hero-link-sep">·</span>
              <a href="#compare">Compare approaches →</a>
              <span aria-hidden="true" className="hero-link-sep">·</span>
              <Link to="/docs/examples">10 live examples →</Link>
              <span aria-hidden="true" className="hero-link-sep">·</span>
              <Link to="/docs/examples/tool-use">Tool calling demo →</Link>
              <span aria-hidden="true" className="hero-link-sep">·</span>
              <Link to="/docs/examples/rag-chat">RAG chat demo →</Link>
            </div>
            <div className="hero-secondary-links">
              <Link to="/docs/infrastructure/cli">CLI →</Link>
              <span aria-hidden="true" className="hero-link-sep">·</span>
              <a href={NPM_ORG} target="_blank" rel="noopener noreferrer">All packages on npm →</a>
            </div>

            <div className="social-proof-wrap">
              <SocialProofBar />
            </div>

            <InstallCommand />
          </div>

          {/* Right: Live Demo (proof) */}
          <div className="ak-flex-center">
            <LiveChatDemo />
          </div>
        </div>
      </section>

      <main className="ak-page-main">

        {/* ══════════ COMPARE (proof continues) ══════════ */}
        <CompareApproachesSection />

        {/* ══════════ PROBLEM (PAS) ══════════ */}
        <section className="pas-section">
          <h2 className="section-title">Closed SDKs and opinionated paths slow you down</h2>
          <p className="section-subtitle">You still own streaming edge cases — unless your stack is built to compose</p>
          <ul className="pas-list">
            <li><strong>Vendor-tied or closed layers</strong> — upgrade schedules, hosted-only features, and opaque limits box you in when you need custom tools or self-hosted inference.</li>
            <li><strong>Highly opinionated frameworks</strong> — productive inside their happy path; painful when your product spans web, terminal, and headless workers with one contract.</li>
            <li><strong>Fragile hand-rolled streams</strong> — partial chunks, retries, and aborts still leak into UX (stuck &ldquo;typing&rdquo;, duplicated messages, lost tool results) when glue code diverges per surface.</li>
          </ul>
          <p className="pas-solve">
            AgentsKit is <strong>MIT-licensed and extension-first</strong>: adapters, tools, memory, and RAG sit on shared primitives so you keep control and swap pieces without rewriting the product narrative.
          </p>
        </section>

        {/* ══════════ BEFORE / AFTER ══════════ */}
        <section className="ak-section">
          <h2 className="section-title">From ~50 lines of glue to ~10 lines of product</h2>
          <p className="section-subtitle">Less code to review, test, and regret when the API shape changes next month</p>

          <div className="ak-grid--code-pair">
            <div className="code-panel" style={{ opacity: 0.7 }}>
              <div className="code-panel-header" style={{ color: '#ef4444' }}>Before &mdash; ~50 lines</div>
              <pre className="ak-code-pre-tall"><code>{BEFORE_CODE}</code></pre>
            </div>
            <div className="code-panel" style={{ borderColor: 'var(--ak-accent)' }}>
              <div className="code-panel-header" style={{ color: 'var(--ak-accent)' }}>After &mdash; 10 lines with AgentsKit</div>
              <pre className="ak-code-pre-tall"><code>{AFTER_CODE}</code></pre>
            </div>
          </div>
        </section>

        {/* ══════════ ECOSYSTEM (after proof) ══════════ */}
        <section className="ak-section--ecosystem text--center">
          <p className="ak-ecosystem-lead">
            One architecture, every surface
          </p>
          <p className="ak-ecosystem-copy">
            Jump to the guide you need — each link matches an <code className="compare-inline-code">@agentskit/*</code> package on npm.
          </p>
          <div className="ecosystem-pills">
            <Link to="/docs/chat-uis/react" className="ecosystem-pill">React</Link>
            <Link to="/docs/chat-uis/ink" className="ecosystem-pill">Ink</Link>
            <Link to="/docs/infrastructure/cli" className="ecosystem-pill">CLI</Link>
            <Link to="/docs/agents/runtime" className="ecosystem-pill">Runtime</Link>
            <Link to="/docs/data-layer/adapters" className="ecosystem-pill">Adapters</Link>
            <Link to="/docs/data-layer/memory" className="ecosystem-pill">Memory</Link>
            <Link to="/docs/data-layer/rag" className="ecosystem-pill">RAG</Link>
            <Link to="/docs/agents/tools" className="ecosystem-pill">Tools</Link>
            <Link to="/docs/agents/skills" className="ecosystem-pill">Skills</Link>
          </div>
        </section>

        {/* ══════════ PROVIDERS ══════════ */}
        <section className="ak-section--providers text--center">
          <p className="ak-ecosystem-lead">
            Model providers — swap in one line
          </p>
          <div className="ak-provider-row">
            {['Anthropic', 'OpenAI', 'Vercel AI SDK', 'Any ReadableStream'].map(p => (
              <span key={p} className="provider-pill">{p}</span>
            ))}
          </div>
        </section>

        {/* ══════════ FEATURES ══════════ */}
        <section className="ak-section">
          <h2 className="section-title">Why AgentsKit?</h2>
          <p className="section-subtitle">Everything you need, nothing you don&apos;t — same story from UI to headless agents</p>

          <div className="ak-grid--features">
            {[
              { icon: '🪝', title: '3 Hooks', desc: 'useStream, useReactive, useChat — that\'s the entire API. Learn it in 5 minutes.' },
              { icon: '⚡', title: '<5KB Bundle', desc: 'Tiny footprint. No virtual DOM overhead. Just reactive streams wired to the DOM.' },
              { icon: '🔌', title: 'Any Provider', desc: 'Claude, GPT, Vercel AI SDK, or bring your own ReadableStream. Swap in one line.' },
              { icon: '🎨', title: 'Headless + Theme', desc: 'Components ship with data-ak-* attributes. Import the theme or style your way.' },
              { icon: '🤖', title: 'Agent-Friendly', desc: 'Entire API fits in 2K tokens. AI agents generate correct AgentsKit code first try.' },
              { icon: '🧩', title: 'Full toolkit', desc: 'Runtime, Ink, CLI, RAG, memory, tools, skills, sandbox, eval — compose what you need, share types with @agentskit/core.' },
              { icon: '🌍', title: 'Works Everywhere', desc: 'Next.js, Vite, Remix, TanStack Start — any React 18+ app. Zero config.' },
              { icon: '⏹️', title: 'Stop, retry, clear', desc: 'Cancellation and retries on the chat controller — fewer stuck “typing…” states and duplicate assistant messages.' },
              { icon: '📡', title: 'Production visibility', desc: 'Optional @agentskit/observability for traces across LLM calls, tools, and memory — OpenTelemetry-friendly when you need it.' },
              { icon: '🧪', title: 'Benchmark in CI', desc: '@agentskit/eval measures latency, cost, and success rate so agent regressions surface before users do.' },
            ].map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-card-icon">{f.icon}</div>
                <h4 className="feature-card-title">{f.title}</h4>
                <p className="feature-card-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════ EXAMPLES GRID ══════════ */}
        <section className="ak-section">
          <h2 className="section-title">10 Interactive Examples</h2>
          <p className="section-subtitle">Every example is a chat &mdash; because that's what AgentsKit does</p>

          <div className="ak-grid--examples">
            {EXAMPLES.map(ex => (
              <Link key={ex.name} to={ex.href} className="example-card">
                <span className="example-emoji">{ex.emoji}</span>
                <div>
                  <div className="example-card-title">{ex.name}</div>
                  <div className="example-card-desc">{ex.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ══════════ CTA ══════════ */}
        <section className="ak-section ak-section--cta text--center">
          <h2 className="ak-cta-title">
            See streaming work in under a minute
          </h2>
          <p className="ak-cta-lead">
            Run the quick start, then layer tools, memory, and RAG — the mental model does not change.
          </p>
          <p className="hero-friction-line" style={{ marginBottom: '1.75rem' }}>
            MIT · No signup · Open source — use it, fork it, or tell us what is missing
          </p>
          <div className="ak-cta-row">
            <Link
              className="button button--primary button--lg"
              to="/docs/getting-started/quick-start"
              style={{ borderRadius: 10 }}
              data-ak-cta="quick-start-footer"
            >
              Run the 2-minute quick start
            </Link>
          </div>
          <div className="hero-secondary-links hero-secondary-links--footer">
            <Link to="/docs/examples">Live examples →</Link>
            <span aria-hidden="true" className="hero-link-sep">·</span>
            <Link to="/docs/getting-started/for-ai-agents">Prompt for coding agents →</Link>
            <span aria-hidden="true" className="hero-link-sep">·</span>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">Star on GitHub →</a>
          </div>
        </section>

        <section className="ak-section--end text--center">
          <div className="young-project-callout">
            <p className="ak-young-title">
              Young project, moving fast
            </p>
            <p className="ak-young-copy">
              AgentsKit is early-stage and expanding — try it, open an issue if something breaks, and help shape the roadmap.
            </p>
            <div className="hero-secondary-links hero-secondary-links--justify-center">
              <a href={GITHUB_ISSUES} target="_blank" rel="noopener noreferrer">Issues →</a>
              <span aria-hidden="true" className="hero-link-sep">·</span>
              <a href={GITHUB_DISCUSSIONS} target="_blank" rel="noopener noreferrer">Discussions →</a>
              <span aria-hidden="true" className="hero-link-sep">·</span>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">Contribute on GitHub →</a>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}
