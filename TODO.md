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
- [ ] **Regression tests per autenticazione (login, register, logout, OAuth flow)**
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

---

## Sistema Operatori Ente

Gli enti possono creare utenti operatori che gestiscono le attività per conto dell'organizzazione. Ogni operatore appartiene a un solo ente e ha credenziali di accesso separate.

### Codice Ente

Ogni ente ha un **codice univoco** (`Organization.code`) usato dagli operatori per effettuare il login. Esempi: `CARITAS-CENTRO-ROMA`, `PARROCCHIA-SGIOVANNI`.

### Login Operatore

Gli operatori accedono da `/operator/login` con:
- **Codice Ente** (es: CARITAS-CENTRO-ROMA)
- **Username** (univoco all'interno dell'ente, es: mario.rossi)
- **Password**

### Ruoli Operatore

| Ruolo | Descrizione |
|-------|-------------|
| `ADMIN` | Amministratore - accesso completo a tutte le funzionalità dell'ente |
| `GESTORE_RICHIESTE` | Gestisce le richieste degli utenti e può autorizzare i riceventi |
| `GESTORE_OGGETTI` | Gestisce l'entrata e la consegna degli oggetti |
| `GESTORE_VOLONTARI` | Gestisce i volontari dell'ente |
| `OPERATORE` | Ruolo base, nessun permesso predefinito |

### Permessi Granulari

Oltre ai ruoli, ogni operatore può avere **permessi specifici** aggiuntivi:

| Permesso | Descrizione |
|----------|-------------|
| `RECIPIENT_AUTHORIZE` | Abilitare utenti Riceventi |
| `OBJECT_RECEIVE` | Gestione entrata oggetti |
| `OBJECT_DELIVER` | Consegna oggetti al destinatario |
| `VOLUNTEER_MANAGE` | Organizzazione volontari |
| `REQUEST_PROXY` | Fare richieste per conto di utenti impossibilitati |
| `ORGANIZATION_ADMIN` | Amministrazione Ente (gestione operatori) |

### Permessi per Ruolo (default)

| Ruolo | Permessi inclusi |
|-------|------------------|
| ADMIN | Tutti i permessi |
| GESTORE_RICHIESTE | RECIPIENT_AUTHORIZE, REQUEST_PROXY |
| GESTORE_OGGETTI | OBJECT_RECEIVE, OBJECT_DELIVER |
| GESTORE_VOLONTARI | VOLUNTEER_MANAGE |
| OPERATORE | Nessuno (solo permessi granulari aggiuntivi) |

### API Operatori

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/operator/login` | Login operatore |
| POST | `/api/operator/logout` | Logout operatore |
| GET | `/api/operator/me` | Profilo operatore loggato |
| GET | `/api/operator` | Lista operatori ente (solo ADMIN) |
| POST | `/api/operator/register` | Crea nuovo operatore (solo ADMIN) |
| PATCH | `/api/operator/[id]` | Modifica operatore (solo ADMIN) |
| DELETE | `/api/operator/[id]` | Elimina operatore (solo ADMIN) |

### Creazione Operatore

Solo un ADMIN dell'ente può creare operatori. L'username deve essere univoco all'interno dell'ente (non globalmente).

### Esempio JSON operatore

```json
{
  "id": "op_xxx",
  "username": "mario.rossi",
  "email": "mario.rossi@caritas.it",
  "phone": "+39 333 1234567",
  "firstName": "Mario",
  "lastName": "Rossi",
  "role": "GESTORE_RICHIESTE",
  "permissions": ["RECIPIENT_AUTHORIZE", "REQUEST_PROXY"],
  "active": true,
  "organization": {
    "id": "org_xxx",
    "name": "Caritas Diocesana Roma",
    "code": "CARITAS-CENTRO-ROMA"
  }
}
```

## Trello: GESTIONALE VOLONTARI

- [ ] GESTIONE TRANSAZIONI

## Trello: AMMINISTRAZIONE SISTEMA

- [x] GESTIONE CATEGORIE ARTICOLI
- [ ] AFFILIAZIONE SEDI
- [ ] CONFIGURAZIONE SISTEMA
