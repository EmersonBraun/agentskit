'use client'

import { useCallback, useState } from 'react'

export function HeadingAnchor({ id }: { id?: string }) {
  const [copied, setCopied] = useState(false)
  const onClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!id) return
      e.preventDefault()
      const url = `${window.location.origin}${window.location.pathname}#${id}`
      history.replaceState(null, '', `#${id}`)
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).catch(() => {})
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    },
    [id],
  )
  if (!id) return null
  return (
    <a
      href={`#${id}`}
      onClick={onClick}
      className="ak-anchor"
      data-copied={copied || undefined}
      aria-label="Copy link to this section"
    >
      #
    </a>
  )
}
