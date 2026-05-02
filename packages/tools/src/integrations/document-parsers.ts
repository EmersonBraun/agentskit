import { ConfigError, ErrorCodes, ToolError, defineTool } from '@agentskit/core'

/**
 * Document parsing tools. The underlying parsers (`pdf-parse`,
 * `mammoth`, `xlsx`, ...) are heavy and native-dep-prone — instead
 * of bundling them, accept BYO parser functions that match the
 * minimal contract below.
 */

export interface DocumentParserFns {
  parsePdf?: (bytes: Uint8Array) => Promise<{ text: string; pages?: number }> | { text: string; pages?: number }
  parseDocx?: (bytes: Uint8Array) => Promise<{ text: string }> | { text: string }
  parseXlsx?: (bytes: Uint8Array) => Promise<{ sheets: Array<{ name: string; rows: Array<Array<string | number | null>> }> }> | { sheets: Array<{ name: string; rows: Array<Array<string | number | null>> }> }
}

export interface DocumentParsersConfig extends DocumentParserFns {
  /** Custom fetch (tests). */
  fetch?: typeof globalThis.fetch
}

async function download(url: string, fetchImpl: typeof globalThis.fetch): Promise<Uint8Array> {
  const response = await fetchImpl(url)
  if (!response.ok) {
    throw new ToolError({
      code: ErrorCodes.AK_TOOL_EXEC_FAILED,
      message: `fetch ${response.status}: ${url}`,
    })
  }
  const buf = await response.arrayBuffer()
  return new Uint8Array(buf)
}

export function parsePdf(config: DocumentParsersConfig) {
  return defineTool({
    name: 'parse_pdf',
    description: 'Extract text from a PDF file referenced by URL.',
    schema: {
      type: 'object',
      properties: { url: { type: 'string' } },
      required: ['url'],
    } as const,
    async execute({ url }) {
      if (!config.parsePdf) {
        throw new ConfigError({
          code: ErrorCodes.AK_CONFIG_INVALID,
          message: 'parse_pdf: no parsePdf function configured',
          hint: 'Pass parsePdf in DocumentParsersConfig (e.g. wrap pdf-parse).',
        })
      }
      const bytes = await download(String(url), config.fetch ?? globalThis.fetch)
      const { text, pages } = await config.parsePdf(bytes)
      return { text, pages }
    },
  })
}

export function parseDocx(config: DocumentParsersConfig) {
  return defineTool({
    name: 'parse_docx',
    description: 'Extract text from a DOCX file referenced by URL.',
    schema: {
      type: 'object',
      properties: { url: { type: 'string' } },
      required: ['url'],
    } as const,
    async execute({ url }) {
      if (!config.parseDocx) {
        throw new ConfigError({
          code: ErrorCodes.AK_CONFIG_INVALID,
          message: 'parse_docx: no parseDocx function configured',
          hint: 'Pass parseDocx in DocumentParsersConfig (e.g. wrap mammoth).',
        })
      }
      const bytes = await download(String(url), config.fetch ?? globalThis.fetch)
      const { text } = await config.parseDocx(bytes)
      return { text }
    },
  })
}

export function parseXlsx(config: DocumentParsersConfig) {
  return defineTool({
    name: 'parse_xlsx',
    description: 'Extract sheets + rows from an XLSX workbook referenced by URL.',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        sheet: { type: 'string', description: 'Return just this sheet if provided.' },
      },
      required: ['url'],
    } as const,
    async execute({ url, sheet }) {
      if (!config.parseXlsx) {
        throw new ConfigError({
          code: ErrorCodes.AK_CONFIG_INVALID,
          message: 'parse_xlsx: no parseXlsx function configured',
          hint: 'Pass parseXlsx in DocumentParsersConfig (e.g. wrap xlsx).',
        })
      }
      const bytes = await download(String(url), config.fetch ?? globalThis.fetch)
      const parsed = await config.parseXlsx(bytes)
      if (sheet) return parsed.sheets.filter(s => s.name === sheet)
      return parsed.sheets
    },
  })
}

export function documentParsers(config: DocumentParsersConfig) {
  const tools = []
  if (config.parsePdf) tools.push(parsePdf(config))
  if (config.parseDocx) tools.push(parseDocx(config))
  if (config.parseXlsx) tools.push(parseXlsx(config))
  return tools
}
