---
name: multi-availability
description: Disponibilità multipla - distribuzione beni senza consegne, assegnazione manuale dall'ente
metadata:
  type: reference
---

# Disponibilità Multipla ("Distribuzione")

## Concetto

Una **disponibilità multipla** è quando un ente pubblica una quantità definita di beni (es. 50 pacchi alimentari) che non vengono assegnati con logica "chi prima arriva si aggiudica". L'ente raccoglie richieste da tutti i beneficiari e poi **decide manualmente** chi riceverà il QR code di ritiro.

## Caratteristiche principali

- **Nessuna consegna**: l'ente rende disponibile il bene per ritiro diretto
- **Assegnazione manuale**: l'ente seleziona i beneficiari in base alle esigenze
- **Richieste > disponibilità**: il sistema raccoglie più richieste del numero disponibile
- **Ordinamento per score**: i beneficiari sono ordinati per `needScore` (indice di bisogno 0-100)
- **QR Code**: generato per i beneficiari assegnati dall'ente

## Modello dati

### MultiAvailability
```
- id, title, description, category, imageUrls[]
- availableQty: numero totale di pezzi disponibili
- assignedQty: numero di pezzi assegnati (incrementato dall'ente)
- status: OPEN | CLOSED | EXHAUSTED
- deadline: data limite per richiedere (opzionale)
- exhaustMessage: messaggio per chi non viene assegnato
- organizationId → Organization
```

### MultiAvailabilityRequest
```
- id, needScoreSnapshot (copia del score al momento della richiesta)
- requestedAt, status: PENDING | ASSIGNED | REJECTED | FULFILLED | CANCELLED
- qrCode, fulfilledAt, notifiedAt
- multiAvailabilityId → MultiAvailability
- beneficiaryId → User
```

## Ruoli e permessi

| Azione | Chi |
|--------|-----|
| Crea disponibilità | OPERATORE con permesso ORGANIZATION_ADMIN |
| Visualizza richieste | OPERATORE con permesso ORGANIZATION_ADMIN |
| Assegna beneficiari | OPERATORE con permesso ORGANIZATION_ADMIN |
| Richiede disponibilità | BENEFICIARIO (utente con ruolo RECIPIENT) |

## Regole di anonimato

- Il **beneficiario NON vede** il numero di disponibilità totali
- Il **beneficiario NON vede** quante richieste sono state fatte
- Il **beneficiario vede** solo: titolo, descrizione, categoria, data pubblicazione
- L'**ente vede** tutte le info incluse score e count richieste

## Flusso utente (beneficiario)

1. Va nella dashboard → vede sezione "Distribuzioni disponibili" in cima
2. Vede card con stile uguale agli oggetti (white, shadow-sm, border)
3. Clicca sulla card → si espande con descrizione e bottone "Richiedi"
4. Conferma → richiesta inviata con stato PENDING
5. Attende notifica dall'ente (non c'è feedback automatico)

## Flusso ente (operatore)

1. Crea disponibilità da `/operator/availability` → seleziona "Distribuzione"
2. Compila: titolo, descrizione, categoria, quantità, deadline, messaggio esaurimento
3. Carica foto → salva → status OPEN
4. Va in dettaglio disponibilità → vede lista richieste ordinata per needScore
5. Usa strumenti: "Seleziona primi N", riordina per data richiesta
6. Seleziona beneficiari → clicca "Assegna" → generato QR code
7. Per i non assegnati: modifica messaggio e invia notifica "scorte esaurite"

## API endpoints

### Beneficiary
- `GET /api/recipient/multi-availability` → lista disponibilità aperte per il proprio ente
- `POST /api/recipient/multi-availability/[id]/requests` → crea richiesta

### Operator
- `GET /api/operator/multi-availability` → lista tutte le disponibilità dell'ente
- `POST /api/operator/multi-availability` → crea nuova disponibilità
- `GET /api/operator/multi-availability/[id]` → dettaglio con lista richieste
- `PATCH /api/operator/multi-availability/[id]` → aggiorna (es. chiudi, modifica qty)
- `POST /api/operator/multi-availability/[id]/requests/assign` → assegna beneficiari selezionati
- `POST /api/operator/multi-availability/[id]/requests/reject` → rifiuta richieste
- `POST /api/operator/multi-availability/[id]/notify-exhaust` → invia notifica a non assegnati