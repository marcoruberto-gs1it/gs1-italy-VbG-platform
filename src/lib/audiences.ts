/*
 * Viste della piattaforma per pubblico: GS1 Italy, produttori, distributori, stampa.
 * I dati sono gli stessi; cambiano l'ordine delle sezioni e la spiegazione di perché ciascuna conta.
 */
import type { SectionId } from './config'

export const AUDIENCES = [
  { id: 'tutti', label: 'Tutti i dati', lead: 'Tutte le sezioni, nell’ordine standard.' },
  { id: 'gs1', label: 'GS1 Italy', lead: 'Avanzamento verso i codici 2D (Sunrise 2027), qualità dei codici delle aziende, segnali di contraffazione.' },
  { id: 'produttori', label: 'Produttori', lead: 'Come vengono letti i tuoi codici, quali errori correggere, se qualcuno usa i tuoi codici in modo abusivo.' },
  { id: 'distributori', label: 'Distributori', lead: 'Qualità dei codici e delle schede dei fornitori, prontezza delle casse per i codici 2D.' },
  { id: 'stampa', label: 'Stampa', lead: 'Come si usano i codici GS1: passaggio ai codici 2D, territori, categorie e marchi più scansionati.' },
] as const

export type AudienceId = (typeof AUDIENCES)[number]['id']

export const isAudience = (v: string | null): v is AudienceId => AUDIENCES.some((a) => a.id === v)

/** Ordine delle sezioni per ogni vista: prima quello che serve di più a quel pubblico. */
export const SECTION_ORDER: Record<AudienceId, SectionId[]> = {
  tutti: ['panoramica', 'adozione', 'territorio', 'qualita', 'categorie', 'brand', 'protezione', 'dati'],
  gs1: ['panoramica', 'adozione', 'qualita', 'protezione', 'territorio', 'categorie', 'brand', 'dati'],
  produttori: ['panoramica', 'qualita', 'protezione', 'brand', 'categorie', 'adozione', 'territorio', 'dati'],
  distributori: ['panoramica', 'qualita', 'categorie', 'brand', 'protezione', 'adozione', 'territorio', 'dati'],
  stampa: ['panoramica', 'adozione', 'territorio', 'categorie', 'brand', 'protezione', 'qualita', 'dati'],
}

type Copy = { what: string; why: string } & Partial<Record<AudienceId, string>>

/** Cosa mostra ogni sezione e perché conta, in parole semplici; con varianti per pubblico. */
export const SECTION_COPY: Record<SectionId, Copy> = {
  panoramica: {
    what: 'I numeri principali del periodo, a colpo d’occhio.',
    why: 'I numeri principali dicono subito se l’uso dei codici GS1 cresce e dove serve intervenire.',
  },
  adozione: {
    what: 'Quante scansioni riguardano codici 2D (QR Code Standard GS1, GS1 DataMatrix) rispetto ai barcode tradizionali.',
    why: 'Entro il 2027 le casse dovranno leggere anche i codici 2D (progetto Sunrise 2027): qui si misura a che punto è il passaggio.',
    gs1: 'Misura l’avanzamento verso Sunrise 2027 e mostra dove spingere l’adozione.',
    produttori: 'Mostra quanto i consumatori incontrano già codici 2D: un segnale per pianificare il passaggio delle proprie etichette.',
    distributori: 'Indica quanto presto servono casse e lettori pronti per i codici 2D.',
    stampa: 'È il barometro del passaggio dal barcode al QR Code Standard GS1.',
  },
  territorio: {
    what: 'Da quali regioni arrivano le scansioni e dove i codici 2D sono più diffusi.',
    why: 'Aiuta a capire dove concentrare comunicazione, formazione e progetti pilota.',
    distributori: 'Mostra dove i clienti usano di più i codici: utile per scegliere i punti vendita pilota.',
    stampa: 'Permette racconti regionali, con dati confrontabili tra territori.',
  },
  qualita: {
    what: 'Quanti codici letti rispettano gli standard GS1 e quali errori ricorrono, azienda per azienda.',
    why: 'Un codice sbagliato blocca la cassa e non porta alle informazioni del prodotto: trovarlo presto evita costi e ritiri.',
    gs1: 'Indica a quali aziende proporre la verifica dei codici e la formazione.',
    produttori: 'Fa scoprire errori di stampa o di codifica nei tuoi codici prima che li trovino clienti e distributori.',
    distributori: 'Evidenzia i fornitori con codici problematici, che rallentano casse e logistica.',
  },
  categorie: {
    what: 'Le categorie di prodotto (classificazione GPC) più scansionate e quanto sono complete le loro schede.',
    why: 'Mostra quali mercati interessano di più ai consumatori e dove mancano informazioni.',
    produttori: 'Confronta la completezza delle tue schede con la media della tua categoria.',
    distributori: 'Indica in quali reparti le schede prodotto dei fornitori sono incomplete.',
  },
  brand: {
    what: 'I marchi più scansionati, con il titolare del codice e la completezza delle schede.',
    why: 'Misura l’interesse dei consumatori per ogni marchio e la qualità dei dati che lo accompagnano.',
    produttori: 'Confronta l’attenzione per il tuo marchio con quella dei concorrenti.',
    stampa: 'Racconta quali marchi i consumatori verificano di più.',
  },
  protezione: {
    what: 'Codici autentici che portano a siti diversi da quelli del titolare, e numeri mai assegnati da GS1.',
    why: 'Sono segnali di possibile contraffazione o truffa con QR Code (quishing): vanno verificati subito.',
    produttori: 'Avvisa se qualcuno usa i tuoi codici per portare i consumatori su siti che non sono tuoi.',
    distributori: 'Aiuta a riconoscere merce con codici falsi prima che arrivi sugli scaffali.',
  },
  dati: {
    what: 'Ogni singola scansione del periodo, con filtri e dettaglio.',
    why: 'Serve per approfondire un caso e verificare il dato alla fonte. Aprire un dettaglio non conta come nuova scansione.',
    produttori: 'Cerca il tuo prefisso aziendale per vedere tutte le scansioni dei tuoi prodotti.',
  },
}

/** Testo "perché conta" di una sezione per il pubblico scelto. */
export const whyFor = (section: SectionId, audience: AudienceId) => SECTION_COPY[section][audience] ?? SECTION_COPY[section].why
