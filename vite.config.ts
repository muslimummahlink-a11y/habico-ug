import { defineConfig } from '@lovable.dev/vite-tanstack-config'

export default defineConfig({
  nitro: { preset: 'vercel', renderer: false } as any,
  vite: {
    build: {
      outDir: '.output/public',
      emptyOutDir: true,
    },
  },
})
