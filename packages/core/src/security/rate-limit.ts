export interface RateLimitBucket {
  /** Tokens available per window. */
  capacity: number
  /** Tokens refilled per `windowMs`. */
  refill: number
  /** Refill interval in ms. */
  windowMs: number
}

export interface RateLimitDecision {
  allowed: boolean
  remaining: number
  /** Milliseconds until the next token is available (0 when allowed). */
  retryAfterMs: number
  key: string
  bucket: string
}

export interface RateLimiterOptions<TContext = unknown> {
  /** Extract the key to bucket against — user id, IP, API key, etc. */
  keyOf: (context: TContext) => string
  /** Buckets keyed by name — caller selects via `bucketOf`. */
  buckets: Record<string, RateLimitBucket>
  /** Pick the bucket for a given context. Default: 'default'. */
  bucketOf?: (context: TContext) => string
  /** Clock override for tests. */
  now?: () => number
}

export interface RateLimiter<TContext = unknown> {
  check: (context: TContext) => RateLimitDecision
  /** Drop bucket state for a specific key (e.g. on logout). */
  reset: (key: string) => void
  /** Current state snapshot — tests + dashboards. */
  inspect: () => Array<{ key: string; bucket: string; tokens: number }>
}

interface BucketState {
  tokens: number
  lastRefillMs: number
}

/**
 * Token-bucket rate limiter. Per-key state is in-memory — for
 * multi-process deployments, swap in a Redis-backed implementation
 * with the same `RateLimiter` contract.
 */
export function createRateLimiter<TContext = unknown>(
  options: RateLimiterOptions<TContext>,
): RateLimiter<TContext> {
  const bucketNames = Object.keys(options.buckets)
  if (bucketNames.length === 0) throw new Error('createRateLimiter requires ≥ 1 bucket')
  const pickBucket = options.bucketOf ?? ((): string => 'default')
  const clock = options.now ?? ((): number => Date.now())
  const state = new Map<string, BucketState>()

  const refill = (s: BucketState, cfg: RateLimitBucket, now: number): void => {
    const elapsed = now - s.lastRefillMs
    if (elapsed <= 0) return
    const windows = elapsed / cfg.windowMs
    if (windows >= 1) {
      s.tokens = Math.min(cfg.capacity, s.tokens + Math.floor(windows) * cfg.refill)
      s.lastRefillMs += Math.floor(windows) * cfg.windowMs
    }
  }

  return {
    check(context) {
      const key = options.keyOf(context)
      const bucketName = pickBucket(context)
      const cfg = options.buckets[bucketName]
      if (!cfg) throw new Error(`unknown rate-limit bucket: ${bucketName}`)
      const stateKey = `${bucketName}::${key}`
      const now = clock()

      let s = state.get(stateKey)
      if (!s) {
        s = { tokens: cfg.capacity, lastRefillMs: now }
        state.set(stateKey, s)
      } else {
        refill(s, cfg, now)
      }

      if (s.tokens > 0) {
        s.tokens--
        return { allowed: true, remaining: s.tokens, retryAfterMs: 0, key, bucket: bucketName }
      }
      const msUntilNext = cfg.windowMs - ((now - s.lastRefillMs) % cfg.windowMs)
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: msUntilNext,
        key,
        bucket: bucketName,
      }
    },

    reset(key) {
      for (const stateKey of Array.from(state.keys())) {
        if (stateKey.endsWith(`::${key}`)) state.delete(stateKey)
      }
    },

    inspect() {
      return Array.from(state, ([key, s]) => {
        const [bucket, rest] = key.split('::')
        return { bucket: bucket!, key: rest!, tokens: s.tokens }
      })
    },
  }
}
