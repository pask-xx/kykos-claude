# Pilot Runbook — KYKOS

> Documento operativo per DONOR, RECIPIENT, OPERATOR (office + street) che testeranno KYKOS nella fase pilota.
> **Durata prevista del pilota**: 2 settimane. **Periodo**: da definire.
> **Cosa stiamo testando**: usabilità reale, completezza dei flussi, assenza di bug critici, performance percepite.

---

## Indice

1. [Come iniziare](#come-iniziare)
2. [Account di test](#account-di-test)
3. [Cosa testare — DONOR](#cosa-testare--donor)
4. [Cosa testare — RECIPIENT](#cosa-testare--recipient)
5. [Cosa testare — OPERATOR office](#cosa-testare--operator-office)
6. [Cosa testare — OPERATOR street](#cosa-testare--operator-street)
7. [Cose da osservare attentamente](#cose-da-osservare-attentamente)
8. [Cosa NON testare](#cosa-non-testare)
9. [Come segnalare bug](#come-segnalare-bug)
10. [Contatti e supporto](#contatti-e-supporto)

---

## Come iniziare

1. **Riceverai un'email con le credenziali** del tuo account di test (vedi sotto per il formato).
2. **Apri il link** che ti è stato fornito (è l'ambiente di staging, NON produzione).
3. **Cambia la password** al primo accesso (è una password temporanea).
4. **Inizia a esplorare** usando la checklist del tuo ruolo.

Se hai problemi di accesso, contatta [supporto](#contatti-e-supporto).

---

## Account di test

Tutti gli account sono già pre-creati nel database di staging con dati realistici ma sintetici. **NON usare password personali reali** — le credenziali qui sotto sono solo per il test.

### DONOR (donatore)

3 account disponibili:

| Email | Password iniziale | Nome | Note |
|-------|-------------------|------|------|
| `donor.test1@kykos-staging.it` | `KyKos2026!` | Mario Rossi | Ha 3 oggetti pubblicati, 1 richiesta ricevuta |
| `donor.test2@kykos-staging.it` | `KyKos2026!` | Anna Bianchi | Ha 5 oggetti, 2 richiesti |
| `donor.test3@kykos-staging.it` | `KyKos2026!` | Luca Verdi | Nuovo donatore, nessun oggetto |

### RECIPIENT (ricevente)

3 account disponibili, **autorizzati** da un ente (possono richiedere oggetti):

| Email | Password iniziale | Nome | Note |
|-------|-------------------|------|------|
| `recipient.test1@kykos-staging.it` | `KyKos2026!` | Giuseppe Neri | Ha già 1 richiesta APPROVED |
| `recipient.test2@kykos-staging.it` | `KyKos2026!` | Maria Gialli | Nessuna richiesta |
| `recipient.test3@kykos-staging.it` | `KyKos2026!` | Paolo Marroni | Score di bisogno alto (per testing ordinamento) |

### OPERATOR office (ente)

2 account disponibili:

| Email | Password iniziale | Nome | Ente |
|-------|-------------------|------|------|
| `operator.office1@kykos-staging.it` | `KyKos2026!` | Dott.ssa Ferrari | Caritas Roma |
| `operator.office2@kykos-staging.it` | `KyKos2026!` | Sig. Romano | Caritas Milano |

### OPERATOR street (volontario)

2 account disponibili:

| Email | Password iniziale | Nome | Note |
|-------|-------------------|------|------|
| `operator.street1@kykos-staging.it` | `KyKos2026!` | Volontario Uno | Segue 2 beneficiari |
| `operator.street2@kykos-staging.it` | `KyKos2026!` | Volontario Due | Segue 1 beneficiario |

---

## Cosa testare — DONOR

### Flusso principale: pubblica un oggetto

1. Login con account DONOR
2. Vai su "I miei oggetti" → "Pubblica oggetto"
3. Compila: titolo, descrizione, categoria, condizione, foto (almeno 1)
4. Scegli l'ente intermediario (puoi selezionare Caritas Roma o Milano)
5. Pubblica
6. **Verifica**: l'oggetto appare in "I miei oggetti" con stato "Disponibile"

### Flusso: gestisci richieste

1. Un ricevente ha già richiesto un tuo oggetto (vedi account `donor.test1`)
2. Vai su "Richieste ricevute"
3. Verifica che vedi il messaggio del ricevente ma **NON il suo nome** (regola di anonimato)
4. Se l'ente ha `autoApproveRequests = true`: la richiesta è già APPROVED e tu ricevi un'email con QR
5. Se l'ente ha `autoApproveRequests = false`: vedi la richiesta in stato PENDING, l'ente la valuterà

### Flusso: QR di consegna

1. Quando una richiesta è APPROVED, ricevi un'email con QR code
2. Clicca il link nell'email o vai su "I miei oggetti" → "Da consegnare"
3. Il QR code è quello da mostrare all'ente quando porti fisicamente l'oggetto
4. **Test**: prova a stampare o fare screenshot del QR. Funziona da mobile?

### Flusso: disattivazione profilo

⚠️ **Testare con cautela — operazione non reversibile nel pilota**

1. Vai su "Profilo" → "Disattiva account"
2. Conferma la password
3. **Verifica**:
   - I tuoi oggetti AVAILABLE → CANCELLED
   - I tuoi oggetti RESERVED → CANCELLED, le richieste collegate → CANCELLED, notifiche inviate ai riceventi
   - I tuoi oggetti DEPOSITED → restano DEPOSITED (li hai già consegnati fisicamente)
   - Non riesci più a fare login

---

## Cosa testare — RECIPIENT

### Flusso principale: richiedi un oggetto

1. Login con account RECIPIENT
2. Vai su "Oggetti disponibili" (geolocalizzati, entro 50km)
3. **Verifica anonimato**: vedi l'oggetto, la foto, la categoria, MA **NON il nome del donatore**
4. Filtra per categoria/condizione, prova la ricerca
5. Clicca su un oggetto, poi "Richiedi"
6. Scrivi un messaggio al donatore
7. **Possibili esiti**:
   - **Auto-approvato** (ente con `autoApproveRequests = true`): la richiesta è subito APPROVED, l'oggetto va in RESERVED, ricevi un QR di ritiro
   - **Da approvare** (ente con `autoApproveRequests = false`): la richiesta è PENDING, l'ente la valuterà

### Flusso: ricevi il QR di ritiro

1. Quando una richiesta è APPROVED, ricevi un'email
2. Clicca il link o vai su "Le mie richieste" → "Da ritirare"
3. Il QR code è quello da mostrare all'ente quando ritiri fisicamente l'oggetto

### Flusso: naviga la mappa

1. Vai su "Mappa oggetti"
2. Verifica che la geolocalizzazione funziona (devi dare il permesso al browser)
3. Prova a cambiare il raggio di ricerca

---

## Cosa testare — OPERATOR office

### Flusso: valida richieste in attesa

1. Login con account OPERATOR office
2. Vai su "Richieste da validare"
3. Vedi le richieste PENDING per il tuo ente
4. Per ogni richiesta: vedi oggetto, messaggio, **nome del ricevente** (tu operatore puoi)
5. Approva o rifiuta con motivazione
6. **Verifica**: il donatore riceve l'email, l'oggetto va in RESERVED

### Flusso: multi-availability

⚠️ **Funzionalità nuova, da testare con attenzione**

1. Vai su "Disponibilità multiple"
2. Crea una nuova disponibilità: descrivi un bene, indica quantità (es. "10 pacchi di pasta"), scadenza
3. I riceventi la vedranno e potranno richiederla
4. Vai sulla sezione "Assegna": vedi tutte le richieste per le tue disponibilità multiple
5. **Test importante**: prova ad assegnare più richieste della quantità disponibile. Il sistema deve rifiutare (vedi [bug B1 risolto](#cose-da-osservare-attentamente)).

---

## Cosa testare — OPERATOR street

### Flusso: assisti un beneficiario

⚠️ **Modello fiduciario**: tu operatore street VEDI i dati anagrafici del beneficiario che assisti. Questo è intenzionale (vedi [memory/04-anonymity.md](./memory/04-anonymity.md)).

1. Login con account OPERATOR street
2. Vai su "Beneficiari seguiti"
3. Per ogni beneficiario vedi: nome, codice fiscale, data di nascita, indirizzo, ISEE, richieste attive
4. Puoi fare richieste per suo conto (es. "il beneficiario X ha bisogno di un letto")

### Flusso: scansiona QR

1. Apri la sezione "Scansiona QR"
2. Inquadra un QR code di donazione (es. quello stampato da un donatore o generato da `donor.test1`)
3. Verifica che l'app riconosce il formato e mostra i dettagli
4. Conferma la consegna/ritiro

---

## Cose da osservare attentamente

Questi sono i bug critici che abbiamo appena fixato. **Per favore testa questi scenari specifici** per confermare che la fix funziona anche da UI.

### 🔴 Race condition: due riceventi richiedono lo stesso oggetto simultaneamente (B3)

**Scenario**: apri due browser (o due tab in incognito) come `recipient.test1` e `recipient.test2`, naviga sullo stesso oggetto in `AVAILABLE`, clicca "Richiedi" contemporaneamente su entrambi.

**Cosa deve succedere**:
- Un solo recipient ottiene APPROVED, l'altro riceve un errore "Oggetto appena riservato da un altro ricevente"
- Solo UN QR di consegna viene inviato al donatore
- Solo UNA donation viene creata

Se vedi due recipient entrambi APPROVED, **è un bug critico** — segnala immediatamente.

### 🔴 Race condition: operatore assegna più richieste della capacità (B1)

**Scenario**: operatore office ha una disponibilità multipla con `availableQty = 1`, e 3 riceventi hanno richiesto. L'operatore clicca "Assegna" su tutti e 3.

**Cosa deve succedere**:
- Solo 1 viene assegnato, gli altri 2 restano PENDING
- Un messaggio chiaro: "Hai richiesto 3, ma solo 1 slot disponibile"

### 🔴 Magic bytes: upload di file malevolo (A7)

**Scenario**: prova a caricare un file che NON è un'immagine ma dichiara di esserlo.

1. Rinomina un file `.exe` (o `.bat`, `.pdf`) in `.jpg`
2. Prova a caricarlo come foto oggetto o foto profilo
3. **Cosa deve succedere**: il sistema RIFIUTA con errore "Tipo di file non riconoscibile" o "Tipo file non consentito"

Se il sistema accetta un .exe camuffato, **è un bug di sicurezza critico**.

### 🔴 Soft-delete donatore: oggetti RESERVED + notifica al ricevente (B2)

**Scenario**: un donatore ha un oggetto RESERVED (con richiesta APPROVED di un ricevente) e disattiva il suo profilo.

**Cosa deve succedere**:
- L'oggetto va in CANCELLED
- La richiesta del ricevente va in CANCELLED
- Il ricevente riceve una notifica "L'oggetto XYZ non è più disponibile"

### 🟡 Anonimato: donatore che vede le richieste sui propri oggetti (A4)

**Scenario**: un donatore va su "Richieste ricevute".

**Cosa NON deve vedere**:
- Il nome del beneficiario che ha richiesto
- L'email del beneficiario
- Il telefono del beneficiario

**Cosa può/deve vedere**:
- L'oggetto richiesto
- Il messaggio del beneficiario
- La data della richiesta

---

## Cosa NON testare

- **Pagamenti reali**: il sistema di pagamento è disabilitato in staging. Il "pagamento simbolico" di 1-2€ è solo un placeholder UI.
- **Integrazione banking**: nessuna connessione a Stripe/banche in staging.
- **Notifiche SMS**: solo email.
- **Produzione**: tutto quello che fai è in staging, i dati sono sintetici e vengono resettati dopo il pilota.

---

## Come segnalare bug

### Formato del report

```
[RUOLO] [PAGINA o ENDPOINT] [BREVE TITOLO]

Esempio: [DONOR] [/donor/objects/new] "Upload di file .exe rinominato in .jpg viene accettato"

PASSI PER RIPRODURRE:
1. Login come donor.test1
2. Vai su "I miei oggetti" → "Pubblica"
3. Rinomina virus.exe in virus.jpg
4. Carica il file
5. Clicca "Pubblica"

RISULTATO ATTESO: errore "Tipo file non consentito"
RISULTATO OTTENUTO: il file viene accettato e l'oggetto pubblicato

GRAVITÀ: 🔴 Critico / 🟡 Importante / 🟢 Minore
DEVICE: Chrome 124 su Windows 11
```

### Gravità

- 🔴 **Critico**: bug di sicurezza, perdita di dati, flusso principale bloccato, race condition visibile
- 🟡 **Importante**: funzionalità rotta ma aggirabile, UX molto confusa
- 🟢 **Minore**: typo, layout rotto su un device specifico, animazione lenta

### Canale

Invia a `pilota-bugs@kykos-staging.it` (verrà creata) o usa il form a `https://kykos-staging.it/bug-report` (se attivo).

**Per bug 🔴 critici**: chiama direttamente il numero che hai ricevuto con le credenziali.

---

## Contatti e supporto

- **Email supporto generale**: `supporto@kykos-staging.it`
- **Email bug critici**: `pilota-bugs@kykos-staging.it`
- **Telefono emergenze** (solo per 🔴): ricevuto via email con le credenziali
- **Issue tracker**: `https://github.com/pask-xx/kykos-claude/issues` (per developer)

---

**Grazie per il testing!** I bug che trovi adesso sono quelli che gli utenti reali troverebbero in produzione. Ogni segnalazione ci aiuta.
