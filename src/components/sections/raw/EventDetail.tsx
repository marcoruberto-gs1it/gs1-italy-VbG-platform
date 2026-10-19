import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ImageOff, X } from 'lucide-react'
import { COMPLIANCE_LABELS, LINK_LABELS, SOURCE_LABELS, VBG_LABELS, keyLabel, labelFor } from '../../../lib/eventLabels'
import { cityName, countryName, dateTime, regionName } from '../../../lib/format'
import { gsap, motionOk, useGSAP } from '../../../lib/motion'
import type { ScanEvent } from '../../../lib/types'
import { isLicenceInactive, licenceLabel } from '../../../lib/licence'
import { canLookup, lookup, type VbgRecord } from '../../../lib/vbg'
import { StatusPill } from '../../ui'
import { EventStatus } from './EventStatus'
import { t } from '../../../i18n'
import { symbologyName } from '../../../lib/symbology'

/* ───── Dettaglio di una scansione: i dati salvati e la scheda attuale su Verified by GS1 ───── */

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children ?? '–'}</dd>
    </div>
  )
}

const yesNo = (v: boolean | null) => (v == null ? '–' : v ? t('Sì') : t('No'))

export function EventDetail({ event: e, demo, onClose }: { event: ScanEvent; demo: boolean; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeBtn.current?.focus()
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus()
    }
  }, [onClose])

  useGSAP(
    () => {
      if (!motionOk()) return
      gsap.from('.drawer-backdrop', { opacity: 0, duration: 0.25 })
      gsap.from('.drawer', { xPercent: 100, duration: 0.45, ease: 'power3.out' })
    },
    { scope: root },
  )

  return (
    <div className="drawer-layer" ref={root}>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <header className="drawer-head">
          <div>
            <p className="drawer-kicker">{dateTime(e.created_at)} · {SOURCE_LABELS[e.source]}</p>
            <h2 id="drawer-title">{e.symbology ? symbologyName(e.symbology) : t('Scansione')}</h2>
            {keyLabel(e) && <code className="drawer-key">{keyLabel(e)}</code>}
          </div>
          <button ref={closeBtn} className="btn ghost icon-only" type="button" onClick={onClose} aria-label={t('Chiudi il dettaglio')}><X size={18} /></button>
        </header>

        <div className="drawer-body">
          <div className="drawer-pills">
            <EventStatus map={COMPLIANCE_LABELS} value={e.compliance} />
            <EventStatus map={VBG_LABELS} value={e.vbg_state} />
            {isLicenceInactive(e.vbg_licence_status, e.vbg_record_status) && <StatusPill tone="critical">{t('Licenza non attiva')}</StatusPill>}
            {e.link_domain && <EventStatus map={LINK_LABELS} value={e.link_level} />}
          </div>

          {canLookup(e.primary_ai) && e.primary_key && <LiveVbg ai={e.primary_ai!} value={e.primary_key} demo={demo} />}

          <section className="drawer-section">
            <h3>{t('Il codice letto')}</h3>
            <dl className="drawer-dl">
              <Row label={t('Simbologia')}>{symbologyName(e.symbology)}</Row>
              <Row label={t('Tipo')}>{e.is_2d == null ? t('Senza simbolo') : e.is_2d ? t('Codice 2D') : t('Barcode 1D')}</Row>
              <Row label={t('Chiave GS1')}>{e.primary_ai ? `AI (${e.primary_ai})` : null}</Row>
              <Row label={t('AI presenti')}>{e.ai_list?.length ? e.ai_list.map((a) => `(${a})`).join(' ') : null}</Row>
              <Row label={t('Cifra di controllo')}>{yesNo(e.check_digit_ok)}</Row>
              <Row label={t('Sintassi GS1 corretta')}>{yesNo(e.syntax_ok)}</Row>
              {e.syntax_error && <Row label={t('Errore di sintassi')}>{e.syntax_error}</Row>}
              <Row label={t('Prefisso emesso da')}>{e.issuer_mo}</Row>
            </dl>
          </section>

          <section className="drawer-section">
            <h3>{t('Verified by GS1 al momento della scansione')}</h3>
            <dl className="drawer-dl">
              <Row label={t('Esito')}>{labelFor(VBG_LABELS, e.vbg_state)[0]}</Row>
              <Row label={t('Attributi essenziali')}>{e.vbg_core_count != null ? `${e.vbg_core_count}/7` : null}</Row>
              <Row label={t('Titolare')}>{e.licensee_name}</Row>
              <Row label={t('GS1 Company Prefix')}>{e.company_prefix}</Row>
              <Row label={t('GLN del titolare')}>{e.licensee_gln}</Row>
              <Row label={t('Licenza rilasciata da')}>{e.licensing_mo}</Row>
              {e.vbg_state && e.vbg_state !== 'invalid' && <Row label={t('Stato della licenza')}>{licenceLabel(e.vbg_licence_status, e.vbg_record_status)}</Row>}
              <Row label={t('Categoria GPC')}>{e.gpc_brick_name ? `${e.gpc_brick_name} (${e.gpc_brick})` : null}</Row>
              {e.vbg_error_code && <Row label={t('Codice di errore')}>{e.vbg_error_code}</Row>}
            </dl>
          </section>

          {e.link_domain && (
            <section className="drawer-section">
              <h3>{t('Link nel codice')}</h3>
              <dl className="drawer-dl">
                <Row label={t('Dominio')}><code>{e.link_domain}</code></Row>
                <Row label={t('Valutazione')}>{labelFor(LINK_LABELS, e.link_level ?? 'pending')[0]}</Row>
                {e.link_imitates && <Row label={t('Imita')}><code>{e.link_imitates}</code></Row>}
                {e.link_threats?.length ? <Row label={t('Google Web Risk')}>{e.link_threats.join(', ')}</Row> : null}
              </dl>
            </section>
          )}

          <section className="drawer-section">
            <h3>{t('Contesto')}</h3>
            <dl className="drawer-dl">
              <Row label={t('Paese')}>{countryName(e.country)}</Row>
              <Row label={t('Regione')}>{regionName(e.country, e.region_code, e.region)}</Row>
              <Row label={t('Città (approssimativa)')}>{e.city ? cityName(e.city) : null}</Row>
              <Row label={t('Dispositivo')}>{e.device === 'mobile' ? 'Telefono o tablet' : e.device === 'desktop' ? 'Computer' : null}</Row>
              <Row label={t('Versione dell’app')}>{e.app_version}</Row>
              <Row label={t('Identificativo')}>#{e.id}</Row>
            </dl>
          </section>
        </div>
      </aside>
    </div>
  )
}

/* Scheda attuale su Verified by GS1: consultazione che non entra nelle statistiche. */
function LiveVbg({ ai, value, demo }: { ai: string; value: string; demo: boolean }) {
  const key = `${ai}:${value}`
  const [state, setState] = useState<{ key: string; record: VbgRecord } | null>(null)

  useEffect(() => {
    let cancelled = false
    void lookup(ai, value).then((record) => !cancelled && setState({ key, record }))
    return () => {
      cancelled = true
    }
  }, [ai, value, key])

  const record = state?.key === key ? state.record : null

  return (
    <section className="live-vbg" aria-live="polite">
      <header>
        <h3>{t('Scheda attuale su Verified by GS1')}</h3>
        <p>{demo ? t('Consultazione diretta, esclusa dalle statistiche. Nella demo i codici sono di esempio: la scheda può non esistere.') : t('Consultazione diretta, esclusa dalle statistiche.')}</p>
      </header>
      {!record ? (
        <div className="live-skeleton" aria-label={t('Consultazione in corso')} />
      ) : record.state === 'verified' ? (
        <>
          <div className="live-product">
            <span className="live-image">
              {record.image ? <img src={record.image} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <ImageOff size={26} aria-hidden="true" />}
            </span>
            <div>
              <b>{record.name}</b>
              {record.licensee && <small>{record.licensee.name}</small>}
              <span className="live-meta">
                {record.complete ? <StatusPill tone="good">{t('Scheda completa')}</StatusPill> : <StatusPill tone="warning">{t('Scheda incompleta')}</StatusPill>}
                {record.updated && <small>{t('Aggiornata il {date}', { date: record.updated })}</small>}
              </span>
            </div>
          </div>
          <ul className="core-list">
            {record.core.map((c) => (
              <li key={c.label} className={c.value ? 'is-present' : 'is-missing'}>
                <span>{c.label}</span>
                <b>{c.value ?? 'Mancante'}</b>
              </li>
            ))}
          </ul>
        </>
      ) : record.state === 'licensed' ? (
        <p className="live-note">{t('Licenza GS1 valida{owner}, ma il titolare non ha pubblicato la scheda del prodotto.', { owner: record.licensee ? ` (${record.licensee.name})` : '' })}</p>
      ) : (
        <p className="live-note">{record.message}{record.code ? ` (${record.code})` : ''}</p>
      )}
    </section>
  )
}
