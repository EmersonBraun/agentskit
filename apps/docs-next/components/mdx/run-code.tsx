'use client'

import { useState, type ReactNode } from 'react'
import { Playground } from './playground'
import { PRESETS } from './playground-presets'

export type RunCodeProps = {
  /** Preset key from playground-presets. */
  preset?: keyof typeof PRESETS
  /** Inline files, overrides preset. */
  files?: Record<string, string>
  /** Entry file if passing `files`. */
  entry?: string
  /** Extra deps. */
  dependencies?: Record<string, string>
  /** The rendered code block from MDX. */
  children: ReactNode
}

export function RunCode({ preset, files, entry, dependencies, children }: RunCodeProps) {
  const [running, setRunning] = useState(false)

  if (running) {
    return (
      <div data-ak-runcode className="my-6">
        <Playground preset={preset} files={files} entry={entry} dependencies={dependencies} eager />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setRunning(false)}
            className="rounded-md border border-ak-border bg-ak-surface px-3 py-1 font-mono text-xs text-ak-graphite hover:text-ak-foam"
          >
            ← back to code
          </button>
        </div>
      </div>
    )
  }

  return (
    <div data-ak-runcode className="relative my-6">
      {children}
      <button
        type="button"
        onClick={() => setRunning(true)}
        className="absolute right-3 top-3 rounded-md bg-ak-foam px-3 py-1 font-mono text-xs font-semibold text-ak-midnight shadow-lg transition hover:bg-white"
        aria-label="Run this code in a live playground"
      >
        Run ▶
      </button>
    </div>
  )
}
