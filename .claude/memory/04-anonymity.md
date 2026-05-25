---
name: 04-anonymity
description: Regole anonimato - DA VERIFICARE su ogni PR
metadata:
  type: reference
---

# Regole ANONIMATO (CRITICHE)

## La Regola
**DONATORE e RICEVENTE sono anonimi tra loro SEMPRE.**

L'Intermediario è l'unica parte che conosce entrambe le identità.

## Cosa Può Vedere Ogni Ruolo

### PUBBLICO (non autenticato)
```typescript
// Non vede NULLA - gli oggetti richiedono autenticazione
// Qualsiasi route /objects per pubblico deve:
1. Ritornare 401 Unauthorized, OPPURE
2. Redirect a /auth/login
```

### RICEVENTE (autenticato) - browse oggetti
```typescript
// CORRETTO: Browse per ricevente autenticato
{
  id, title, description, category, condition,
  imageUrls, latitude, longitude,
  donorProfile: { level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' }
  // NO donor.name, NO donor.id
}
```

### DONATORE - richieste per i suoi oggetti
```typescript
// CORRETTO: Donatore vede solo "qualcuno ha richiesto"
{
  id, objectId, status, createdAt,
  // NO recipientId, NO recipient.name
}
// UI: "Qualcuno ha richiesto il tuo oggetto"
```

### INTERMEDIARIO (correttamente vede entrambi)
```typescript
// CORRETTO: Intermediario vede entrambi
{
  object: { title, imageUrls, donor: { name: true } },
  recipient: { name: true, firstName: true, lastName: true }
}
```

### ADMIN
- **MAI** esporre nomi donatore o ricevente
- Solo statistiche aggregate

## Violazioni Attuali (KNOWN ISSUES)

1. **`/api/objects/route.ts` linea 42-44** — ritorna `donor.name` (per pubblico o per errore)
2. **`/objects/[id]/page.tsx` linea 184** — mostra `{object.donor.name}` pubblicamente
3. **`/api/donor/objects/route.ts` linea 28-29** — include `recipient.name` nelle requests

## Come Verificare

Prima di ogni PR, cerca questi pattern:
- `donor.name` in route API — è in una route INTERMEDIARY-only?
- `recipient.name` in route API — è in route INTERMEDIARY o DONOR?
- `recipient: { select: { name` — chi riceve questo dato?

## Anonimato in UI

Se UI deve mostrare "qualcuno ha richiesto il tuo oggetto", usa:
- "Un beneficiario ha richiesto il tuo oggetto" (senza nome)
- Badge anonimato: "🔒 Anonimato: La richiesta è anonima. Non puoi vedere chi l'ha fatta."
