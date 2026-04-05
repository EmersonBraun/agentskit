import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { ChatContainer, Message, InputBar, ThinkingIndicator } from '../src/components'
import { useChat } from '../src/useChat'
import type { AdapterFactory, AdapterRequest, StreamChunk, Message as MessageType } from '@agentskit/core'

const delay = (ms = 50) => new Promise(r => setTimeout(r, ms))

function createMockAdapter(chunks: StreamChunk[]): AdapterFactory {
  return {
    createSource: (_request: AdapterRequest) => {
      let aborted = false
      return {
        stream: async function* () {
          for (const chunk of chunks) {
            if (aborted) return
            yield chunk
          }
        },
        abort: () => { aborted = true },
      }
    },
  }
}

function ChatApp({ adapter }: { adapter: AdapterFactory }) {
  const chat = useChat({ adapter })

  return (
    <ChatContainer>
      {chat.messages.map((msg: MessageType) => (
        <Message key={msg.id} message={msg} />
      ))}
      <ThinkingIndicator visible={chat.status === 'streaming'} />
      <InputBar chat={chat} />
    </ChatContainer>
  )
}

describe('Ink chat integration', () => {
  it('renders empty chat with input bar', () => {
    const adapter = createMockAdapter([])
    const { lastFrame } = render(<ChatApp adapter={adapter} />)
    const output = lastFrame()
    expect(output).toContain('Type a message...')
  })

  it('full chat flow: type message → send → stream response → complete', async () => {
    const adapter = createMockAdapter([
      { type: 'text', content: 'Hello from ' },
      { type: 'text', content: 'AgentsKit!' },
      { type: 'done' },
    ])

    const { lastFrame, stdin } = render(<ChatApp adapter={adapter} />)

    // Wait for Ink to set up useInput
    await delay()

    // Type "Hi"
    stdin.write('H')
    await delay()
    stdin.write('i')
    await delay()

    // Verify input appears
    expect(lastFrame()).toContain('Hi')

    // Press enter to send
    stdin.write('\r')

    // Wait for streaming to complete
    await delay(200)

    const output = lastFrame()

    // User message should be visible
    expect(output).toContain('USER')
    // Assistant response should be fully streamed
    expect(output).toContain('Hello from AgentsKit!')
    expect(output).toContain('ASSISTANT')
  })

  it('shows thinking indicator during streaming', async () => {
    let resolveStream: (() => void) | undefined
    const adapter: AdapterFactory = {
      createSource: () => ({
        stream: async function* () {
          yield { type: 'text' as const, content: 'partial' }
          // Block until resolved
          await new Promise<void>(r => { resolveStream = r })
          yield { type: 'done' as const }
        },
        abort: () => { resolveStream?.() },
      }),
    }

    const { lastFrame, stdin } = render(<ChatApp adapter={adapter} />)
    await delay()

    stdin.write('go')
    await delay()
    stdin.write('\r')
    await delay(100)

    // Should show thinking indicator during streaming
    expect(lastFrame()).toContain('Thinking...')

    // Resolve the stream
    resolveStream?.()
    await delay(100)

    // Thinking indicator should be gone
    expect(lastFrame()).not.toContain('Thinking...')
  })
})
