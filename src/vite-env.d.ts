/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
declare const __APP_VERSION__: string

/** Versione leggibile dell'app (package.json), es. 1.0.1. */
declare const __APP_RELEASE__: string
