---
sidebar_position: 1
---

# Installation

Install the React package plus adapters:

```bash
npm install @agentskit/react @agentskit/adapters
```

```bash
yarn add @agentskit/react @agentskit/adapters
```

```bash
pnpm add @agentskit/react @agentskit/adapters
```

## Other entry points

```bash
pnpm add @agentskit/core
pnpm add @agentskit/ink
pnpm add @agentskit/cli
```

## Peer Dependencies

AgentsKit requires React 18 or later:

```bash
npm install react react-dom
```

## Optional: Default Theme

Import the default theme CSS for a polished chat UI out of the box:

```tsx
import '@agentskit/react/theme'
```

The theme uses CSS custom properties, so you can override any token without ejecting.
