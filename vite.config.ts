import { defineConfig } from '@lovable.dev/vite-tanstack-config'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  nitro: { preset: 'vercel', renderer: false } as any,
  vite: {
    build: {
      outDir: '.output/public',
      emptyOutDir: true,
    },
  },
  plugins: [
    tanstackRouter(),
  ],
})
