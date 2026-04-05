import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    bin: 'src/bin.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'ink', 'commander', '@agentskit/core', '@agentskit/ink'],
  treeshake: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
})
