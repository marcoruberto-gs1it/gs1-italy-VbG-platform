import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const APP_VERSION = process.env.GITHUB_SHA?.slice(0, 7) ?? `build-${new Date().toISOString().slice(0, 10)}`

/** Pubblica version.json: la dashboard aperta lo confronta con la propria versione per proporre l'aggiornamento. */
const versionFile = (): Plugin => ({
  name: 'version-file',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: APP_VERSION }) })
  },
})

export default defineConfig({
  // Su GitHub Pages la dashboard vive in /<nome-repo>/: il workflow imposta BASE_PATH.
  base: process.env.BASE_PATH ?? '/',
  define: { __APP_VERSION__: JSON.stringify(APP_VERSION) },
  plugins: [react(), versionFile()],
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
