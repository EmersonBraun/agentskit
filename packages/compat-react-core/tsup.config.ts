import { copyFileSync, mkdirSync } from 'node:fs'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    adapters: 'src/adapters.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', '@agentskit/react', '@agentskit/adapters'],
  treeshake: true,
  onSuccess: async () => {
    mkdirSync('dist/theme', { recursive: true })
    copyFileSync('../react/src/theme/tokens.css', 'dist/theme/tokens.css')
    copyFileSync('../react/src/theme/default.css', 'dist/theme/default.css')
  },
})
