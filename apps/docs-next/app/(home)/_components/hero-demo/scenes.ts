export type WidgetKind =
  | 'weather'
  | 'price'
  | 'order'
  | 'flight'
  | 'rag'
  | 'sandbox'
  | 'agents'
  | 'trace'
  | 'memory'
  | 'providers'
  | 'integration'
  | 'terminal'
  | 'eval'
  | 'skill'

export type Event =
  | { type: 'userType'; text: string; cps?: number }
  | { type: 'userSend' }
  | { type: 'thinking' }
  | { type: 'tool'; label: string; ms: number }
  | { type: 'widget'; kind: WidgetKind }
  | { type: 'assistantStream'; text: string; cps?: number }
  | { type: 'pause'; ms: number }

export type Scene = {
  id: WidgetKind
  label: string
  events: Event[]
}

export const SCENES: Scene[] = [
  {
    id: 'weather',
    label: 'weather',
    events: [
      { type: 'userType', text: 'weather in Tokyo this weekend?' },
      { type: 'userSend' },
      { type: 'pause', ms: 200 },
      { type: 'thinking' },
      { type: 'tool', label: 'weather.get({ city: "Tokyo", days: 5 })', ms: 600 },
      { type: 'widget', kind: 'weather' },
      {
        type: 'assistantStream',
        text: 'Sunny Saturday, showers Sunday → Monday. Pack a light jacket.',
      },
      { type: 'pause', ms: 2400 },
    ],
  },
  {
    id: 'price',
    label: 'crypto',
    events: [
      { type: 'userType', text: 'whats the price of bitcoin right now?' },
      { type: 'userSend' },
      { type: 'pause', ms: 200 },
      { type: 'thinking' },
      { type: 'tool', label: 'crypto.price("BTC") + chart24h()', ms: 700 },
      { type: 'widget', kind: 'price' },
      {
        type: 'assistantStream',
        text: 'BTC up 2.4% in the last 24h. Volume solid at $28B.',
      },
      { type: 'pause', ms: 2400 },
    ],
  },
  {
    id: 'order',
    label: 'orders',
    events: [
      { type: 'userType', text: 'track my order #4521' },
      { type: 'userSend' },
      { type: 'pause', ms: 200 },
      { type: 'thinking' },
      { type: 'tool', label: 'orders.track({ id: "4521" })', ms: 500 },
      { type: 'widget', kind: 'order' },
      {
        type: 'assistantStream',
        text: 'Shipped and en route. Expected Tuesday, Apr 21.',
      },
      { type: 'pause', ms: 2400 },
    ],
  },
  {
    id: 'flight',
    label: 'flights',
    events: [
      { type: 'userType', text: 'flights LAX to NYC tomorrow' },
      { type: 'userSend' },
      { type: 'pause', ms: 200 },
      { type: 'thinking' },
      { type: 'tool', label: 'flights.search({ from: "LAX", to: "JFK" })', ms: 800 },
      { type: 'widget', kind: 'flight' },
      {
        type: 'assistantStream',
        text: 'Three options under $320. Delta 06:15 is your fastest nonstop.',
      },
      { type: 'pause', ms: 2600 },
    ],
  },
  {
    id: 'rag',
    label: 'rag',
    events: [
      { type: 'userType', text: 'summarize my Q3 strategy doc, cite sections' },
      { type: 'userSend' },
      { type: 'pause', ms: 200 },
      { type: 'thinking' },
      { type: 'tool', label: 'rag.retrieve({ query: "Q3 strategy", k: 3 })', ms: 700 },
      { type: 'widget', kind: 'rag' },
      {
        type: 'assistantStream',
        text: 'Three pillars: GTM expansion [§2], pricing rework [§4], onboarding cuts [§7].',
      },
      { type: 'pause', ms: 2800 },
    ],
  },
  {
    id: 'sandbox',
    label: 'sandbox',
    events: [
      { type: 'userType', text: 'run fibonacci(20) in python' },
      { type: 'userSend' },
      { type: 'pause', ms: 200 },
      { type: 'thinking' },
      { type: 'tool', label: 'sandbox.run({ lang: "python", timeout: 5000 })', ms: 900 },
      { type: 'widget', kind: 'sandbox' },
      {
        type: 'assistantStream',
        text: 'fib(20) = 6765. Ran isolated in E2B, 142ms.',
      },
      { type: 'pause', ms: 2800 },
    ],
  },
  {
    id: 'agents',
    label: 'multi-agent',
    events: [
      { type: 'userType', text: 'research and draft a post on agent frameworks' },
      { type: 'userSend' },
      { type: 'pause', ms: 200 },
      { type: 'thinking' },
      { type: 'tool', label: 'runtime.orchestrate({ agents: 4 })', ms: 800 },
      { type: 'widget', kind: 'agents' },
      {
        type: 'assistantStream',
        text: 'Planner → researcher → writer → critic. 4 agents, 1 deliverable.',
      },
      { type: 'pause', ms: 2800 },
    ],
  },
  {
    id: 'trace',
    label: 'trace',
    events: [
      { type: 'userType', text: 'show me the trace for that last call' },
      { type: 'userSend' },
      { type: 'pause', ms: 200 },
      { type: 'thinking' },
      { type: 'tool', label: 'observability.getTrace({ id: "tr_8a2f" })', ms: 600 },
      { type: 'widget', kind: 'trace' },
      {
        type: 'assistantStream',
        text: 'Total 1.4s · 2.1k tokens · $0.004. LLM call dominated at 980ms.',
      },
      { type: 'pause', ms: 2800 },
    ],
  },
  {
    id: 'memory',
    label: 'memory',
    events: [
      { type: 'userType', text: 'suggest dinner ideas for tonight' },
      { type: 'userSend' },
      { type: 'pause', ms: 200 },
      { type: 'thinking' },
      { type: 'tool', label: 'memory.recall({ user: "rebeca" })', ms: 500 },
      { type: 'widget', kind: 'memory' },
      {
        type: 'assistantStream',
        text: 'Vegan, gluten-free preferred — try roasted chickpea bowl or lentil curry.',
      },
      { type: 'pause', ms: 2800 },
    ],
  },
  {
    id: 'providers',
    label: 'providers',
    events: [
      { type: 'userType', text: 'same prompt across providers, pick the best' },
      { type: 'userSend' },
      { type: 'pause', ms: 200 },
      { type: 'thinking' },
      { type: 'tool', label: 'adapters.fanout({ providers: 4 })', ms: 900 },
      { type: 'widget', kind: 'providers' },
      {
        type: 'assistantStream',
        text: 'Claude wins on quality, Ollama wins on cost. Same controller, swap any time.',
      },
      { type: 'pause', ms: 2800 },
    ],
  },
  {
    id: 'integration',
    label: 'integrations',
    events: [
      { type: 'userType', text: 'send the launch update to #product on slack' },
      { type: 'userSend' },
      { type: 'pause', ms: 200 },
      { type: 'thinking' },
      { type: 'tool', label: 'tools.slack.send({ channel: "#product" })', ms: 700 },
      { type: 'widget', kind: 'integration' },
      {
        type: 'assistantStream',
        text: 'Posted to #product. 1 reaction so far.',
      },
      { type: 'pause', ms: 2800 },
    ],
  },
  {
    id: 'terminal',
    label: 'ink',
    events: [
      { type: 'userType', text: 'run the same chat in my terminal' },
      { type: 'userSend' },
      { type: 'pause', ms: 200 },
      { type: 'thinking' },
      { type: 'tool', label: 'cli.spawn({ ui: "ink" })', ms: 600 },
      { type: 'widget', kind: 'terminal' },
      {
        type: 'assistantStream',
        text: 'Same controller, two surfaces. React in browser, Ink in TTY.',
      },
      { type: 'pause', ms: 2800 },
    ],
  },
  {
    id: 'eval',
    label: 'eval',
    events: [
      { type: 'userType', text: 'run my agent eval suite' },
      { type: 'userSend' },
      { type: 'pause', ms: 200 },
      { type: 'thinking' },
      { type: 'tool', label: 'eval.run({ suite: "regression", n: 25 })', ms: 1100 },
      { type: 'widget', kind: 'eval' },
      {
        type: 'assistantStream',
        text: '24/25 passed. p95 1.2s. $0.04 total. CI gate green.',
      },
      { type: 'pause', ms: 2800 },
    ],
  },
  {
    id: 'skill',
    label: 'skills',
    events: [
      { type: 'userType', text: 'critique this paragraph as a senior editor' },
      { type: 'userSend' },
      { type: 'pause', ms: 200 },
      { type: 'thinking' },
      { type: 'tool', label: 'skills.use("critic")', ms: 500 },
      { type: 'widget', kind: 'skill' },
      {
        type: 'assistantStream',
        text: 'Three weak verbs, one buried lede. Tighten: "ships now" → leading line.',
      },
      { type: 'pause', ms: 2800 },
    ],
  },
]
