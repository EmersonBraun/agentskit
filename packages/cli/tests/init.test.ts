import { mkdtemp, readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { renderChatHeader } from '../src/chat'
import { writeStarterProject } from '../src/init'
import { resolveChatProvider } from '../src/providers'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
})

describe('@agentskit/cli', () => {
  it('renders a short chat header', () => {
    expect(renderChatHeader({ provider: 'demo', model: 'test' })).toContain('provider=demo')
  })

  it('writes a react starter project', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'agentskit-cli-'))
    await writeStarterProject({ targetDir: tempDir, template: 'react' })

    const packageJson = await readFile(path.join(tempDir, 'package.json'), 'utf8')
    const mainFile = await readFile(path.join(tempDir, 'src/main.tsx'), 'utf8')

    expect(packageJson).toContain('@agentskit/react')
    expect(mainFile).toContain('useChat')
  })

  it('uses environment variables for openai', () => {
    process.env.OPENAI_API_KEY = 'test-key'
    const runtime = resolveChatProvider({ provider: 'openai' })

    expect(runtime.mode).toBe('live')
    expect(runtime.model).toBe('gpt-4o-mini')
  })

  it('throws a helpful error when a provider key is missing', () => {
    delete process.env.ANTHROPIC_API_KEY
    expect(() => resolveChatProvider({ provider: 'anthropic' })).toThrow('ANTHROPIC_API_KEY')
  })

  it('supports ollama without an API key', () => {
    const runtime = resolveChatProvider({ provider: 'ollama' })
    expect(runtime.mode).toBe('live')
    expect(runtime.model).toBe('llama3.1')
  })
})
