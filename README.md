# VbG Platform · GS1 Italy

Dashboard degli analytics raccolti dall'app di scansione [gs1-italy-VbG-app](https://github.com/marcoruberto-gs1it/gs1-italy-vbg-app): diffusione dei codici 2D, conformità agli standard GS1, completezza delle schede Verified by GS1, qualità dei codici per azienda, allerte di brand protection e numeri mai assegnati.

## Accesso e sicurezza

- **Demo**: login con utente e password (Supabase Auth), già precompilati nella schermata di accesso (`demo` / `gs1italy`, in `src/components/Login.tsx`): sono pubblici, da togliere prima della produzione. L'utente `demo` corrisponde all'indirizzo interno `demo@vbg-platform.example`, su un dominio riservato che non riceve posta. Per la produzione è previsto l'accesso via email o SSO aziendale (modello email in `supabase/email-magic-link.html`).
- Non esiste la registrazione libera: gli utenti li crea un amministratore.
- Vede i dati solo chi è nella tabella `dashboard_users`.
- I grafici ricevono solo aggregati dalla funzione `dashboard_data`; la sezione *Dati grezzi* legge le singole scansioni (senza dati personali) dalla funzione `dashboard_events`. Entrambe verificano l'autorizzazione prima di restituire qualcosa (`supabase/dashboard.sql`, `supabase/raw-data.sql`).
- Aprire il dettaglio di una scansione consulta Verified by GS1 tramite il proxy del Worker, che non registra nulla: le statistiche nascono solo dalle scansioni fatte con l'app.
- Nel sito c'è solo la chiave *publishable* di Supabase, pensata per il browser. La chiave segreta resta nel Worker dell'app.

## Avvio

```sh
npm install
cp .env.example .env.local   # inserisci la chiave publishable
npm run dev
```

`?demo` nell'indirizzo mostra la dashboard con dati dimostrativi generati nel browser, senza login e senza toccare il database.

## Configurazione Supabase (una tantum)

1. **SQL Editor**: esegui `supabase/dashboard.sql` (dopo lo schema dell'app) e poi `supabase/raw-data.sql`; rieseguili quando cambiano (rieseguire `dashboard.sql` aggiunge anche la colonna del marchio usata dalla classifica dei brand).
2. **Authentication → Sign In / Providers**: disattiva *Allow new users to sign up*.
3. **Authentication → URL Configuration**: imposta *Site URL* e *Redirect URLs* con `https://marcoruberto-gs1it.github.io/gs1-italy-VbG-platform/` (e `http://localhost:5173` per lo sviluppo). Con l'accesso a password della demo non sono usati, servono per i futuri accessi via email.
4. **Authentication → Users → Add user**: crea gli utenti (email e password, con *Auto Confirm User*), poi abilitali:
   ```sql
   insert into public.dashboard_users (email, role) values ('nome.cognome@gs1it.org', 'admin');
   ```

## Pubblicazione

La dashboard è pubblicata solo su **GitHub Pages**: a ogni push su `main` il workflow `.github/workflows/pages.yml` la compila e la pubblica su https://marcoruberto-gs1it.github.io/gs1-italy-VbG-platform/

## Design

- **UI kit** coerente con l'app di scansione: token in `src/index.css` (colori GS1, tipografia Montserrat inclusa nel sito senza Google Fonts, raggi, ombre, movimento), componenti in `src/components/ui.tsx` (IconTile, Counter, Delta, StatusPill, Panel, SectionHeader).
- **Illustrazioni e glifi** SVG in `src/components/illustrations.tsx` (onde GS1, simbologie, scudo).
- **Animazioni GSAP** (`src/lib/motion.ts`): ingresso della pagina, numeri che contano, barre e mappa che si animano entrando nello schermo (ScrollTrigger), onde GS1 in loop. Disattivate se il sistema chiede di ridurre il movimento.
- **Mappa d'Italia** per regione: confini da [openpolis/geojson-italy](https://github.com/openpolis/geojson-italy) (ISTAT, CC-BY 4.0), semplificati in `src/lib/italy-regions.json`.
- **Confronti** con il periodo precedente di pari durata su tutti gli indicatori.

## Grafici

Grafici in SVG/HTML senza librerie esterne. Palette validata per il daltonismo: blu GS1 `#1d4f9a` e arancio GS1 `#f26334`. Gli stati di conformità hanno sempre icona ed etichetta, e ogni grafico ha la vista tabella.

## Struttura del codice

```
src/
  App.tsx                 accesso e stato dei filtri
  main.tsx                stili e paracadute per gli errori
  components/
    Dashboard.tsx         struttura della pagina (ogni sezione isolata da un ErrorBoundary)
    layout/               barra laterale, barra in alto, menu delle sezioni per telefono
    sections/             una sezione per file; raw/ = dati grezzi e scheda di dettaglio
    charts/               grafici e tabelle riutilizzabili
    ui/                   UI kit: Panel, Select, InfoPopover, StatusPill, Delta, Counter
  hooks/                  dati, sezione attiva, chiusura di menu e fumetti, animazioni
  lib/                    logica pura (formati, statistiche, errori, simbologie, demo) con test
  styles/                 tokens.css (colori, misure, livelli z-index), kit, layout, grafici, sezioni, accesso
```

Barra in alto: periodo, area (mondo o un paese, unica per tutta la pagina) e vista. Viste per pubblico (`?vista=produttori|distributori|stampa`; GS1 Italy usa la vista completa): stessi dati, ordine delle sezioni e spiegazioni pensati per chi li legge (`src/lib/audiences.ts`).

Demo: `?demo` mostra dati generati nel browser; `?demo&scala=1000` moltiplica i conteggi per vedere l'interfaccia con numeri molto grandi.

Lingue: italiano e inglese. La lingua si sceglie con `?lang=it|en`, poi con la scelta salvata (menu della lingua in alto a destra, anche su telefono e nella login), poi con le lingue preferite del browser, in ordine (la prima tra italiano e inglese; altrimenti inglese). La scelta si salva solo se diversa dalla lingua del browser, ed è condivisa con l'app di scansione (stesso dominio). I testi restano in italiano nel codice dentro `t('…')`; le traduzioni sono in `src/i18n/en.json`, e un test blocca la pubblicazione se ne manca una.

Comandi: `npm run dev`, `npm test` (Vitest), `npm run lint`, `npm run build`.
La pubblicazione su GitHub Pages esegue lint e test prima della build: se uno fallisce, il sito non viene aggiornato.
