/**
 * Shared helpers for embedder adapters.
 */

const ERROR_BODY_PREVIEW_CHARS = 200

export async function throwIfNotOk(
  response: Response,
  label: string,
  url: string,
): Promise<void> {
  if (response.ok) return
  const body = await response.text().catch(() => '')
  throw new Error(
    `HTTP ${response.status} from ${label} ${url}: ${body.slice(0, ERROR_BODY_PREVIEW_CHARS)}`,
  )
}
