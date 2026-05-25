---
name: 05-known-issues
description: Bug attuali e violazioni che necessitano correzione
metadata:
  type: project
---

# Issue Attuali da Correggere

## VIOLAZIONI ANONIMATO — CORRETTE

Le seguenti violazioni sono state corrette:

### 1. `/api/objects` espone donor.name — ✅ CORRETTO
**File**: `src/app/api/objects/route.ts`
**Correzione**: Aggiunto check auth (401 se non loggato), rimosso `donor.name`, aggiunto `donorProfile.level`

### 2. Pagina oggetto pubblica mostra donor name — ✅ CORRETTO
**File**: `src/app/objects/[id]/page.tsx` + `src/app/api/objects/[id]/route.ts`
**Correzione**: Autenticazione richiesta, `donor.name` rimosso, `donorProfile.level` mostrato

### 3. `/api/donor/objects` espone recipient.name — ✅ CORRETTO
**File**: `src/app/api/donor/objects/route.ts`
**Correzione**: Rimosso `recipient.name` dalla select requests. UI deve mostrare "Qualcuno ha richiesto".

---

## DUPLICAZIONE DATA MODEL

- `User.name` esiste per "backward compat" ma `firstName`/`lastName` esistono anche
- Da decidere: tenere solo `firstName`/`lastName` o consolidare

---

## FEATURE MANCANTI (da ARCHITECTURE.md)

- [ ] Max 3 intermediari vicini mostrati al ricevente
- [ ] Selezione entità donatore (quali intermediari possono ricevere)
- [ ] Upload e validazione documento ISEE
- [ ] Integrazione pagamenti reali (Payment model esiste ma nessun Stripe)
- [ ] Flow completo notifiche email

---

## AUTH IBRIDO

- `User.authUserId` collega a Supabase Auth
- Ma c'è anche hash password locale in `User` model
- Due path auth: Supabase Auth + JWT locale
