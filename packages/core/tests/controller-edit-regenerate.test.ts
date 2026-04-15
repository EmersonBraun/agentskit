import { describe, it, expect } from 'vitest'
import { createChatController } from '../src/controller'
import { createMockAdapter } from './helpers'
import type { AdapterFactory, AdapterRequest, StreamChunk } from '../src/types'

function sequencedAdapter(turns: StreamChunk[][]): AdapterFactory {
  let call = 0
  return {
    createSource: (_request: AdapterRequest) => {
      const chunks = turns[call % turns.length]
      call++
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

describe('controller.edit', () => {
  it('edits an assistant message in place without regenerating', async () => {
    const ctrl = createChatController({
      adapter: createMockAdapter([
        { type: 'text', content: 'first reply' },
        { type: 'done' },
      ]),
    })

    await ctrl.send('hi')
    const assistant = ctrl.getState().messages.find(m => m.role === 'assistant')!

    await ctrl.edit(assistant.id, 'manual override')

    const state = ctrl.getState()
    const edited = state.messages.find(m => m.id === assistant.id)!
    expect(edited.content).toBe('manual override')
    expect(state.messages).toHaveLength(2)
  })

  it('editing a user message truncates following turns and regenerates', async () => {
    const ctrl = createChatController({
      adapter: sequencedAdapter([
        [{ type: 'text', content: 'first reply' }, { type: 'done' }],
        [{ type: 'text', content: 'second reply' }, { type: 'done' }],
      ]),
    })

    await ctrl.send('original question')
    const userMsg = ctrl.getState().messages.find(m => m.role === 'user')!
    expect(userMsg.content).toBe('original question')

    await ctrl.edit(userMsg.id, 'revised question')

    const state = ctrl.getState()
    expect(state.messages).toHaveLength(2)
    expect(state.messages[0].content).toBe('revised question')
    expect(state.messages[1].role).toBe('assistant')
    expect(state.messages[1].content).toBe('second reply')
  })

  it('editing a user message without regeneration just truncates', async () => {
    const ctrl = createChatController({
      adapter: createMockAdapter([
        { type: 'text', content: 'reply' },
        { type: 'done' },
      ]),
    })

    await ctrl.send('hi')
    const userMsg = ctrl.getState().messages.find(m => m.role === 'user')!

    await ctrl.edit(userMsg.id, 'edited', { regenerate: false })

    const state = ctrl.getState()
    expect(state.messages).toHaveLength(1)
    expect(state.messages[0].content).toBe('edited')
    expect(state.status).toBe('idle')
  })

  it('ignores unknown message id silently', async () => {
    const ctrl = createChatController({
      adapter: createMockAdapter([
        { type: 'text', content: 'reply' },
        { type: 'done' },
      ]),
    })

    await ctrl.send('hi')
    const before = ctrl.getState().messages
    await ctrl.edit('does-not-exist', 'x')
    expect(ctrl.getState().messages).toEqual(before)
  })
})

describe('controller.regenerate', () => {
  it('regenerates the last assistant message when called with no id', async () => {
    const ctrl = createChatController({
      adapter: sequencedAdapter([
        [{ type: 'text', content: 'first' }, { type: 'done' }],
        [{ type: 'text', content: 'second' }, { type: 'done' }],
      ]),
    })

    await ctrl.send('hello')
    expect(ctrl.getState().messages[1].content).toBe('first')

    await ctrl.regenerate()

    expect(ctrl.getState().messages).toHaveLength(2)
    expect(ctrl.getState().messages[1].content).toBe('second')
  })

  it('regenerates a specific assistant message, dropping later turns', async () => {
    const ctrl = createChatController({
      adapter: sequencedAdapter([
        [{ type: 'text', content: 'A1' }, { type: 'done' }],
        [{ type: 'text', content: 'A2' }, { type: 'done' }],
        [{ type: 'text', content: 'A1-new' }, { type: 'done' }],
      ]),
    })

    await ctrl.send('first question')
    await ctrl.send('second question')

    const state = ctrl.getState()
    expect(state.messages.map(m => m.content)).toEqual([
      'first question', 'A1', 'second question', 'A2',
    ])

    const firstAssistant = state.messages.find(m => m.role === 'assistant')!
    await ctrl.regenerate(firstAssistant.id)

    const after = ctrl.getState().messages.map(m => m.content)
    expect(after).toEqual(['first question', 'A1-new'])
  })

  it('no-ops when the message list has no assistant turn', async () => {
    const ctrl = createChatController({
      adapter: createMockAdapter([{ type: 'done' }]),
    })
    await ctrl.regenerate()
    expect(ctrl.getState().messages).toHaveLength(0)
  })

  it('ignores non-existent message id silently', async () => {
    const ctrl = createChatController({
      adapter: createMockAdapter([
        { type: 'text', content: 'reply' },
        { type: 'done' },
      ]),
    })
    await ctrl.send('hi')
    const before = ctrl.getState().messages
    await ctrl.regenerate('does-not-exist')
    expect(ctrl.getState().messages).toEqual(before)
  })
})
