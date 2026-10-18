import { useEffect, useState } from 'react'

const CHECK_EVERY = 15 * 60_000

/** Versione pubblicata online (null se non raggiungibile, per esempio in sviluppo). */
async function fetchLatestVersion(): Promise<string | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const { version } = (await res.json()) as { version?: string }
    return version ?? null
  } catch {
    return null
  }
}

/** Nuova versione della dashboard pubblicata mentre la pagina è aperta: controllo al ritorno sulla scheda e ogni 15 minuti. */
export function useUpdateAvailable() {
  const [available, setAvailable] = useState<string | null>(null)
  useEffect(() => {
    let last = 0
    const check = async () => {
      if (Date.now() - last < 60_000) return
      last = Date.now()
      const version = await fetchLatestVersion()
      if (version && version !== __APP_VERSION__) setAvailable(version)
    }
    const onVisible = () => document.visibilityState === 'visible' && void check()
    void check()
    document.addEventListener('visibilitychange', onVisible)
    const timer = window.setInterval(() => void check(), CHECK_EVERY)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [])
  return available
}

/** Carica la versione nuova, con il numero di versione nell'indirizzo (il browser non riusa la pagina in memoria). */
export function loadVersion(version: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('v', version)
  window.location.replace(url)
}
