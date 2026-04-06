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
      label: 'Building Chat UIs',
      items: [
        'chat-uis/react',
        'chat-uis/ink',
        'chat-uis/components',
        'chat-uis/theming',
      ],
    },
    {
      type: 'category',
      label: 'Running Agents',
      items: [
        'agents/runtime',
        'agents/tools',
        'agents/skills',
        'agents/delegation',
      ],
    },
    {
      type: 'category',
      label: 'Data Layer',
      items: [
        'data-layer/adapters',
        'data-layer/memory',
        'data-layer/rag',
      ],
    },
    {
      type: 'category',
      label: 'Infrastructure',
      items: [
        'infrastructure/observability',
        'infrastructure/sandbox',
        'infrastructure/eval',
        'infrastructure/cli',
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
      label: 'Legacy Reference',
      collapsed: true,
      items: [
        'components/overview',
        'adapters/overview',
        'theming/overview',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/index',
        'examples/basic-chat',
        'examples/tool-use',
        'examples/multi-model',
        'examples/code-assistant',
        'examples/support-bot',
        'examples/rag-chat',
        'examples/agent-actions',
        'examples/markdown-chat',
        'examples/mui-chat',
        'examples/shadcn-chat',
      ],
    },
  ],
}

export default sidebars
