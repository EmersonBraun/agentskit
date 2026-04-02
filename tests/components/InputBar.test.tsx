import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { InputBar } from '../../src/components/InputBar'
import type { ChatReturn } from '../../src/core/types'

function mockChat(overrides?: Partial<ChatReturn>): ChatReturn {
  return {
    messages: [],
    send: vi.fn(),
    stop: vi.fn(),
    retry: vi.fn(),
    status: 'idle',
    input: '',
    setInput: vi.fn(),
    ...overrides,
  }
}

describe('InputBar', () => {
  it('renders an input and submit button', () => {
    render(<InputBar chat={mockChat()} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls setInput on input change', () => {
    const chat = mockChat()
    render(<InputBar chat={chat} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hi' } })
    expect(chat.setInput).toHaveBeenCalledWith('Hi')
  })

  it('calls send on form submit', () => {
    const chat = mockChat({ input: 'Hello' })
    render(<InputBar chat={chat} />)
    fireEvent.submit(screen.getByRole('textbox').closest('form')!)
    expect(chat.send).toHaveBeenCalledWith('Hello')
  })

  it('disables input when disabled prop is true', () => {
    render(<InputBar chat={mockChat()} disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('applies custom placeholder', () => {
    render(<InputBar chat={mockChat()} placeholder="Ask anything..." />)
    expect(screen.getByPlaceholderText('Ask anything...')).toBeInTheDocument()
  })
})
