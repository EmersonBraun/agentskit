import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/read-this-first',
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/for-ai-agents',
      ],
    },
    {
      type: 'category',
      label: 'Packages',
      link: { type: 'doc', id: 'packages/overview' },
      items: [
        'packages/overview',
        {
          type: 'doc',
          id: 'packages/core',
          label: '@agentskit/core',
        },
        {
          type: 'doc',
          id: 'packages/templates',
          label: '@agentskit/templates',
        },
        {
          type: 'doc',
          id: 'chat-uis/react',
          label: '@agentskit/react',
        },
        {
          type: 'doc',
          id: 'chat-uis/ink',
          label: '@agentskit/ink',
        },
        {
          type: 'doc',
          id: 'data-layer/adapters',
          label: '@agentskit/adapters',
        },
        {
          type: 'doc',
          id: 'data-layer/memory',
          label: '@agentskit/memory',
        },
        {
          type: 'doc',
          id: 'data-layer/rag',
          label: '@agentskit/rag',
        },
        {
          type: 'doc',
          id: 'agents/runtime',
          label: '@agentskit/runtime',
        },
        {
          type: 'doc',
          id: 'agents/tools',
          label: '@agentskit/tools',
        },
        {
          type: 'doc',
          id: 'agents/skills',
          label: '@agentskit/skills',
        },
        {
          type: 'doc',
          id: 'infrastructure/observability',
          label: '@agentskit/observability',
        },
        {
          type: 'doc',
          id: 'infrastructure/sandbox',
          label: '@agentskit/sandbox',
        },
        {
          type: 'doc',
          id: 'infrastructure/eval',
          label: '@agentskit/eval',
        },
        {
          type: 'doc',
          id: 'infrastructure/cli',
          label: '@agentskit/cli',
        },
        {
          type: 'link',
          label: 'Generated API (TypeDoc)',
          href: 'pathname:///agentskit/api-reference/',
        },
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
      label: 'Contributing',
      collapsed: true,
      items: ['contributing/package-docs'],
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
        'examples/runtime-agent',
        'examples/multi-agent',
        'examples/rag-pipeline',
        'examples/eval-runner',
      ],
    },
  ],
}

export default sidebars
