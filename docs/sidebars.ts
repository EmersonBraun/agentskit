import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/for-ai-agents',
      ],
    },
    {
      type: 'category',
      label: 'Core Hooks',
      items: [
        'hooks/use-stream',
        'hooks/use-reactive',
        'hooks/use-chat',
      ],
    },
    {
      type: 'category',
      label: 'Components',
      items: ['components/overview'],
    },
    {
      type: 'category',
      label: 'Adapters',
      items: ['adapters/overview'],
    },
    {
      type: 'category',
      label: 'Theming',
      items: ['theming/overview'],
    },
  ],
}

export default sidebars
