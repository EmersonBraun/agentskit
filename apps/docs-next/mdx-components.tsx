import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import { Mermaid } from '@/components/mermaid'
import { StackblitzEmbed } from '@/components/mdx/stackblitz-embed'
import { CodeSandboxEmbed } from '@/components/mdx/codesandbox-embed'
import { GifEmbed } from '@/components/mdx/gif-embed'
import { Playground } from '@/components/mdx/playground'
import { FrameworkTabs, Framework } from '@/components/mdx/framework-tabs'
import { RunCode } from '@/components/mdx/run-code'
import { ArchDiagram } from '@/components/mdx/arch-diagram'
import { Since } from '@/components/mdx/since'
import { Tip, Warning, Pitfall, Performance, Security, Info, Success, Compare } from '@/components/mdx/callouts'

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Mermaid,
    StackblitzEmbed,
    CodeSandboxEmbed,
    GifEmbed,
    Playground,
    FrameworkTabs,
    Framework,
    RunCode,
    ArchDiagram,
    Since,
    Tip,
    Warning,
    Pitfall,
    Performance,
    Security,
    Info,
    Success,
    Compare,
    ...components,
  }
}
