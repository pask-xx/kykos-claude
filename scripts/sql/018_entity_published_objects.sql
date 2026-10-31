-- =============================================================
-- 018_entity_published_objects.sql
-- Migration manuale per Supabase SQL Editor
-- =============================================================
--
-- Data: 2026-10-31
-- Scopo: permettere agli enti di pubblicare le proprie "disponibilità"
--        (oggetti giacenti nei loro depositi) come oggetti donati
--        dall'ente stesso. L'ente diventa il donatore: non esiste un
--        donatore utente da avvisare, il beneficiario riceve
--        direttamente il QR di ritiro.
--
-- Cosa fa:
--   1. Aggiunge la colonna objects.published_by_org_id (TEXT, nullable)
--      con FK verso organizations(id) ON DELETE SET NULL.
--   2. Crea l'indice objects_published_by_org_id_idx.
--
-- Decisione di modello:
--   - `donorId` RESTA OBBLIGATORIO e punta all'account dell'ente
--     (organizations.userId). Così l'ente è letteralmente il donatore e
--     `Donation.donorId` / l'intera catena esistente funzionano senza
--     modifiche (nessuna nullability a cascata).
--   - `published_by_org_id` è il MARCATORE che distingue "disponibilità
--     dell'ente" da "donazione di un utente". Nullable: sugli oggetti
--     esistenti resta NULL e il comportamento non cambia.
--
-- Retrocompatibilità: TOTALE.
--   - Nessun record esistente viene modificato o letto diversamente.
--   - Il codice applicativo usa il predicato `isEntityPublished()`
--     (src/lib/entity-objects.ts): NULL => comportamento identico a oggi.
--   - Il deactivation di un profilo esclude gli oggetti dell'ente
--     (published_by_org_id IS NULL), così disattivare l'account del
--     cap-ente NON annulla il magazzino.
--
-- Istruzioni:
--   1. Aprire Supabase SQL Editor
--   2. Incollare TUTTO il contenuto di questo file
--   3. Eseguire
--   4. Verificare:
--      SELECT column_name, data_type, is_nullable
--      FROM information_schema.columns
--      WHERE table_name = 'objects'
--      AND column_name = 'published_by_org_id';
--      → 1 riga, data_type=text, is_nullable=YES
--
-- Note: lo script è idempotente (ADD COLUMN IF NOT EXISTS,
--       CREATE INDEX IF NOT EXISTS, DO $$ per la FK). Eseguibile più
--       volte senza errori.
-- =============================================================

-- 1. Aggiungi colonna (idempotente con IF NOT EXISTS)
ALTER TABLE "objects"
  ADD COLUMN IF NOT EXISTS "published_by_org_id" TEXT;

-- 2. Indice per la query "disponibilità dell'ente" (filtro per ente)
CREATE INDEX IF NOT EXISTS "objects_published_by_org_id_idx"
  ON "objects"("published_by_org_id");

-- 3. Foreign Key verso organizations (idempotente via DO $$)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'objects_published_by_org_id_fkey'
  ) THEN
    ALTER TABLE "objects"
      ADD CONSTRAINT "objects_published_by_org_id_fkey"
      FOREIGN KEY ("published_by_org_id")
      REFERENCES "organizations"("id")
      ON DELETE SET NULL;
  END IF;
END $$;

-- =============================================================
-- Fine migration 018_entity_published_objects
-- =============================================================
