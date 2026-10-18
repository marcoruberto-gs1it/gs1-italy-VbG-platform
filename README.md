# VbG Platform · GS1 Italy

Dashboard degli analytics raccolti dall'app di scansione [gs1-italy-VbG-app](https://github.com/marcoruberto-gs1it/gs1-italy-vbg-app): diffusione dei codici 2D, conformità agli standard GS1, completezza delle schede Verified by GS1, qualità dei codici per azienda, allerte di brand protection e numeri mai assegnati.

## Accesso e sicurezza

- **Demo**: login con utente e password (Supabase Auth). L'utente `demo` corrisponde all'indirizzo interno `demo@vbg-platform.example`, su un dominio riservato che non riceve posta. Per la produzione è previsto l'accesso via email o SSO aziendale (modello email in `supabase/email-magic-link.html`).
- Non esiste la registrazione libera: gli utenti li crea un amministratore.
- Vede i dati solo chi è nella tabella `dashboard_users`.
- La dashboard non legge mai le singole scansioni: riceve solo aggregati dalla funzione `dashboard_data`, che verifica l'autorizzazione prima di calcolarli (`supabase/dashboard.sql`).
- Nel sito c'è solo la chiave *publishable* di Supabase, pensata per il browser. La chiave segreta resta nel Worker dell'app.

## Avvio

```sh
npm install
cp .env.example .env.local   # inserisci la chiave publishable
npm run dev
```

`?demo` nell'indirizzo mostra la dashboard con dati dimostrativi generati nel browser, senza login e senza toccare il database.

## Configurazione Supabase (una tantum)

1. **SQL Editor**: esegui `supabase/dashboard.sql` (dopo lo schema dell'app).
2. **Authentication → Sign In / Providers**: disattiva *Allow new users to sign up*.
3. **Authentication → URL Configuration**: imposta *Site URL* e *Redirect URLs* con `https://marcoruberto-gs1it.github.io/gs1-italy-VbG-platform/` (e `http://localhost:5173` per lo sviluppo). Con l'accesso a password della demo non sono usati, servono per i futuri accessi via email.
4. **Authentication → Users → Add user**: crea gli utenti (email e password, con *Auto Confirm User*), poi abilitali:
   ```sql
   insert into public.dashboard_users (email, role) values ('nome.cognome@gs1it.org', 'admin');
   ```

## Pubblicazione

La dashboard è pubblicata solo su **GitHub Pages**: a ogni push su `main` il workflow `.github/workflows/pages.yml` la compila e la pubblica su https://marcoruberto-gs1it.github.io/gs1-italy-VbG-platform/

## Grafici

Grafici in SVG/HTML senza librerie esterne. Palette validata per il daltonismo: blu GS1 `#1d4f9a` e arancio GS1 `#f26334`. Gli stati di conformità hanno sempre icona ed etichetta, e ogni grafico ha la vista tabella.
