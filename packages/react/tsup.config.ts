import { copyFileSync, mkdirSync } from 'node:fs'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', '@agentskit/core'],
  treeshake: true,
  onSuccess: async () => {
    mkdirSync('dist/theme', { recursive: true })
    copyFileSync('src/theme/tokens.css', 'dist/theme/tokens.css')
    copyFileSync('src/theme/default.css', 'dist/theme/default.css')
  },
})
