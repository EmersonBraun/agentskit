import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: false,
  treeshake: true,
  external: ['better-sqlite3', 'redis', 'vectra', '@lancedb/lancedb'],
})
