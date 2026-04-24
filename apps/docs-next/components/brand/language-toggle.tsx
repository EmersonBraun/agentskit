'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { LOCALES, localeFromPath, pathForLocale } from '@/lib/locales'

export function LanguageToggle() {
  const path = usePathname() ?? '/'
  const current = localeFromPath(path)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className="inline-flex h-7 items-center gap-1.5 rounded border border-ak-border bg-ak-surface px-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-ak-graphite transition hover:border-ak-foam hover:text-ak-foam"
      >
        <span aria-hidden>{current.flag}</span>
        <span>{current.short}</span>
        <span aria-hidden className="text-[8px]">▾</span>
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Languages"
          className="absolute right-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-md border border-ak-border bg-ak-midnight shadow-xl"
        >
          {LOCALES.map((l) => {
            const isCurrent = l.code === current.code
            const isPlanned = l.status === 'planned'
            const label = (
              <>
                <span className="w-6 text-base leading-none" aria-hidden>
                  {l.flag}
                </span>
                <span className="flex flex-col text-left">
                  <span className="font-mono text-xs font-semibold text-white">{l.native}</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-ak-graphite">
                    {l.english} · {l.status}
                  </span>
                </span>
              </>
            )
            if (isPlanned) {
              return (
                <li
                  key={l.bcp47}
                  role="option"
                  aria-selected={false}
                  aria-disabled="true"
                  className="flex w-full cursor-not-allowed items-center gap-3 px-3 py-2 opacity-50"
                  title="Translation not yet available — help wanted"
                >
                  {label}
                </li>
              )
            }
            const href = pathForLocale(l.code, path)
            return (
              <li key={l.bcp47} role="option" aria-selected={isCurrent}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex w-full items-center gap-3 px-3 py-2 hover:bg-ak-surface ${
                    isCurrent ? 'bg-ak-surface' : ''
                  }`}
                >
                  {label}
                </Link>
              </li>
            )
          })}
          <li className="border-t border-ak-border px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-ak-graphite">
            <a
              href="https://github.com/AgentsKit-io/agentskit/issues/new?title=docs(i18n)%3A%20"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ak-foam"
            >
              Help translate →
            </a>
          </li>
        </ul>
      ) : null}
    </div>
  )
}
