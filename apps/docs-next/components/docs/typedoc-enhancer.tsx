'use client'

import { useEffect } from 'react'

const BTN_CLASS =
  'ak-td-btn inline-flex items-center gap-1 rounded-md border border-fd-border bg-fd-card px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-ak-graphite hover:text-ak-foam'

function makeButton(label: string): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = BTN_CLASS
  btn.textContent = label
  return btn
}

function makeLink(href: string, label: string): HTMLAnchorElement {
  const a = document.createElement('a')
  a.href = href
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  a.className = BTN_CLASS
  a.textContent = label
  return a
}

function buildToolbar(code: string): HTMLDivElement {
  const bar = document.createElement('div')
  bar.setAttribute('data-ak-td-toolbar', '')
  bar.className = 'mb-1 mt-2 flex flex-wrap gap-2'

  const copy = makeButton('⧉ Copy signature')
  copy.addEventListener('click', () => {
    navigator.clipboard?.writeText(code).catch(() => {})
    const original = copy.textContent
    copy.textContent = '✓ Copied'
    window.setTimeout(() => {
      copy.textContent = original
    }, 1200)
  })
  bar.appendChild(copy)

  const playground = makeLink(
    `https://www.typescriptlang.org/play?#code/${encodeURIComponent(
      btoa(unescape(encodeURIComponent(code))),
    )}`,
    '↗ TS Playground',
  )
  bar.appendChild(playground)

  return bar
}

export function TypedocEnhancer({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return
    const article = document.querySelector('article')
    if (!article) return
    const blocks = article.querySelectorAll<HTMLPreElement>('pre')
    blocks.forEach((pre) => {
      if (pre.dataset.akTdEnhanced) return
      const code = pre.querySelector('code')
      if (!code) return
      const text = code.textContent ?? ''
      if (!/\b(function|type|interface|class|const|let|declare|export)\b/.test(text)) return
      pre.dataset.akTdEnhanced = '1'
      pre.parentNode?.insertBefore(buildToolbar(text), pre)
    })
  }, [enabled])
  return null
}
