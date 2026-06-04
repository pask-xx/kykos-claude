# Setup Legal Documents — KYKOS

Setup per il sistema di versionamento dei documenti legali (Privacy + Termini) con bucket Supabase Storage, single source of truth da DB, e re-consenso automatico.

## Prerequisiti

1. Supabase project (stage + prod) con accesso admin
2. DB migration `009_add_legal_documents` applicata (vedi sotto)
3. Service role key di Supabase disponibile in `.env`
4. `npx prisma generate` eseguito (per il client aggiornato)

## Step 1 — DB Migration

### Stage / Prod

Esegui lo script idempotente nel SQL Editor di Supabase:

```bash
# File: scripts/009_add_legal_documents_idempotent.sql
# Da incollare ed eseguire in: Supabase Dashboard → SQL Editor → New query
```

Lo script crea:
- enum `LegalDocumentStatus` (scheduled | active | archived)
- tabella `legal_document_versions` con unique `(type, version)` e indici
- tabella `admin_actions` con indici
- 2 foreign keys verso `users`

**Idempotente**: può essere eseguito più volte senza errori. Include query di verifica alla fine.

## Step 2 — Crea bucket Supabase Storage

Nel dashboard Supabase:

1. Vai su **Storage** → **New bucket**
2. Name: `legal-documents`
3. **Public bucket**: ✅ ON (i documenti legali sono pubblici per definizione — art. 13 GDPR)
4. File size limit: 10 MB
5. Allowed MIME types: `application/pdf` (opzionale, restrizione lato UI)
6. Conferma

## Step 3 — Applica policy RLS

Esegui lo script nel SQL Editor di Supabase:

```bash
# File: scripts/fix-storage-policies-legal.sql
```

Lo script crea la policy `Public read access on legal-documents` su `storage.objects` per `bucket_id = 'legal-documents'`. Le mutation (INSERT/UPDATE/DELETE) sono deny-all per il client anonimo; il service role (lato server) le può sempre fare.

## Step 4 — Crea il primo admin (se non esiste)

Se non hai già un ADMIN, crealo con:

```bash
curl -X POST https://<your-domain>/api/admin/setup \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: $ADMIN_SETUP_SECRET" \
  -d '{
    "email": "admin@kykos.it",
    "password": "...",
    "name": "Admin KYKOS"
  }'
```

(richiede `ADMIN_SETUP_SECRET` settata nelle env Vercel).

## Step 5 — Seed iniziale v1.0

Crea le entry seed v1.0 di TERMS e PRIVACY con PDF segnaposto:

```bash
npx tsx scripts/seed-legal-v1.ts
```

Lo script è idempotente: se v1.0 esiste già, skippa. Al termine:
- 2 PDF segnaposto caricati su `documents/terms/v1.0.pdf` e `documents/privacy/v1.0.pdf`
- 2 record in `legal_document_versions` con `status='active'`
- 1 record in `admin_actions` con `action='legal_doc.seed_v1'`

### ⚠️ IMPORTANTE — I PDF seed sono segnaposto

I PDF generati da `seed-legal-v1.ts` sono tecnicamente validi (1 pagina "KYKOS - PLACEHOLDER v1.0") ma **NON hanno contenuto giuridico**. Servono solo a sbloccare il flusso end-to-end.

Dopo il seed, l'admin deve **immediatamente** caricare i PDF veri del legale via `/admin/legal` come v1.1 (o altra versione) e pubblicarli. Le v1.0 segnaposto possono restare in stato `active` o essere archiviate manualmente.

## Verifica end-to-end

Dopo i 5 step:

1. **Admin login** → vai a `/admin/legal`
   - Vedi 2 sezioni (Termini, Privacy), ciascuna con v1.0 in stato **Attiva**
2. **Pubblica nuova versione**
   - Clicca "Carica nuova versione" su Termini
   - Carica un PDF qualsiasi, versione "1.1", note "Test publish"
   - Lo stato passa a "Programmata"
   - Clicca "Pubblica" su v1.1, conferma il warning
   - v1.0 passa ad "Archiviata", v1.1 ad "Attiva"
3. **Re-consenso utente**
   - Logout, login con un donor esistente
   - Schermata `/auth/check-legal` appare con richiesta di accettare v1.1
   - Check + accetta → torna al feed
4. **Storage public access**
   - Apri in browser: `https://<supabase-url>/storage/v1/object/public/legal-documents/documents/terms/v1.1.pdf`
   - PDF scaricato (200 OK)
5. **Hash check**
   - Cambia 1 byte del PDF in Supabase Storage (manualmente)
   - Ricarica `/api/legal/status` → versione attiva invariata (1.1), ma `url` punta al file modificato
   - POST `/api/legal/consent` → hash calcolato è quello nuovo (rivelato dal cache miss)

## Smoke test post-deploy (Vercel staging)

Dopo il deploy:

- [ ] Login admin → `/admin/legal` carica senza errori
- [ ] Lista mostra 2 record v1.0 con badge "Attiva"
- [ ] Upload PDF di test (es. un PDF di 2-3 pagine) come v1.1
- [ ] Magic bytes check rifiuta un file `.exe` rinominato in `.pdf`
- [ ] Pubblica v1.1, controlla che v1.0 diventi "Archiviata"
- [ ] Login con donor esistente → schermata re-consenso per v1.1
- [ ] Accetta → torna al feed normalmente
- [ ] Storage: link pubblico al PDF funziona

## Struttura file

```
prisma/migrations/009_add_legal_documents/migration.sql  # migration "vera" (generata da Prisma)
scripts/009_add_legal_documents_idempotent.sql          # versione idempotente per Supabase SQL Editor
scripts/fix-storage-policies-legal.sql                   # RLS policy per bucket
scripts/seed-legal-v1.ts                                 # seed iniziale v1.0 (Node CLI)
docs/LEGAL-DOCUMENTS-SETUP.md                            # questo file
```

## Comandi utili

```bash
# Verifica record in DB
npx prisma studio
# → apri il modello LegalDocumentVersion

# Verifica file su Storage
# Supabase Dashboard → Storage → legal-documents → documents/terms/

# Log audit
# Supabase Dashboard → SQL Editor:
# SELECT * FROM admin_actions WHERE action LIKE 'legal_doc.%' ORDER BY created_at DESC LIMIT 20;
```

## Troubleshooting

**Errore: "Bucket legal-documents non trovato"**
→ Step 2 non eseguito. Crea il bucket.

**Errore: "Nessun utente ADMIN trovato"**
→ Step 4 non eseguito. Crea un admin con `/api/admin/setup`.

**Errore: "PDF non valido" all'upload**
→ Magic bytes check ha rilevato un file non-PDF. Verifica che il file inizi con `%PDF-`.

**Re-consenso non scatta dopo publish**
→ La cache in-memory ha TTL 30s. Aspetta 30s o ricarica con cache bypass (deploy).

**Storage 403 sui PDF**
→ Step 3 non eseguito. Applica la policy RLS.
