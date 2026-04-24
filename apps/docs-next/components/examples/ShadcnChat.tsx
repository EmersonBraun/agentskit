'use client'

import { useMemo, type FormEvent, type KeyboardEvent } from 'react'
import { useChat } from '@agentskit/react'
import { createMockAdapter, initialAssistant } from './_shared/mock-adapter'

/**
 * shadcn/ui styled chat. AgentsKit ships the hook (useChat) and the tokens
 * via `data-ak-*` selectors — the UI here is fully custom, written in the
 * shadcn idiom: zinc palette, 0.5rem radii, subtle borders, Lucide-style
 * icons, and shadcn's Button + Textarea look-and-feel.
 */
export function ShadcnChat() {
  const adapter = useMemo(
    () =>
      createMockAdapter([
        {
          text: "Swapping the skin — the same `useChat` hook drives this conversation. Every surface is just `data-ak-*` + your design system's tokens.",
        },
        {
          text: "Try it: paste the shadcn/ui theme into `globals.css`, drop `useChat` in, and you get a streaming chat that feels native.",
        },
      ]),
    [],
  )
  const chat = useChat({
    adapter,
    initialMessages: [initialAssistant('Ask anything — styled with shadcn/ui tokens.')],
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
      className="flex h-[520px] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
    >
      <header className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <Avatar initials="AK" />
        <div>
          <div className="text-sm font-semibold">AgentsKit assistant</div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            online
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {visible.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} />
        ))}
        {chat.status === 'streaming' ? <TypingIndicator /> : null}
      </div>

      <form
        onSubmit={submit}
        className="flex items-end gap-2 border-t border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
      >
        <textarea
          value={chat.input}
          onChange={(e) => chat.setInput(e.target.value)}
          onKeyDown={keyDown}
          rows={1}
          placeholder="Type a message…"
          className="flex-1 resize-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-600 dark:focus-visible:ring-zinc-700"
        />
        <button
          type="submit"
          disabled={!chat.input.trim() || chat.status === 'streaming'}
          className="inline-flex h-9 items-center justify-center gap-1 rounded-md bg-zinc-900 px-3 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <SendIcon />
          Send
        </button>
      </form>
    </div>
  )
}

function MessageBubble({ role, content }: { role: string; content: string }) {
  const user = role === 'user'
  return (
    <div className={`flex items-end gap-2 ${user ? 'justify-end' : 'justify-start'}`}>
      {!user ? <Avatar initials="AK" small /> : null}
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          user
            ? 'rounded-br-md bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
            : 'rounded-bl-md border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'
        }`}
      >
        {content}
      </div>
      {user ? <Avatar initials="You" small /> : null}
    </div>
  )
}

function Avatar({ initials, small = false }: { initials: string; small?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 ${
        small ? 'h-7 w-7' : 'h-9 w-9'
      }`}
    >
      {initials}
    </span>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <Avatar initials="AK" small />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-.3s] dark:bg-zinc-500" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-.15s] dark:bg-zinc-500" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500" />
      </div>
    </div>
  )
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="m22 2-7 20-4-9-9-4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
