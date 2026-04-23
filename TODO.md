# KYKOS - Todo List

<!-- Use checkboxes [ ] for pending, [x] for completed -->

## Auth & Users

- [x] Login con email/password
- [x] Gestione ruoli utente (donors, recipients, intermediaries)
- [ ] Login con Google OAuth
- [ ] Verifica email con OTP (per registrazione email/password, non Google)
- [ ] Ogni utente deve essere geolocalizzato;
- [ ] Prevedere una lista di oggetti sotto osservazione (lista desideri), per poterla poi recuperare e richiedere;
- [ ] La lista dei desideri dovrà dare evidenza se gli articoli sono ancora disponibili oppure no;
- [ ] Sistema di notifiche (anche via email) che consente di informare sullo stato della transazione: Il donatore sarà informato che qualcuno ha richiesto l'oggetto, il richiedente sarà informato che l'articolo è disponibile al ritiro (generazione qrcode per il ritiro)

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

---

## Trello: PROFILAZIONE UTENTE (Trello Inception)

- [x] LOGIN
- [x] PROFILO
- [x] AUTORIZZAZIONI
- [x] RICHIESTE
- [x] OFFERTE
- [ ] GESTIONE APPARTENENZA SEDI
- [ ] GESTIONE COMUNICAZIONE (CHAT)
- [ ] ACQUISIZIONE ISEE (campo esiste, upload documenti no)

## Trello: DOMANDA

- [ ] RICHIESTA ESIGENZA (richieste non legate a oggetti)
- [x] ASSEGNAZIONE OFFERTA
- [ ] GESTIONE EVENTI
- [ ] TRANSAZIONI (model esiste, flow incompleto)

## Trello: OFFERTA

- [ ] GESTIONE DISPONIBILITA'
- [x] GESTIONE DONAZIONE
- [ ] GESTIONE EVENTI
- [ ] TRANSAZIONI

## Trello: GESTIONALE ENTI

- [x] GESTIONE UTENTI
- [x] GESTIONI AUTORIZZAZIONI
- [x] GESTIONE OFFERTA
- [ ] GESTIONE STOCK
- [ ] GESTIONE VOLONTARI
- [ ] GESTIONE BOTTINO
- [ ] GESTIONE BANCO ALIMENTARE
- [ ] GESTIONE CONDIVISIONE TRA ENTI

## Trello: GESTIONALE VOLONTARI

- [ ] GESTIONE TRANSAZIONI

## Trello: AMMINISTRAZIONE SISTEMA

- [x] GESTIONE CATEGORIE ARTICOLI
- [ ] AFFILIAZIONE SEDI
- [ ] CONFIGURAZIONE SISTEMA
