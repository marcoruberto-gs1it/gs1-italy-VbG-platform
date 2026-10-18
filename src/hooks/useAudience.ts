import { createContext, useCallback, useContext, useState } from 'react'
import { AUDIENCES, isAudience, type AudienceId } from '../lib/audiences'

/** Vista scelta, letta e scritta nell'indirizzo (?vista=…) così un link apre direttamente quella vista. */
export function useAudienceState() {
  const [audience, setAudience] = useState<AudienceId>(() => {
    const v = new URLSearchParams(window.location.search).get('vista')
    return isAudience(v) ? v : AUDIENCES[0].id
  })
  const change = useCallback((next: AudienceId) => {
    setAudience(next)
    const url = new URL(window.location.href)
    if (next === AUDIENCES[0].id) url.searchParams.delete('vista')
    else url.searchParams.set('vista', next)
    window.history.replaceState(null, '', url)
  }, [])
  return [audience, change] as const
}

export const AudienceContext = createContext<AudienceId>(AUDIENCES[0].id)

export const useAudience = () => useContext(AudienceContext)
