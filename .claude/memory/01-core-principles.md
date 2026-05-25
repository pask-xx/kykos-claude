---
name: 01-core-principles
description: La regola #1 è l'ANONIMAT. Donatore e Ricevente non si vedono mai.
metadata:
  type: reference
---

# Principi Core KYKOS

## LA REGOLA #1: ANONIMAT

**Il DONATORE non vede MAI l'identità del RICEVENTE. Il RICEVENTE non vede MAI l'identità del DONATORE.**

L'unica eccezione: **INTERMEDIARIO** (l'organizzazione fidata) vede entrambe le parti perché gestisce fisicamente la donazione.

## Le Tre Regole

| Regola | Descrizione |
|--------|-------------|
| Anonimato donatore | Il donatore non vede mai chi ha ricevuto |
| Anonimato ricevente | Il ricevente non vede mai chi ha donato |
| Trasparenza intermediario | L'intermediario vede entrambi (parte fidata) |

## Visibilità per Ruolo

| Chi | Vede nome donatore? | Vede nome ricevente? |
|-----|--------------------|----------------------|
| PUBBLICO (non loggato) | **MAI** - Oggetti NON visibili senza auth | N/A |
| DONATORE | N/A | **MAI** |
| RICEVENTE (loggato) | **MAI** | N/A |
| INTERMEDIARIO | SÌ | SÌ |
| ADMIN | NO | NO |

## Regole di Visibilità Dettagliate

### PUBBLICO (non autenticato)
- **Gli oggetti NON sono visibili** senza autenticazione
- Qualsiasi route `/objects` o `/api/objects` deve richiedere autenticazione

### RICEVENTE (autenticato)
- Vede: titolo, descrizione, foto, categoria, condizione, distanza
- Vede: `donorProfile.level` (BRONZE/SILVER/GOLD/PLATINUM/DIAMOND) come "badge di fiducia"
- **NON vede mai**: `donor.name`

### DONATORE (autenticato)
- Vede i propri oggetti e lo stato
- Richieste per i suoi oggetti: **"Qualcuno ha richiesto il tuo oggetto"** - nessun nome
- **NON vede mai**: `recipient.name`

### INTERMEDIARIO
- Vede **entrambi** i nomi (gestisce fisicamente la donazione)
- Route `/api/intermediary/*` corrette per vedere entrambi

## Violazioni Mai Commettere

- `/api/objects` che ritorna `donor.name`
- `/objects/[id]` che mostra `donor.name`
- `/api/donor/objects` con `recipient.name` nelle requests
- Qualunque UI che mostra nomi reali tra donatore/ricevente

## Regole di Decisione

1. **Dubbio su anonimato**: "Questo utente ha bisogno del nome per completare la donazione?" Se no, rimuoverlo.
2. **Aggiungere un field al select**: Verificare ogni ruolo che riceve questo dato.
3. **Creare una nuova API route**: Default = select minimo. Aggiungere campi solo quando il business logic richiede.

## REGOLA #3: ENUMERATI TRADOTTI IN ITALIANO

**Gli enumerati NON devono essere mostrati così come sono nel codice.**

Ogni enum (status, priorità, livelli, categorie, ecc.) deve essere tradotto in italiano usando le label definite in `src/types/index.ts`.

### Esempi corretti vs errati

| Enum (codice) | ❌ Errato | ✅ Corretto |
|---------------|----------|------------|
| `AVAILABLE` | "AVAILABLE" | "Disponibile" |
| `PENDING` | "PENDING" | "In attesa" |
| `BRONZE` | "BRONZE" | "Bronzo" |
| `DIAMOND` | "DIAMOND" | "Diamante" |
| `FURNITURE` | "FURNITURE" | "Arredamento" |
| `ELECTRONICS` | "ELECTRONICS" | "Elettronica" |

### Come implementare

Usa SEMPRE le label da `src/types/index.ts`:

```typescript
import { STATUS_LABELS, REQUEST_STATUS_LABELS, CATEGORY_LABELS, DONOR_LEVEL_LABELS } from '@/types';

// Uso corretto in UI
<p>{STATUS_LABELS[object.status]}</p>
<p>{CATEGORY_LABELS[object.category]}</p>
<p>{DONOR_LEVEL_LABELS[user.level]}</p>
```

### Label disponibili

- `REQUEST_STATUS_LABELS` per RequestStatus
- `OBJECT_STATUS_LABELS` per ObjectStatus
- `CATEGORY_LABELS` per Category
- `CONDITION_LABELS` per Condition
- `DONOR_LEVEL_LABELS` per DonorLevel
- `ROLE_LABELS` per Role

## REGOLA #4: NICKNAME PER GLI UTENTI

**Ogni utente ha un nickname (fantasy name) usato dagli enti per identificarlo senza vedere il nome reale.**

### Regole nickname

1. **Opzionale** per tutti gli utenti (DONOR, RECIPIENT)
2. **Non univoco** — può essere condiviso da più utenti (è solo display)
3. **Scelto dall'utente** in fase di registrazione (con bottone "Genera")
4. **Fantasy nickname** se l'utente non lo sceglie (formato: `aggettivo.sostantivo.numero`, es. `kind.heart.42`)
5. **Gli enti (INTERMEDIARY/OPERATOR) vedono il nickname**, non il nome reale

### Fantasy Nickname

Esempi: `kind.heart.42`, `warm.sun.128`, `gentle.spirit.7`

```typescript
// src/lib/utils.ts - generateFantasyNickname()
const adjectives = ['kind', 'gentle', 'warm', 'bright', ...];
const nouns = ['heart', 'soul', 'spirit', 'dream', ...];
return `${pick(adjectives)}.${pick(nouns)}.${num}`;
```

### Come funziona

- In registrazione: campo nickname facoltativo con bottone "Genera"
- Se vuoto: generato fantasy nickname da `generateFantasyNickname()` in `src/lib/utils.ts`
- Intermediary/Operator UI: mostra `user.nickname` invece di `user.name` o `user.firstName`

### Pattern UI per enti

```typescript
// ✅ CORRETTO - Enti vedono nickname
<td>{user.nickname}</td>

// ❌ ERRATO - Enti che vedono nome reale
<td>{user.name}</td>
<td>{user.firstName} {user.lastName}</td>
```
