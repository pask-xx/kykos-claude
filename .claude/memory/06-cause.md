---
name: 06-cause
description: Flusso Cause — raccolta fondi promossa dagli enti
metadata:
  type: project
---

# Cause — Flusso di Raccolta Fondi / Promozione Prodotti

## Concept

Gli enti possono organizzare **Cause** per finanziare attività/opere o promuovere prodotti (es. limoni, arance). Le Cause sono visibili nelle dashboard di Donatori e Beneficiari, che possono "Adere" seguendo le istruzioni fornite dall'ente.

## Attributi Causa

| Campo | Tipo | Obbligatorio | Note |
|-------|------|-------------|------|
| `title` | string | Sì | Titolo della causa |
| `description` | string | Sì | Descrizione ampia con istruzioni per aderire |
| `imageUrls` | string[] | No | Foto della causa |
| `deadline` | Date | No | Data di scadenza |
| `targetQty` | number | No | Disponibilità — se omesso = illimitato |
| `organizationId` | string | Sì | Ente creatore |

## Visibilità

- **Donatori**: vedono le Cause nella propria dashboard
- **Beneficiari**: vedono le Cause nella propria dashboard
- **Ente (Operatori)**: creano e gestiscono le Cause

## Flusso di Adesione

1. Donatore/Beneficiario vede la causa in dashboard
2. Clicca "Adere" → join table (es. `CauseParticipant`) registra l'adesione
3. L'utente segue le istruzioni nella descrizione (spesso: recarsi fisicamente in ente, opzionalmente dopo notifica in-app/email)
4. L'adesione rimane tracciata ma il completamento è fuori dal sistema (azione fisica)

## Join Table

`CauseParticipant`:
- `id`
- `causeId` → Causa
- `userId` → Donatore o Beneficiario
- `joinedAt` → Data adesione
- `note` → (opzionale) note interne ente

## Pagine

### Lista Cause (`/operator/cause`)
- Lista di tutte le Cause create dall'ente
- Statistiche: titolo, deadline, numero partecipanti, stato
- Possibilità di creare nuova causa

### Dettaglio Causa (`/operator/cause/[id]`)
- Informazioni complete della causa (titolo, descrizione, foto, deadline, targetQty)
- Lista partecipanti con count
- Statistiche adesioni
- **Invio comunicazioni**: l'ente può inviare notifica in-app e/o email a tutti i partecipanti
- Modifica causa

## Invio Comunicazioni

Dalla pagina dettaglio, l'operatore può inviare:
- **Notifica in-app**: messaggio che appare nella UI del partecipante
- **Email**: email informativa ai partecipanti che hanno aderito

Il messaggio è libero (textarea) e viene inviato a tutti i partecipanti alla causa.

## Regole di Visibilità

- Donatore/Beneficiario non vedono gli altri partecipanti
- Ente vede quante adesioni ci sono per causa
- Enum `CAUSE` va tradotto in "Causa" (singolare) / "Cause" (plurale)
