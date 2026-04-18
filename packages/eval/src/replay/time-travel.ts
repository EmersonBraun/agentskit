import type { StreamChunk } from '@agentskit/core'
import type { Cassette, CassetteEntry } from './types'

export interface TimeTravelSession {
  /** Total number of chunks across all entries (flattened). */
  readonly length: number
  /** Current cursor into the flattened chunk timeline (0-based). */
  readonly cursor: number
  /** Return the chunk at a specific absolute index without moving the cursor. */
  peek: (index: number) => StreamChunk | undefined
  /** Advance cursor by one chunk and return it. */
  step: () => StreamChunk | undefined
  /** Move cursor to an arbitrary absolute index. */
  seek: (index: number) => void
  /** Replace a chunk at an absolute index. Returns the prior value. */
  override: (index: number, chunk: StreamChunk) => StreamChunk | undefined
  /**
   * Fork the session at a given cursor: returns a new Cassette that
   * contains every chunk up to (but not including) `index`, with any
   * pending overrides applied. The cassette can be handed to
   * `createReplayAdapter` to resume execution from the fork point.
   */
  fork: (index: number) => Cassette
  /** Snapshot of the (possibly mutated) cassette. */
  snapshot: () => Cassette
}

interface FlatIndex {
  entry: number
  chunk: number
}

function flatten(entries: CassetteEntry[]): FlatIndex[] {
  const out: FlatIndex[] = []
  entries.forEach((e, entry) => {
    e.chunks.forEach((_, chunk) => out.push({ entry, chunk }))
  })
  return out
}

/**
 * Wrap a cassette in a cursor-based API. Lets a debugger step through
 * a recorded session, rewrite tool results or text chunks, and fork a
 * new cassette at any point to replay alternate histories.
 */
export function createTimeTravelSession(cassette: Cassette): TimeTravelSession {
  const working: Cassette = {
    version: cassette.version,
    seed: cassette.seed,
    metadata: cassette.metadata,
    entries: cassette.entries.map(e => ({
      request: e.request,
      chunks: e.chunks.slice(),
    })),
  }
  let map = flatten(working.entries)
  let cursor = 0

  const resolve = (index: number): FlatIndex | undefined => map[index]

  const chunkAt = (index: number): StreamChunk | undefined => {
    const loc = resolve(index)
    if (!loc) return undefined
    return working.entries[loc.entry]!.chunks[loc.chunk]
  }

  return {
    get length() {
      return map.length
    },
    get cursor() {
      return cursor
    },
    peek: chunkAt,
    step() {
      const v = chunkAt(cursor)
      if (v !== undefined) cursor++
      return v
    },
    seek(index) {
      if (index < 0 || index > map.length) throw new RangeError(`seek out of range: ${index}`)
      cursor = index
    },
    override(index, chunk) {
      const loc = resolve(index)
      if (!loc) throw new RangeError(`override out of range: ${index}`)
      const entry = working.entries[loc.entry]!
      const prior = entry.chunks[loc.chunk]
      entry.chunks[loc.chunk] = chunk
      return prior
    },
    fork(index) {
      if (index < 0 || index > map.length) throw new RangeError(`fork out of range: ${index}`)
      const loc: FlatIndex | undefined = index === map.length
        ? { entry: working.entries.length, chunk: 0 }
        : resolve(index)
      const forked: CassetteEntry[] = []
      for (let i = 0; i < working.entries.length; i++) {
        const e = working.entries[i]!
        if (!loc || i < loc.entry) {
          forked.push({ request: e.request, chunks: e.chunks.slice() })
        } else if (i === loc.entry && loc.chunk > 0) {
          forked.push({ request: e.request, chunks: e.chunks.slice(0, loc.chunk) })
        } else {
          break
        }
      }
      return {
        version: working.version,
        seed: working.seed,
        metadata: working.metadata,
        entries: forked,
      }
    },
    snapshot() {
      map = flatten(working.entries)
      return {
        version: working.version,
        seed: working.seed,
        metadata: working.metadata,
        entries: working.entries.map(e => ({ request: e.request, chunks: e.chunks.slice() })),
      }
    },
  }
}
