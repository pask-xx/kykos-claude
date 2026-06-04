# KYKOS — Audit Pre-Produzione (Refactor & Test)

> **Data**: 2026-06-02
> **Tipo**: read-only audit. Nessuna modifica al codice.
> **Perimetro test utenti pilota**: DONOR, RECIPIENT, OPERATOR (office + street).
> **Esclusi dal test**: INTERMEDIARY, ADMIN (tranne dove impattano l'anonimato).

---

## Sintesi Esecutiva (TL;DR)

Il progetto KYKOS è in stato **"MVP funzionante, pre-produzione"**. Funzionalità core ci sono, ma soffre di 3 problemi strutturali che vanno affrontati prima del test utenti:

| # | Problema | Impatto sul test | Sforzo fix |
|---|---------|------------------|------------|
| 1 | **Test "verdi" sono in parte fasulli** (2/4 file) | ALTO — niente safety net per refactor | 16-21h |
| 2 | **Bug critico noti**: race su multi-availability, try/catch silente in deactivation, street operator vede dati che non dovrebbe | ALTO — può rompere il test | 8-12h |
| 3 | **Ridondanze massicce** (JWT_SECRET in 25+ file, getOperatorSession in 25+ file, try/catch in 113 file) | MEDIO — alto costo di manutenzione | 12-16h |

**Stima totale per essere pronti al test**: 36-49 ore (4-6 giornate lavorative).

---

## Top Issues per Area

### A. Sicurezza / Anonimato (regola #1) — IMPATTO ALTO

> **NOTA**: I punti **A1, A2, A3, A5** riguardano street operator. NON sono bug: lo street operator è un **fiduciario del beneficiario** (lo assiste fisicamente, il beneficiario gli affida i dati). Mantenuti per documentazione, ma NON da fixare. Vedi `street-operators-extensions.md` sezione "Modello fiduciario".

| ID | File | Problema | Rischio | Sforzo | Stato |
|----|------|---------|---------|--------|-------|
| A1 | `src/app/api/operator/donors/[id]/route.ts:60-66` | Ritorna `fiscalCode, birthDate, address, email, firstName, lastName` a un operatore con solo `RECIPIENT_AUTHORIZE` | Anonimato donatore | 1-2h | **NON BUG** (modello fiduciario) |
| A2 | `src/app/api/operator/recipients/[id]/route.ts:60-67` | Ritorna `fiscalCode, isee, latitude, longitude` di un beneficiario | Anonimato ricevente | 30min | **NON BUG** (modello fiduciario) |
| A3 | `src/app/api/operator/cause/[id]/route.ts:53-65` | Ritorna `email+firstName+lastName+role` di tutti i partecipanti (inclusi DONOR che hanno donato) | Anonimato incrociato | 1h | **NON BUG** (modello fiduciario) |
| A4 | `src/app/api/donor/requests/route.ts:47` | Include `beneficiary: { select: { id: true } }` nonostante commento "for anonymity" | Re-identificazione | 15min | **DA FIXARE** (vera violazione: donor vede ID del beneficiary) |
| A5 | `src/app/api/donor/requests/route.ts:99-101` | `firstName, lastName, referenceEntityId` nel select del POST offers (branch street-managed) | Anonimato ricevente | 30min | **NON BUG** (street operator è il canale del beneficiario) |
| A6 | `src/lib/auth.ts:5-7` + 25+ altri file | `JWT_SECRET` fallback hardcoded `kykos-secret-key-change-in-production` — secret pubblico se env manca | Session hijack | 1h | ✅ **RISOLTO** (commit `79ddae7` fix(security): remove JWT_SECRET fallback, throw on missing env). Ora `getJwtSecret()` throw se env manca, fail-fast al boot. 70+ file refattorizzati, 91 test pass. |
| A7 | `src/app/api/upload/route.ts:50-53` | Upload file con estensione da `file.name.split('.').pop()` — `evil.png.php` passa | Esecuzione server-side | 2-3h | **DA FIXARE** (sicurezza reale) |

**Stima effettiva fix (escludendo NON BUG)**: ~3-4 ore (solo A4, A6, A7)

### B. Bug di Logica / Race Conditions — IMPATTO ALTO

| ID | File | Problema | Rischio | Sforzo |
|----|------|---------|---------|--------|
| B1 | `src/app/api/operator/multi-availability/[id]/assign/route.ts:99-105` | Check `assignedQty` non atomico: due operatori simultanei over-assignano | Consegne sbagliate | 2-3h |
| B2 | `src/app/api/profile/deactivate/route.ts:240-573` | `supabaseAdmin.auth.admin.deleteUser` in try/catch silente + side-effect fuori transazione | Account orfani | 3-4h |
| B3 | `src/app/api/requests/route.ts:78-94` | TOCTOU su auto-approval: read-then-write non in transazione | Race condition su oggetti | 2-3h |
| B4 | `src/lib/qrcode.ts:139-181` | `parseQrCodeData` ha 3 formati (legacy, new goods, new multiavailability) ma il test copre solo legacy | QR non leggibili | 1h (test) |

**Stima totale B**: ~8-11 ore

### C. Enum Tradotti (regola #2) — IMPATTO BASSO-MEDIO

| ID | File | Problema | Sforzo |
|----|------|---------|--------|
| C1 | `src/app/donor/statistics/page.tsx:184` | Fallback `obj.status` mostrato crudo | 15min |
| C2 | `src/app/donor/objects/[id]/page.tsx:237` | `req.status` fallback crudo | 15min |
| C3 | `src/app/donor/objects/page.tsx:51-53` | Switch enum non copre `BLOCKED` | 15min |
| C4 | `src/app/operator/objects/[id]/page.tsx:92-100` | Switch enum incompleto | 15min |
| C5 | `src/app/operator/street-beneficiaries/[id]/objects/route.ts:207-228` | Switch `ObjectStatus` ridefinito inline, dovrebbe usare `OBJECT_STATUS_LABELS` | 30min |

**Stima totale C**: ~1.5h

### D. Test (regola #3) — IMPATTO ALTO

**Stato attuale**:
- 4 file di test in `tests/`
- 2 reali e funzionanti (`permissions.test.ts`, `qrcode.test.ts`)
- 2 **placeholder** (`expect(true).toBe(true)`): `scan-qr-goods.test.ts`, `entity-requests/[id].test.ts`
- 0% copertura su: anonimato, redirect role, dispatch `/pwa`, deactivation, multi-availability, donor/to-deliver
- CI/CD assente (`.github/workflows/` non esiste)
- `vitest.config.ts` ha path case-inconsistent (`./tests/setup/mocks.ts` vs `tests\setup\mocks.ts`)

**Top 10 test da scrivere (Fase 1)** — filtrato per impatto sul test utenti:

| # | Test | Tipo | Cosa protegge | Sforzo |
|---|------|------|---------------|--------|
| 1 | `parseQrCodeData` per formato `multiavailability` (estensione test esistente) | Unit | QR ritiro distribuzioni | 1h |
| 2 | `getSession` ritorna null senza cookie + token scaduto | Unit | Bypass auth | 1h |
| 3 | `getOperatorSession` (nuovo, da estrarre) — null/invalid/valid | Unit | Bypass auth operator | 1h |
| 4 | Login normalizza email e blocca non confermati | Integration | Login flow | 2h |
| 5 | `pwa dispatch` per DONOR/RECIPIENT/INTERMEDIARY/ADMIN/operator | Integration | Punto d'ingresso PWA | 2h |
| 6 | Anonimato: `donor/requests` API non ritorna `beneficiary.name`/`email` | Integration | Regola #1 | 2h |
| 7 | `scan-qr-goods` rifiuta stato non valido (rendere veri i placeholder esistenti) | Integration | State machine | 3h |
| 8 | `entity-requests PATCH` action=approve/reject (rendere veri i placeholder) | Integration | State machine | 3h |
| 9 | `donor/to-deliver` filtra RESERVED e non include DONATED | Integration | QR oggetti | 2h |
| 10 | **NON PIÙ NECESSARIO**: street operator PUÒ vedere i dati anagrafici (modello fiduciario). Vedi memoria `street-operators-extensions.md`. | ~~Regola #1 (street)~~ | — |

**Infrastruttura da creare prima dei test**:
- `src/lib/operator-session.ts` (estrarre `getOperatorSession` + `requireOperator` + `requireOperatorWithPermission`)
- `src/lib/role-routes.ts` (`REDIRECT_BY_ROLE: Record<Role, string>`)
- `src/lib/api.ts` (`apiOk<T>` / `apiErr` helper tipati)
- Estensione `tests/setup/mocks.ts` con `prisma.$transaction`, `mockAuthSession`, mock per `parseQrCodeData` reale
- `tests/helpers/next-request.ts` (factory `createMockRequest`)
- `.github/workflows/test.yml` (Node 20, `npm ci`, `npm run test:run`)
- Rimozione cast `as any` in 6 file (vincolo per i test)

**Stima totale D**: ~16-21 ore (infrastruttura + 10 test)

### E. Refactoring (centralizzazioni) — IMPATTO MEDIO (manutenzione)

**Top 6 ridondanze da affrontare** (filtrate per perimetro test):

| ID | Pattern | File coinvolti | Sforzo | Rischio |
|----|---------|----------------|--------|---------|
| E1 | `getOperatorSession` + `JWT_SECRET` + `OperatorSession` ridefiniti 25+ volte | `src/app/api/operator/**` | 4-6h | Basso |
| E2 | 5 layout dashboard con stessa sequenza `getSession` → `redirect` → `fetch user` | `src/app/{donor,recipient,intermediary,operator,admin}/layout.tsx` | 3-4h | Medio |
| E3 | 113 file con `try/catch` → `console.error` → `return 500` identico | Tutte le API routes | 2-3h | Basso |
| E4 | `withErrorHandler` HOF (proposta E3) + `apiOk/apiErr` tipati | Helper nuovi | 1-2h | Basso |
| E5 | `OperatorSidebar.tsx` reimplementa `hasPermission` con mappa divergente | `src/components/operator/OperatorSidebar.tsx:64-74` | 30min | Basso se mappe equivalenti, medio altrimenti |
| E6 | `SidebarClient.tsx` + `DashboardShell.tsx` sono vecchie sidebar mai cancellate | `src/components/dashboard/{SidebarClient,DashboardShell}.tsx` | 1h | Basso (verificare import) |

**Stima totale E**: ~12-16 ore

---

## Piano Operativo (3 fasi)

### Fase 1 — Safety net (test prima del refactor) — ~16-21h
**Obiettivo**: avere una suite di smoke test che "urli" se rompiamo qualcosa di fondamentale durante la Fase 2.

1. Estrarre `getOperatorSession` in `src/lib/operator-session.ts` (abilita E1 + test #3)
2. Estrarre `REDIRECT_BY_ROLE` in `src/lib/role-routes.ts`
3. Creare `src/lib/api.ts` con `apiOk<T>` / `apiErr`
4. Estendere `tests/setup/mocks.ts` con `prisma.$transaction`, `mockAuthSession`, mock `parseQrCodeData`
5. Scrivere i 10 test della tabella D
6. Correggere path in `vitest.config.ts` (`./tests/setup/mocks.ts` → `./tests/setup/mocks.ts`)
7. Creare `.github/workflows/test.yml`
8. Rimuovere cast `as any` in 6 file (`donor/offers`, `operator/scan-qr-goods`, `entity-requests/[id]`, `multi-availability/[id]/assign`, `multi-availability/[id]/notify-exhausted`, `recipient/recipients/[id]`)

### Fase 2 — Refactoring low-risk + fix bug — ~21-32h
**Obiettivo**: pulizia chirurgica, area per area, con test che confermano zero regressioni.

**Sequenza consigliata** (ognuno è un commit separato):

| # | Intervento | Impatto | Test che protegge |
|---|-----------|---------|-------------------|
| 1 | **Fix bug A6** (rimozione fallback JWT_SECRET) | Sicurezza | Test #2, #3 |
| 2 | **Fix A4** (rimozione `beneficiary.id` dal select donor/requests) | Regola #1 (vera violazione) | Test #6, #10 |
| 3 | **Fix enum C1-C5** | Regola #2 | (visivo) |
| 4 | **Centralizzazione E1** (operator-session.ts) | Manutenzione | Test #3 |
| 5 | **Centralizzazione E3 + E4** (withErrorHandler) | Manutenzione | (nessun test diretto) |
| 6 | **Centralizzazione E2** (5 layout → helper) | Manutenzione | Test #5 |
| 7 | **Centralizzazione E5** (OperatorSidebar usa hasPermission) | Drift | (nessun test diretto) |
| 8 | **Cleanup E6** (rimozione SidebarClient/DashboardShell) | Pulizia | (verifica import) |
| 9 | **Fix bug B1** (race su multi-availability assignedQty) | Bug logica | Test D#7-#8 (estensione) |
| 10 | **Fix bug B2** (deactivation: transazione + cleanup) | Bug logica | (test #11 opzionale) |
| 11 | **Fix bug B3** (TOCTOU su requests POST) | Bug logica | (test #12 opzionale) |
| 12 | **Fix sicurezza A7** (upload MIME via magic bytes) | Sicurezza | (test #13 opzionale) |

### Fase 3 — Documentazione finale — ~2h
1. Aggiornare `MEMORY.md` con i pattern consolidati (dove sono gli helper)
2. Creare `docs/CONTRIBUTING.md` con il "modo KYKOS" di fare le cose
3. Aggiornare la memoria `05-known-issues.md` con i bug risolti

---

## Decisioni da Prendere (con te)

| # | Decisione | Default proposto |
|---|-----------|------------------|
| 1 | Approccio fix bug A6: rimuovere fallback vs assert esplicito? | **Assert esplicito** (errore chiaro se env manca) |
| 2 | Cleanup E6: cancellare SidebarClient/DashboardShell o solo deprecare? | **Verificare import prima, poi cancellare** |
| 3 | B1 fix: transazione + SELECT FOR UPDATE vs check constraint? | **Transazione con optimistic check + retry** (più semplice) |
| 4 | B2 fix: scomporre in step idempotenti con retry, o una mega-transazione? | **Step idempotenti** (più robusto a fallimenti Supabase) |
| 5 | Quanta copertura CI? Solo `test:run` o anche `test:coverage`? | **`test:run` ora, `test:coverage` in release successiva** |
| 6 | Vogliamo introdurre una regola "no `as any`" con lint? | **Sì, ma con `eslint-disable` per il pregresso** |

---

## File di Riferimento Rapido

### Da toccare in Fase 1 (test)
- `src/lib/operator-session.ts` (nuovo)
- `src/lib/role-routes.ts` (nuovo)
- `src/lib/api.ts` (nuovo)
- `src/lib/auth.ts` (estensione)
- `tests/setup/mocks.ts` (estensione)
- `tests/helpers/next-request.ts` (nuovo)
- `tests/integration/api/auth/login.test.ts` (nuovo)
- `tests/integration/app/pwa-dispatch.test.ts` (nuovo)
- `tests/integration/api/operator/scan-qr-goods.test.ts` (riscrittura da placeholder)
- `tests/integration/api/entity-requests/[id].test.ts` (riscrittura)
- `tests/integration/api/anonymity-donor.test.ts` (nuovo)
- `tests/integration/api/anonymity-operator-street.test.ts` (nuovo)
- `vitest.config.ts` (path fix)
- `.github/workflows/test.yml` (nuovo)

### Da toccare in Fase 2 (refactor + fix)
- `src/lib/auth.ts` (no fallback JWT_SECRET)
- `src/app/api/operator/donors/[id]/route.ts` (ridurre select)
- `src/app/api/operator/recipients/[id]/route.ts` (ridurre select)
- `src/app/api/operator/cause/[id]/route.ts` (rimuovere email+name per donor)
- `src/app/api/donor/requests/route.ts` (rimuovere `beneficiary.id` dal select)
- `src/app/donor/{statistics,objects,objects/[id]}/page.tsx` (label tradotte)
- `src/app/operator/objects/[id]/page.tsx` (label tradotte)
- `src/app/api/operator/multi-availability/[id]/assign/route.ts` (transazione atomica)
- `src/app/api/profile/deactivate/route.ts` (step idempotenti)
- `src/app/api/requests/route.ts` (transazione su auto-approve)
- `src/components/operator/OperatorSidebar.tsx` (import hasPermission)
- `src/components/dashboard/SidebarClient.tsx` (rimozione)
- `src/components/dashboard/DashboardShell.tsx` (rimozione)
- `src/app/api/upload/route.ts` (MIME via magic bytes)

---

## Note Finali

- **Lavorare in PR separate** per ogni intervento della Fase 2, con test che girano su ognuna
- **Mai toccare INTERMEDIARY/ADMIN** se non strettamente necessario (fuori perimetro test)
- **Commit + push a staging** per ogni intervento completato
- **Verificare build Vercel** dopo ogni push
- **Test regressione manuale** sui 3 flussi critici dopo ogni fix:
  1. Donor: pubblica oggetto → vede richieste → offre → vede QR
  2. Recipient: naviga feed → richiede oggetto → riceve notifica → vede QR
  3. Operator: vede oggetti ente → scansiona QR → assegna multi-avail

Se hai dubbi o vuoi cambiare le priorità delle 3 fasi, dimmi pure.
