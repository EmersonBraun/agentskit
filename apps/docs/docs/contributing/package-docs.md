---
sidebar_position: 1
title: Package documentation checklist
description: Maintainer checklist for keeping each @agentskit/* guide aligned with code and TypeDoc.
---

# Package documentation checklist

Use this when adding or changing a package or its public API.

1. **Purpose** — When to use / when not to use.
2. **Install** — `npm i` line; note peers (usually `@agentskit/core` via feature packages).
3. **Public surface** — Primary exports aligned with `src/index.ts` (details in TypeDoc).
4. **Configuration** — Options tables for main factories.
5. **Examples** — Happy path + one production-oriented or edge-case example.
6. **Integration** — Links to adjacent packages (keep the **See also** line at the bottom of each guide short).
7. **Troubleshooting** — Short FAQ (errors, env vars, version skew).

When exports change, update the guide and ensure `pnpm --filter @agentskit/docs build` still passes (`docs:api` regenerates TypeDoc).
