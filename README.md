# VbG Platform · GS1 Italy

Dashboard degli analytics raccolti dall'app di scansione [gs1-italy-VbG-app](https://github.com/marcoruberto-gs1it/gs1-italy-vbg-app): diffusione dei codici 2D, conformità agli standard GS1, completezza delle schede Verified by GS1, qualità dei codici per azienda, allerte di brand protection e numeri mai assegnati.

## Accesso e sicurezza

- Login con **Supabase Auth** tramite link via email. Non esiste la registrazione libera: gli utenti li crea un amministratore.
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
3. **Authentication → URL Configuration**: imposta *Site URL* e *Redirect URLs* con l'indirizzo della dashboard (e `http://localhost:5173` per lo sviluppo).
4. **Authentication → Users → Add user**: crea gli utenti, poi abilitali:
   ```sql
   insert into public.dashboard_users (email, role) values ('nome.cognome@gs1it.org', 'admin');
   ```

## Pubblicazione

```sh
npm run deploy   # build + Cloudflare Workers (solo file statici)
```

## Grafici

Grafici in SVG/HTML senza librerie esterne. Palette validata per il daltonismo: blu GS1 `#1d4f9a` e arancio GS1 `#f26334`. Gli stati di conformità hanno sempre icona ed etichetta, e ogni grafico ha la vista tabella.
