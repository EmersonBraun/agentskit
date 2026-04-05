import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type StarterKind = 'react' | 'ink'

export interface InitCommandOptions {
  targetDir: string
  template: StarterKind
}

function reactStarter() {
  return {
    'package.json': JSON.stringify({
      name: 'agentskit-react-app',
      private: true,
      type: 'module',
      scripts: {
        dev: 'vite',
      },
      dependencies: {
        '@agentskit/adapters': '^0.1.0',
        '@agentskit/react': '^0.1.0',
        react: '^18.3.1',
        'react-dom': '^18.3.1',
      },
    }, null, 2),
    'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChatContainer, InputBar, Message, useChat } from '@agentskit/react'
import { openai } from '@agentskit/adapters'
import '@agentskit/react/theme'

function App() {
  const chat = useChat({
    adapter: openai({ apiKey: import.meta.env.VITE_OPENAI_API_KEY ?? '', model: 'gpt-4o-mini' }),
  })

  return (
    <ChatContainer>
      {chat.messages.map(message => <Message key={message.id} message={message} />)}
      <InputBar chat={chat} />
    </ChatContainer>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
`,
    '.env.example': 'VITE_OPENAI_API_KEY=\n',
  }
}

function inkStarter() {
  return {
    'package.json': JSON.stringify({
      name: 'agentskit-ink-app',
      private: true,
      type: 'module',
      scripts: {
        dev: 'tsx src/index.tsx',
      },
      dependencies: {
        '@agentskit/ink': '^0.1.0',
        react: '^18.3.1',
      },
    }, null, 2),
    'src/index.tsx': `import React from 'react'
import { render } from 'ink'
import { ChatContainer, InputBar, Message, useChat } from '@agentskit/ink'

function DemoAdapter() {
  return {
    createSource: () => ({
      async *stream() {
        yield { type: 'text', content: 'Hello from AgentsKit Ink.' }
        yield { type: 'done' }
      },
      abort() {},
    }),
  }
}

function App() {
  const chat = useChat({ adapter: DemoAdapter() })
  return (
    <ChatContainer>
      {chat.messages.map(message => <Message key={message.id} message={message} />)}
      <InputBar chat={chat} />
    </ChatContainer>
  )
}

render(<App />)
`,
  }
}

export async function writeStarterProject(options: InitCommandOptions) {
  const files = options.template === 'ink' ? inkStarter() : reactStarter()
  await mkdir(options.targetDir, { recursive: true })

  await Promise.all(
    Object.entries(files).map(async ([relativePath, content]) => {
      const absolutePath = path.join(options.targetDir, relativePath)
      await mkdir(path.dirname(absolutePath), { recursive: true })
      await writeFile(absolutePath, content, 'utf8')
    })
  )
}
