'use client'

import { useMemo, type FormEvent, type KeyboardEvent } from 'react'
import { useChat } from '@agentskit/react'
import { createMockAdapter, initialAssistant } from './_shared/mock-adapter'

/**
 * Material UI styled chat. Roboto typography, 2dp elevation on the outer card,
 * 4px radii, primary blue (#1976d2), outlined text field, contained send
 * button with a ripple-style hover, and a secondary avatar badge.
 * Drives state via `useChat` — everything else is pure Material UI idiom.
 */
export function MuiChat() {
  const adapter = useMemo(
    () =>
      createMockAdapter([
        {
          text: 'Swap the design system, keep the hook. AgentsKit components emit `data-ak-*` hooks — Material UI paints them.',
        },
        {
          text: 'No theme provider required for the demo, but a real app would wrap this in `<ThemeProvider>` with your MUI palette.',
        },
      ]),
    [],
  )
  const chat = useChat({
    adapter,
    initialMessages: [initialAssistant('Ask anything — styled with Material UI tokens.')],
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = chat.input.trim()
    if (!value || chat.status === 'streaming') return
    void chat.send(value)
  }

  const keyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(e as unknown as FormEvent)
    }
  }

  const visible = chat.messages.filter((m) => m.role !== 'tool')

  return (
    <div
      data-ak-example
      className="ak-mui flex h-[540px] flex-col overflow-hidden rounded border border-slate-200 bg-white font-['Roboto',_sans-serif] text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
    >
      <header className="flex items-center justify-between gap-2 bg-[#1976d2] px-4 py-3 text-white shadow-[0_2px_4px_-1px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-3">
          <Avatar initials="AK" />
          <div>
            <div className="text-[0.95rem] font-medium tracking-wide">AgentsKit Assistant</div>
            <div className="text-[0.75rem] opacity-80">material design · online</div>
          </div>
        </div>
        <IconButton aria-label="info">
          <InfoIcon />
        </IconButton>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-[#fafafa] px-4 py-4 dark:bg-slate-950">
        {visible.map((m) => (
          <Bubble key={m.id} role={m.role} content={m.content} />
        ))}
        {chat.status === 'streaming' ? <Typing /> : null}
      </div>

      <form onSubmit={submit} className="flex items-end gap-3 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <label className="relative flex-1">
          <textarea
            value={chat.input}
            onChange={(e) => chat.setInput(e.target.value)}
            onKeyDown={keyDown}
            rows={1}
            placeholder=" "
            className="peer w-full resize-none rounded border border-slate-300 bg-transparent px-3 pb-2 pt-4 text-sm outline-none transition focus:border-[#1976d2] focus:shadow-[inset_0_-1px_0_0_#1976d2] dark:border-slate-700 dark:focus:border-[#90caf9]"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 transition peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[0.65rem] peer-focus:text-[#1976d2] peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:translate-y-0 peer-[&:not(:placeholder-shown)]:text-[0.65rem] dark:text-slate-400">
            Message
          </span>
        </label>
        <button
          type="submit"
          disabled={!chat.input.trim() || chat.status === 'streaming'}
          className="inline-flex h-10 items-center gap-1 rounded bg-[#1976d2] px-4 text-sm font-medium uppercase tracking-wider text-white shadow-[0_2px_2px_0_rgba(0,0,0,0.14),0_3px_1px_-2px_rgba(0,0,0,0.2),0_1px_5px_0_rgba(0,0,0,0.12)] transition hover:bg-[#1565c0] active:shadow-[0_5px_5px_-3px_rgba(0,0,0,0.2),0_8px_10px_1px_rgba(0,0,0,0.14),0_3px_14px_2px_rgba(0,0,0,0.12)] disabled:pointer-events-none disabled:opacity-50"
        >
          <SendIcon />
          Send
        </button>
      </form>
    </div>
  )
}

function Bubble({ role, content }: { role: string; content: string }) {
  const user = role === 'user'
  return (
    <div className={`flex items-end gap-2 ${user ? 'justify-end' : 'justify-start'}`}>
      {!user ? <Avatar initials="AK" small /> : null}
      <div
        className={`max-w-[76%] rounded px-3.5 py-2 text-sm leading-relaxed ${
          user
            ? 'rounded-br-sm bg-[#1976d2] text-white shadow-[0_1px_2px_rgba(0,0,0,0.14),0_1px_1px_rgba(0,0,0,0.12)]'
            : 'rounded-bl-sm bg-white text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.06)] dark:bg-slate-800 dark:text-slate-100'
        }`}
      >
        {content}
      </div>
      {user ? <Avatar initials="You" small variant="secondary" /> : null}
    </div>
  )
}

function Avatar({
  initials,
  small = false,
  variant = 'primary',
}: {
  initials: string
  small?: boolean
  variant?: 'primary' | 'secondary'
}) {
  const base =
    variant === 'primary'
      ? 'bg-[#1976d2] text-white'
      : 'bg-[#f50057] text-white'
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-[0.65rem] font-semibold tracking-wider ${base} ${
        small ? 'h-7 w-7' : 'h-9 w-9'
      }`}
    >
      {initials}
    </span>
  )
}

function Typing() {
  return (
    <div className="flex items-center gap-2">
      <Avatar initials="AK" small />
      <div className="flex items-center gap-1 rounded bg-white px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:bg-slate-800">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1976d2] [animation-delay:-.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1976d2] [animation-delay:-.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1976d2]" />
      </div>
    </div>
  )
}

function IconButton({ children, ...props }: React.HTMLAttributes<HTMLButtonElement> & { 'aria-label': string }) {
  return (
    <button
      type="button"
      {...props}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10 active:bg-white/20"
    >
      {children}
    </button>
  )
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  )
}
