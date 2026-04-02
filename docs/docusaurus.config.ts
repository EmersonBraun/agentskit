import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'

const config: Config = {
  title: 'React Arrow',
  tagline: 'A hooks-first React library for the agentic era',
  favicon: 'img/favicon.ico',
  url: 'https://emersonbraun.github.io',
  baseUrl: '/lib/',
  organizationName: 'EmersonBraun',
  projectName: 'lib',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: { defaultLocale: 'en', locales: ['en'] },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/EmersonBraun/lib/tree/main/docs/',
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'React Arrow',
      items: [
        { type: 'docSidebar', sidebarId: 'docsSidebar', position: 'left', label: 'Docs' },
        { href: 'https://github.com/EmersonBraun/lib', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Quick Start', to: '/docs/getting-started/quick-start' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'GitHub', href: 'https://github.com/EmersonBraun/lib' },
            { label: 'Arrow.js (inspiration)', href: 'https://arrow-js.com/' },
          ],
        },
      ],
      copyright: `Inspired by Arrow.js. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'tsx', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
}

export default config
