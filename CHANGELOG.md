# Changelog

Tutte le modifiche rilevanti al progetto KYKOS, organizzate per categoria. Per i dettagli tecnici dei singoli commit, vedi `git log`.

## [Unreleased] — Pre-Pilota (2026-06-02)

Audit completo pre-pilota eseguito in 3 fasi. **12 interventi completati**, 155 test verdi, zero regressioni. Audit dettagliato in [REFACTOR-AUDIT.md](./REFACTOR-AUDIT.md).

### Security

- **A6 — Rimozione fallback JWT_SECRET** (commit `79ddae7`): assert esplicito all'avvio se `JWT_SECRET` mancante. Prima un fallback debole permetteva deployment con secret indovinabile.
- **A7 — Validazione MIME via magic bytes** (commit `f965319`): 3 route upload (`/api/upload`, `/api/profile-photo`, `/api/volunteer/upload-cv`) ora verificano i magic bytes del file, non il Content-Type dichiarato dal client. Protegge da file malevoli (eseguibili) mascherati come immagini.
- **A4 — Anonimato donor/requests** (commit `cca9e19`): il donatore che visualizza le richieste sui propri oggetti non vede più il nome del beneficiario. Enforcement verificato dal test `donor-requests-anonymity.test.ts`.

A1, A2, A3, A5: marcati come **NON BUG** per design — il modello fiduciario street operator prevede esplicitamente l'accesso a dati anagrafici dei beneficiari street assistiti.

### Race conditions

- **B1 — Atomic transaction per multi-availability assign** (commit `1ccd784`): il pattern "operator assegna N richieste in una volta" usava un check-then-update sequenziale vulnerabile a race. Fix: `prisma.$transaction` con `updateMany` condizionato su `status: 'PENDING'`. 10 test.
- **B2 — Deactivation soft-delete + Supabase retry** (commit `90a80d3`): sostituito `user.delete` con `user.update({ deactivatedAt, deactivatedActions[] })` per preservare lo storico delle donazioni. Supabase `deleteUser` spostato fuori dalla transaction con retry (max 3 tentativi, backoff esponenziale), treat "User not found" come successo idempotente. 8 test.
- **B3 — Race-safe reservation su POST /api/requests** (commit `53e9ee6`): due recipient in concorrenza potevano entrambi creare una request APPROVED sullo stesso oggetto, generando due QR code di consegna. Fix: la creazione di request+donation+object update è dentro una `prisma.$transaction` con `object.updateMany` condizionato su `status: 'AVAILABLE'`. 10 test.

### Refactoring (riduzione duplicazione, manutenibilità)

- **E1 — Centralizzazione operator session** (commit `cca9e19`): estratto `src/lib/operator-session.ts`. Rimosse 5+ copie inline di `getOperatorId()` dalle route API.
- **E2 — Centralizzazione 4 layout user** (commit `17d1476`): estratto `src/lib/layout-helper.ts` con `requireUserSession()` + `KYKOS_VIEWPORT`. 4 layout dashboard (donor/recipient/intermediary/admin) deduplicati.
- **E3 + E4 — `withErrorHandler` HOF** (commit `c4bad2c`): estratto `src/lib/api.ts` con Higher-Order Function per gestione errori consistente nelle route. Applicato a `/api/operator/donors` come dimostrazione.
- **E5 — OperatorSidebar usa `hasPermission` centralizzato** (commit `024abaf`): rimossa copia inline 13-righe. Import diretto da `@/lib/permissions`.
- **E6 — Cleanup dead code** (commit `b194f54`): rimossi `SidebarClient.tsx` + `DashboardShell.tsx` (196 righe di codice morto, zero importer).

### Enum tradotti (Regola #2)

- **C1-C5 — Centralizzazione label enum** (commit `42d7174`): tutte le UI usano ora le label da `src/types/index.ts` (`STATUS_LABELS`, `CATEGORY_LABELS`, `DONOR_LEVEL_LABELS`). Mai più `AVAILABLE`, `PENDING`, `BRONZE` esposti grezzi.

### Test infrastructure

- **155 test totali** (17 file): 7 unit + 9 integration + 1 app (PWA dispatch)
- Helper estratti: `tests/setup/mocks.ts` (Prisma + Supabase + email + QR mocks), `tests/setup/fixtures.ts`, `tests/helpers/auth-helpers.ts`
- Pattern consolidato: `mockImplementation` invece di `mockResolvedValue` per mock stateful
- Test suite verde stabile a 155/155 (3.86s)

### Documentazione

- **README.md**: da 1 riga vuota a onboarding completo (Node 22, install, env vars, comandi)
- **CHANGELOG.md** (questo file): storico leggibile per stakeholder
- **CONTRIBUTING.md**: codifica del "modo KYKOS" (3 regole non negoziabili + pattern architetturali + anti-pattern vietati)
- **docs/PILOT-RUNBOOK.md**: istruzioni operative per DONOR/RECIPIENT/OPERATOR del pilota

## [Earlier commits] — Pre-refactor

Storico anteriore al refactor pre-pilota. Vedi `git log --oneline` per i dettagli. Bug fix minori recenti: PWA chrome display, QR code donatore (requestId vs objectId), filtri status invalidi, for-loop mancante in street operator notification, sezioni UI donor to-deliver.

---

**Formato**: basato su [Keep a Changelog](https://keepachangelog.com/it/1.1.0/).
