'use client'

import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useSyncExternalStore,
} from 'react'

const STORAGE_KEY = 'ak:framework'
const EVENT = 'ak:framework-change'

const DEFAULT_ORDER = [
  'react',
  'vue',
  'svelte',
  'solid',
  'angular',
  'react-native',
  'ink',
  'node',
  'cli',
] as const

const LABELS: Record<string, string> = {
  react: 'React',
  vue: 'Vue',
  svelte: 'Svelte',
  solid: 'Solid',
  angular: 'Angular',
  'react-native': 'React Native',
  ink: 'Ink',
  node: 'Node',
  cli: 'CLI',
}

function readStored(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function subscribe(cb: () => void) {
  if (typeof window === 'undefined') return () => {}
  const handler = () => cb()
  window.addEventListener(EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}

function useFramework() {
  return useSyncExternalStore(subscribe, readStored, () => null)
}

function setFramework(value: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT))
}

type FrameworkProps = {
  name: string
  label?: string
  children: ReactNode
}

export function Framework({ children }: FrameworkProps) {
  // Rendered by <FrameworkTabs>. Standalone use renders nothing.
  return <>{children}</>
}

type FrameworkTabsProps = {
  children: ReactNode
  /** Order/whitelist of framework values. */
  order?: readonly string[]
  /** Default when no preference stored. */
  defaultValue?: string
}

function collect(children: ReactNode): ReactElement<FrameworkProps>[] {
  const list: ReactElement<FrameworkProps>[] = []
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    if ((child.type as { displayName?: string })?.displayName === 'Framework' || child.type === Framework) {
      list.push(child as ReactElement<FrameworkProps>)
    }
  })
  return list
}

export function FrameworkTabs({ children, order = DEFAULT_ORDER, defaultValue }: FrameworkTabsProps) {
  const items = collect(children)
  const active = useFramework()
  const values = items.map((i) => i.props.name)
  const sorted = [...items].sort((a, b) => {
    const ai = order.indexOf(a.props.name)
    const bi = order.indexOf(b.props.name)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })

  const resolved = active && values.includes(active) ? active : (defaultValue ?? sorted[0]?.props.name)

  const choose = useCallback((name: string) => setFramework(name), [])

  useEffect(() => {
    if (!active && defaultValue && values.includes(defaultValue)) {
      setFramework(defaultValue)
    }
  }, [active, defaultValue, values])

  if (sorted.length === 0) return null

  return (
    <div data-ak-framework-tabs className="my-6 overflow-hidden rounded-lg border border-ak-border">
      <div
        role="tablist"
        aria-label="Framework"
        className="flex flex-wrap gap-1 border-b border-ak-border bg-ak-surface p-1"
      >
        {sorted.map((item) => {
          const name = item.props.name
          const isActive = name === resolved
          return (
            <button
              key={name}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => choose(name)}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? 'bg-ak-foam text-ak-midnight'
                  : 'text-ak-graphite hover:bg-ak-midnight hover:text-ak-foam'
              }`}
            >
              {item.props.label ?? LABELS[name] ?? name}
            </button>
          )
        })}
      </div>
      <div className="p-4">
        {sorted.map((item) => (
          <div
            key={item.props.name}
            role="tabpanel"
            hidden={item.props.name !== resolved}
            aria-hidden={item.props.name !== resolved}
          >
            {item.props.children}
          </div>
        ))}
      </div>
    </div>
  )
}
;(Framework as unknown as { displayName: string }).displayName = 'Framework'
