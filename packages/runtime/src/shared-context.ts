export interface SharedContext {
  get: (key: string) => unknown
  set: (key: string, value: unknown) => void
  entries: () => Record<string, unknown>
  readOnly: () => ReadonlySharedContext
}

export interface ReadonlySharedContext {
  get: (key: string) => unknown
  entries: () => Record<string, unknown>
}

export function createSharedContext(
  initial?: Record<string, unknown>,
): SharedContext {
  const store = new Map<string, unknown>(
    initial ? Object.entries(initial) : [],
  )

  return {
    get: (key: string) => store.get(key),
    set: (key: string, value: unknown) => { store.set(key, value) },
    entries: () => Object.fromEntries(store),
    readOnly: () => ({
      get: (key: string) => store.get(key),
      entries: () => Object.fromEntries(store),
    }),
  }
}
