'use client'

import { lazy, Suspense, useMemo, useState } from 'react'
import { PRESETS, type PlaygroundPreset } from './playground-presets'

const SandpackLazy = lazy(async () => {
  const mod = await import('@codesandbox/sandpack-react')
  return {
    default: function SandpackInner(props: {
      files: Record<string, string>
      entry: string
      dependencies?: Record<string, string>
    }) {
      const { Sandpack } = mod
      return (
        <Sandpack
          template="react"
          theme="dark"
          files={props.files}
          options={{
            showLineNumbers: true,
            showInlineErrors: true,
            editorHeight: 480,
            activeFile: props.entry,
          }}
          customSetup={{
            dependencies: {
              react: '^19.0.0',
              'react-dom': '^19.0.0',
              ...(props.dependencies ?? {}),
            },
          }}
        />
      )
    },
  }
})

export type PlaygroundProps = {
  /** Preset name from playground-presets (e.g. `basic-chat`). */
  preset?: keyof typeof PRESETS
  /** Inline files. Overrides preset if set. */
  files?: Record<string, string>
  /** Entry file path (default `/App.tsx`). */
  entry?: string
  /** Extra npm deps. */
  dependencies?: Record<string, string>
  /** Render immediately instead of requiring a click (heavier LCP). */
  eager?: boolean
  /** Optional title shown above the playground. */
  title?: string
}

export function Playground({
  preset,
  files,
  entry,
  dependencies,
  eager = false,
  title,
}: PlaygroundProps) {
  const [open, setOpen] = useState(eager)

  const resolved = useMemo<PlaygroundPreset | null>(() => {
    if (files) {
      return {
        name: title ?? 'Playground',
        description: '',
        entry: entry ?? '/App.tsx',
        files,
        dependencies,
      }
    }
    if (preset && PRESETS[preset]) {
      const p = PRESETS[preset]
      return { ...p, entry: entry ?? p.entry, dependencies: dependencies ?? p.dependencies }
    }
    return null
  }, [preset, files, entry, dependencies, title])

  if (!resolved) {
    return (
      <div className="my-6 rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-300">
        Playground: unknown preset <code>{String(preset)}</code>. Pass <code>files</code> or a valid <code>preset</code>.
      </div>
    )
  }

  if (!open) {
    return (
      <div
        data-ak-playground-placeholder
        className="my-6 flex flex-col items-center justify-center gap-3 rounded-lg border border-ak-border bg-ak-surface p-8 text-center"
      >
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-ak-graphite">
          Live playground · runs in your browser
        </div>
        <div className="font-display text-lg font-semibold text-white">{resolved.name}</div>
        {resolved.description ? (
          <p className="max-w-md text-sm text-ak-foam">{resolved.description}</p>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md bg-ak-foam px-4 py-2 text-sm font-semibold text-ak-midnight transition hover:bg-white"
        >
          Run playground →
        </button>
      </div>
    )
  }

  return (
    <div data-ak-playground className="my-6 overflow-hidden rounded-lg border border-ak-border">
      {title ? (
        <div className="border-b border-ak-border bg-ak-surface px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-ak-graphite">
          {title}
        </div>
      ) : null}
      <Suspense
        fallback={
          <div className="flex h-[480px] items-center justify-center bg-ak-midnight text-sm text-ak-graphite">
            Loading playground…
          </div>
        }
      >
        <SandpackLazy
          files={resolved.files}
          entry={resolved.entry}
          dependencies={resolved.dependencies}
        />
      </Suspense>
    </div>
  )
}
