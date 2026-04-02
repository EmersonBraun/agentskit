import { defineConfig } from 'tsup'
import { copyFileSync, mkdirSync } from 'fs'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'adapters/index': 'src/adapters/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  splitting: true,
  treeshake: true,
  onSuccess: async () => {
    mkdirSync('dist/theme', { recursive: true })
    copyFileSync('src/theme/tokens.css', 'dist/theme/tokens.css')
    copyFileSync('src/theme/default.css', 'dist/theme/default.css')
  },
})
