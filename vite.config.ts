import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // Su GitHub Pages la dashboard vive in /<nome-repo>/: il workflow imposta BASE_PATH.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
