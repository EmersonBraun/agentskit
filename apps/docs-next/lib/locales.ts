// Locale registry. Add a new language by:
//   1. Appending an entry here (status: 'planned' → 'seed' → 'partial' → 'full')
//   2. Creating `app/<code>/layout.tsx` + `app/<code>/page.tsx` (copy from `app/pt/`)
//   3. Translating content page-by-page via sibling routes

export type LocaleStatus = 'full' | 'partial' | 'seed' | 'planned'

export type Locale = {
  /** URL prefix (empty string = default / root). */
  code: string
  /** BCP 47 tag for `<html lang>` and `alternates`. */
  bcp47: string
  /** Short label used in the language switcher (2–3 chars). */
  short: string
  /** Native endonym, e.g. "Português". */
  native: string
  /** English name shown to EN speakers. */
  english: string
  /** Flag emoji for visual cue only — never use alone for identity. */
  flag: string
  /** Rollout state; gates whether the switcher links out or renders a placeholder. */
  status: LocaleStatus
}

export const LOCALES: Locale[] = [
  { code: '', bcp47: 'en', short: 'EN', native: 'English', english: 'English', flag: '🇺🇸', status: 'full' },
  { code: 'pt', bcp47: 'pt-BR', short: 'PT', native: 'Português', english: 'Portuguese (BR)', flag: '🇧🇷', status: 'seed' },
  { code: 'es', bcp47: 'es', short: 'ES', native: 'Español', english: 'Spanish', flag: '🇪🇸', status: 'planned' },
  { code: 'zh', bcp47: 'zh-CN', short: 'ZH', native: '中文', english: 'Chinese (Simplified)', flag: '🇨🇳', status: 'planned' },
]

export const DEFAULT_LOCALE = LOCALES[0]

export function localeFromPath(path: string): Locale {
  const seg = (path.split('/').filter(Boolean)[0] ?? '').toLowerCase()
  const hit = LOCALES.find((l) => l.code && l.code === seg)
  return hit ?? DEFAULT_LOCALE
}

export function pathForLocale(targetCode: string, currentPath: string): string {
  const parts = currentPath.split('/').filter(Boolean)
  const current = localeFromPath(currentPath)
  const rest = current.code ? parts.slice(1) : parts
  const prefix = targetCode ? `/${targetCode}` : ''
  const tail = rest.length ? `/${rest.join('/')}` : ''
  return prefix + tail || '/'
}

export function alternatesFor(currentPath: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const l of LOCALES) {
    if (l.status === 'planned') continue
    out[l.bcp47] = pathForLocale(l.code, currentPath)
  }
  return out
}
