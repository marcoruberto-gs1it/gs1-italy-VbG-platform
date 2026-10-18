import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // Su GitHub Pages la dashboard vive in /<nome-repo>/: il workflow imposta BASE_PATH.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Librerie in file separati: restano in cache quando cambia solo il codice della dashboard.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('gsap')) return 'gsap'
          if (id.includes('react') || id.includes('scheduler')) return 'react'
          if (id.includes('lucide')) return 'icons'
          return 'vendor'
        },
      },
    },
  },
})
