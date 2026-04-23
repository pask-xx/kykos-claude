# KYKOS - Todo List

<!-- Use checkboxes [ ] for pending, [x] for completed -->

## Auth & Users

- [x] Login con email/password
- [x] Gestione ruoli utente (donors, recipients, intermediaries)
- [ ] Login con Google OAuth (messo da parte per ora)
- [ ] Ogni utente deve essere geolocalizzato;
- [ ] Prevedere una lista di oggetti sotto osservazione (lista desideri), per poterla poi recuperare e richiedere;
- [ ] La lista dei desideri dovrà dare evidenza se gli articoli sono ancora disponibili oppure no;
- [ ] Sistema di notifiche (anche via email) che consente di informare sullo stato della transazione: Il donatore sarà informato che qualcuno ha richiesto l’oggetto, il richiedente sarà informato che l’articolo è disponibile al ritiro (generazione qrcode per il ritiro)

## Objects

- [x] Creazione listing oggetti da parte dei donatori
- [x] Lista oggetti disponibili
- [x] Dettaglio singolo oggetto
- [x] Le foto per ogni singolo oggetto possono essere multiple;

## Requests

- [x] Richiesta oggetti da parte di recipients autorizzati
- [x] Approvazione/rifiuto richieste da parte di intermediaries
- [ ] Lista delle richieste di beni e servizi fatte dai richiedenti (non legate a articoli resi disponibili) dove tutti possono leggere e rendersi disponibili per soddisfare la richiesta (esempio… richiesta: mi servirebbe una culla per neonato).

## Flow

- [ ] Flusso autorizzazione intermediaries (da verificare completo)
- [x] Anonymous matching/donation flow
- [ ] Gestione pagamenti simbolici (model esistente ma flow non completo)

## Gamification

- [ ] Sistema ranking donatori (DonorProfile model esistente ma non attivo)
- [ ] Incentivi per donatori attivi

## Admin

- [ ] Pannello admin per gestione intermediaries
- [ ] Dashboard e statistiche

## Tech

- [ ] Setup CI/CD
- [ ] Testing
- [ ] Documentazione API
- [ ] Configurare DNS Vercel per www.kykos.it
- [ ] Configurare ambiente di test/staging su Vercel (preview deployment)
- [x] Performance: index su Object.status, Promise.all waterfall fix, query parallelizzate