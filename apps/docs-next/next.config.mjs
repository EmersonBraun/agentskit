import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/**
 * Redirects for the docs IA overhaul (step 1).
 * Old paths keep working; new IA is introduced in later steps.
 */
const DOC_REDIRECTS = [
  { source: '/docs/adapters/:slug*', destination: '/docs/data/providers/:slug*', permanent: true },
  { source: '/docs/data-layer/memory/:slug*', destination: '/docs/data/memory/:slug*', permanent: true },
  { source: '/docs/data-layer/rag/:slug*', destination: '/docs/data/rag/:slug*', permanent: true },
  { source: '/docs/data-layer/:slug*', destination: '/docs/data/:slug*', permanent: true },
  { source: '/docs/chat-uis/:slug*', destination: '/docs/ui/:slug*', permanent: true },
  { source: '/docs/components/:slug*', destination: '/docs/ui/:slug*', permanent: true },
  { source: '/docs/hooks/:slug*', destination: '/docs/ui/:slug*', permanent: true },
  { source: '/docs/infrastructure/observability/:slug*', destination: '/docs/observability/:slug*', permanent: true },
  { source: '/docs/infrastructure/eval/:slug*', destination: '/docs/evals/:slug*', permanent: true },
  { source: '/docs/infrastructure/cli/:slug*', destination: '/docs/cli/:slug*', permanent: true },
  { source: '/docs/infrastructure/:slug*', destination: '/docs/packages/:slug*', permanent: true },
  { source: '/docs/agents/tools', destination: '/docs/tools', permanent: true },
  { source: '/docs/agents/skills', destination: '/docs/skills', permanent: true },
  { source: '/docs/contributing/:slug*', destination: '/docs/contribute/:slug*', permanent: true },
  { source: '/docs/theming', destination: '/docs/ui/theming', permanent: true },
]

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async redirects() {
    return DOC_REDIRECTS
  },
}

export default withMDX(config)
