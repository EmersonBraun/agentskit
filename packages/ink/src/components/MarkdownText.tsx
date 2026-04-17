import React, { useMemo } from 'react'
import { Text } from 'ink'
import { Marked } from 'marked'
import { markedTerminal } from 'marked-terminal'

export interface MarkdownTextProps {
  content: string
}

// ANSI escape helpers — marked-terminal relies on chalk by default, but we
// want a small, dependency-free palette we control directly so the output
// plays well inside Ink's <Text>.
const BOLD_ON = '\x1b[1m'
const BOLD_OFF = '\x1b[22m'
const ITALIC_ON = '\x1b[3m'
const ITALIC_OFF = '\x1b[23m'
const UNDERLINE_ON = '\x1b[4m'
const UNDERLINE_OFF = '\x1b[24m'
const DIM_ON = '\x1b[2m'
const DIM_OFF = '\x1b[22m'
const FG_CYAN = '\x1b[36m'
const FG_MAGENTA = '\x1b[35m'
const FG_GREEN = '\x1b[32m'
const FG_YELLOW = '\x1b[33m'
const FG_BLUE = '\x1b[34m'
const FG_RESET = '\x1b[39m'

const HEADING_COLORS = [FG_MAGENTA, FG_CYAN, FG_GREEN, FG_YELLOW, FG_BLUE, FG_RESET]

function wrap(start: string, text: string, end: string): string {
  return `${start}${text}${end}`
}

/**
 * One shared Marked instance — creating it per render forces the terminal
 * renderer to re-register its hooks every time.
 *
 * We override `heading`, `list`, `listitem`, `em`, `strong`, `link`, and
 * `blockquote` because marked-terminal's defaults use chalk with
 * formatting that rendered badly inside Ink (missing colors on headings,
 * `*` glyphs for bullets, trailing blank lines eating layout).
 */
const marked = new Marked()
marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens)
      const color = HEADING_COLORS[Math.min(depth - 1, HEADING_COLORS.length - 1)]
      const prefix = depth === 1 ? '' : `${'#'.repeat(depth)} `
      return `\n${color}${BOLD_ON}${prefix}${text}${BOLD_OFF}${FG_RESET}\n\n`
    },
    list(token) {
      const ordered = token.ordered
      const start = ordered ? (typeof token.start === 'number' ? token.start : 1) : 0
      const items = token.items
        .map((item, i) => {
          const marker = ordered ? `${start + i}.` : '•'
          const body = this.parser.parse(item.tokens).trimEnd()
          const indented = body.replace(/\n/g, '\n    ')
          return `  ${FG_CYAN}${marker}${FG_RESET} ${indented}`
        })
        .join('\n')
      return `${items}\n\n`
    },
    listitem({ tokens }) {
      return this.parser.parse(tokens)
    },
    strong({ tokens }) {
      return wrap(BOLD_ON, this.parser.parseInline(tokens), BOLD_OFF)
    },
    em({ tokens }) {
      return wrap(ITALIC_ON, this.parser.parseInline(tokens), ITALIC_OFF)
    },
    link({ href, tokens }) {
      const label = this.parser.parseInline(tokens)
      return `${FG_BLUE}${UNDERLINE_ON}${label}${UNDERLINE_OFF}${FG_RESET} (${href})`
    },
    blockquote({ tokens }) {
      const body = this.parser.parse(tokens).trimEnd()
      const prefixed = body
        .split('\n')
        .map(line => `  ${DIM_ON}│ ${line}${DIM_OFF}`)
        .join('\n')
      return `${prefixed}\n\n`
    },
  },
})

// Tables + code fences still come from marked-terminal — those are the
// parts the built-in renderer handles well.
marked.use(
  markedTerminal({
    width: 80,
    reflowText: true,
    tab: 2,
  }) as unknown as Parameters<typeof marked.use>[0]
)

/**
 * Renders markdown (incl. tables, code blocks, links) to ANSI-styled text.
 * Delegates parsing to `marked` and terminal rendering to our custom
 * renderer plus `marked-terminal`; Ink's `<Text>` passes ANSI escapes
 * through untouched.
 */
export function MarkdownText({ content }: MarkdownTextProps) {
  const rendered = useMemo(() => {
    try {
      const output = marked.parse(content, { async: false }) as string
      return output.replace(/\n+$/, '')
    } catch {
      return content
    }
  }, [content])

  return <Text>{rendered}</Text>
}
