'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  createInMemoryPersonalization,
  renderProfileContext,
  type PersonalizationProfile,
} from '@agentskit/memory/personalization'

const SEED: Record<string, string> = {
  diet: 'vegan',
  allergies: 'gluten',
  cuisine: 'mediterranean, indian',
}

export function MemoryRecallExample() {
  const store = useMemo(() => createInMemoryPersonalization(), [])
  const [profile, setProfile] = useState<PersonalizationProfile | null>(null)
  const [k, setK] = useState('')
  const [v, setV] = useState('')

  const refresh = async () => setProfile(await store.get('rebeca'))

  useEffect(() => {
    void (async () => {
      await store.merge('rebeca', SEED)
      await refresh()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store])

  const add = async () => {
    if (!k.trim()) return
    await store.merge('rebeca', { [k.trim()]: v.trim() })
    setK('')
    setV('')
    await refresh()
  }

  const remove = async (key: string) => {
    if (!profile) return
    const next = { ...profile.traits }
    delete next[key]
    await store.set({ ...profile, traits: next, updatedAt: new Date().toISOString() })
    await refresh()
  }

  const clear = async () => {
    await store.delete?.('rebeca')
    await refresh()
  }

  const context = renderProfileContext(profile)
  const traits = profile?.traits ?? {}
  const entries = Object.entries(traits)

  return (
    <div data-ak-example className="flex flex-col gap-3 rounded-lg border border-ak-border bg-ak-surface p-4">
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="text-ak-graphite">@agentskit/memory · createInMemoryPersonalization</span>
        <span className="text-ak-graphite">subject: rebeca</span>
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-ak-border bg-ak-midnight p-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-ak-foam">stored facts ({entries.length})</span>
          <button
            type="button"
            onClick={clear}
            className="rounded-md border border-ak-border px-2 py-0.5 font-mono text-[10px] text-ak-graphite hover:text-ak-red"
          >
            clear
          </button>
        </div>
        {entries.length === 0 && (
          <div className="font-mono text-[11px] text-ak-graphite">— empty —</div>
        )}
        {entries.map(([key, val]) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-md border border-ak-blue/30 bg-ak-blue/5 px-2.5 py-1.5"
          >
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-ak-blue">●</span>
              <span className="text-ak-graphite">{key}:</span>
              <span className="text-ak-foam">{String(val)}</span>
            </div>
            <button
              type="button"
              onClick={() => remove(key)}
              className="font-mono text-[10px] text-ak-graphite hover:text-ak-red"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={k}
          onChange={e => setK(e.target.value)}
          placeholder="key"
          className="w-32 rounded-md border border-ak-border bg-ak-midnight px-2 py-1.5 font-mono text-xs text-ak-foam outline-none focus:border-ak-blue"
        />
        <input
          value={v}
          onChange={e => setV(e.target.value)}
          placeholder="value"
          className="flex-1 rounded-md border border-ak-border bg-ak-midnight px-2 py-1.5 font-mono text-xs text-ak-foam outline-none focus:border-ak-blue"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-md bg-ak-blue/20 px-3 py-1.5 font-mono text-xs text-ak-blue"
        >
          + merge
        </button>
      </div>

      <div className="rounded-md border border-ak-border bg-ak-midnight p-3">
        <div className="mb-1 font-mono text-[10px] text-ak-graphite">
          renderProfileContext(profile) · injected into system prompt
        </div>
        <pre className="whitespace-pre-wrap font-mono text-[11px] text-ak-foam">
          {context || '— no traits, nothing rendered —'}
        </pre>
      </div>

      <div className="font-mono text-[10px] text-ak-graphite">
        store backends: in-memory · sqlite · turso · redis · custom
      </div>
    </div>
  )
}
