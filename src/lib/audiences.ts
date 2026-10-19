/*
 * Viste della piattaforma per pubblico: produttori, distributori, stampa. GS1 Italy usa la vista
 * completa. I dati sono gli stessi; cambiano l'ordine delle sezioni e la spiegazione di perché ciascuna conta.
 */
import { Factory, LayoutGrid, Newspaper, Store } from 'lucide-react'
import { t } from '../i18n'
import type { SectionId } from './config'

export const AUDIENCES = [
  { id: 'tutti', get label() { return t('Completa') }, get lead() { return t('Tutte le sezioni, nell’ordine standard.') } },
  { id: 'produttori', get label() { return t('Produttori') }, get lead() { return t('Come vengono letti i tuoi codici, quali errori correggere, se qualcuno usa i tuoi codici in modo abusivo.') } },
  { id: 'distributori', get label() { return t('Distributori') }, get lead() { return t('Qualità dei codici e delle schede dei fornitori, prontezza delle casse per i codici 2D.') } },
  { id: 'stampa', get label() { return t('Stampa') }, get lead() { return t('Come si usano i codici GS1: passaggio ai codici 2D, territori, categorie e marchi più scansionati.') } },
] as const

export type AudienceId = (typeof AUDIENCES)[number]['id']

export const AUDIENCE_ICONS = { tutti: LayoutGrid, produttori: Factory, distributori: Store, stampa: Newspaper } as const

export const isAudience = (v: string | null): v is AudienceId => AUDIENCES.some((a) => a.id === v)

/** Ordine delle sezioni per ogni vista: prima quello che serve di più a quel pubblico. */
export const SECTION_ORDER: Record<AudienceId, SectionId[]> = {
  tutti: ['panoramica', 'adozione', 'territorio', 'qualita', 'categorie', 'brand', 'protezione', 'dati'],
  produttori: ['panoramica', 'qualita', 'protezione', 'brand', 'categorie', 'adozione', 'territorio', 'dati'],
  distributori: ['panoramica', 'qualita', 'categorie', 'brand', 'protezione', 'adozione', 'territorio', 'dati'],
  stampa: ['panoramica', 'adozione', 'territorio', 'categorie', 'brand', 'protezione', 'qualita', 'dati'],
}

type Copy = { what: string; why: string } & Partial<Record<AudienceId, string>>

/** Segna un testo da tradurre senza tradurlo subito (la traduzione avviene in whatOf / whyFor). */
const k = (s: string) => s

/** Cosa mostra ogni sezione e perché conta, in parole semplici; con varianti per pubblico. */
export const SECTION_COPY: Record<SectionId, Copy> = {
  panoramica: {
    what: k('I numeri principali del periodo, a colpo d’occhio.'),
    why: k('I numeri principali dicono subito se l’uso dei codici GS1 cresce e dove serve intervenire.'),
  },
  adozione: {
    what: k('Quante scansioni riguardano codici 2D (QR Code Standard GS1, GS1 DataMatrix) rispetto ai barcode tradizionali.'),
    why: k('Entro il 2027 le casse dovranno leggere anche i codici 2D (progetto Sunrise 2027): qui si misura a che punto è il passaggio.'),
    produttori: k('Mostra quanto i consumatori incontrano già codici 2D: un segnale per pianificare il passaggio delle proprie etichette.'),
    distributori: k('Indica quanto presto servono casse e lettori pronti per i codici 2D.'),
    stampa: k('È il barometro del passaggio dal barcode al QR Code Standard GS1.'),
  },
  territorio: {
    what: k('Da quali paesi, regioni e città arrivano le scansioni e dove i codici 2D sono più diffusi.'),
    why: k('Aiuta a capire dove concentrare comunicazione, formazione e progetti pilota.'),
    distributori: k('Mostra dove i clienti usano di più i codici: utile per scegliere i punti vendita pilota.'),
    stampa: k('Permette racconti regionali, con dati confrontabili tra territori.'),
  },
  qualita: {
    what: k('Quanti codici letti rispettano gli standard GS1 e quali errori ricorrono, azienda per azienda.'),
    why: k('Un codice sbagliato blocca la cassa e non porta alle informazioni del prodotto: trovarlo presto evita costi e ritiri.'),
    produttori: k('Fa scoprire errori di stampa o di codifica nei tuoi codici prima che li trovino clienti e distributori.'),
    distributori: k('Evidenzia i fornitori con codici problematici, che rallentano casse e logistica.'),
  },
  categorie: {
    what: k('Le categorie di prodotto (classificazione GPC) più scansionate e quanto sono complete le loro schede.'),
    why: k('Mostra quali mercati interessano di più ai consumatori e dove mancano informazioni.'),
    produttori: k('Confronta la completezza delle tue schede con la media della tua categoria.'),
    distributori: k('Indica in quali reparti le schede prodotto dei fornitori sono incomplete.'),
  },
  brand: {
    what: k('I marchi più scansionati, con il titolare del codice e la completezza delle schede.'),
    why: k('Misura l’interesse dei consumatori per ogni marchio e la qualità dei dati che lo accompagnano.'),
    produttori: k('Confronta l’attenzione per il tuo marchio con quella dei concorrenti.'),
    stampa: k('Racconta quali marchi i consumatori verificano di più.'),
  },
  protezione: {
    what: k('Codici autentici che portano a siti diversi da quelli del titolare, e numeri mai assegnati da GS1.'),
    why: k('Sono segnali di possibile contraffazione o truffa con QR Code (quishing): vanno verificati subito.'),
    produttori: k('Avvisa se qualcuno usa i tuoi codici per portare i consumatori su siti che non sono tuoi.'),
    distributori: k('Aiuta a riconoscere merce con codici falsi prima che arrivi sugli scaffali.'),
  },
  dati: {
    what: k('Ogni singola scansione del periodo, con filtri e dettaglio.'),
    why: k('Serve per approfondire un caso e verificare il dato alla fonte. Aprire un dettaglio non conta come nuova scansione.'),
    produttori: k('Cerca il tuo prefisso aziendale per vedere tutte le scansioni dei tuoi prodotti.'),
  },
}

/** Cosa mostra una sezione, nella lingua corrente. */
export const whatOf = (section: SectionId) => t(SECTION_COPY[section].what)

/** Testo "perché conta" di una sezione per il pubblico scelto, nella lingua corrente. */
export const whyFor = (section: SectionId, audience: AudienceId) => t(SECTION_COPY[section][audience] ?? SECTION_COPY[section].why)
