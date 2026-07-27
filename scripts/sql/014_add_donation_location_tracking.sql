-- =============================================================
-- 014_add_donation_location_tracking.sql
-- Migration manuale per Supabase SQL Editor
-- =============================================================
--
-- Data: 2026-07-12
-- Scopo: aggiungere tracciamento sede effettiva sulle Donation (Fase C).
--
-- Cosa fa:
--   1. Aggiunge 4 colonne nullable a Donation:
--      - pickedUpAt, pickedUpAtLocationId (sede dove il donatore ha consegnato)
--      - deliveredAt, deliveredAtLocationId (sede dove il beneficiario ha ritirato)
--   2. Crea 2 foreign key verso locations (ON DELETE SET NULL)
--   3. Crea 2 indici per query "donation per sede"
--
-- Retrocompatibilità: TOTALE.
--   - Tutti i campi sono NULLABLE: le donation esistenti non vengono toccate
--   - Le route di scan QR esistenti NON sono modificate (i campi saranno
--     popolati in una fase successiva)
--   - La logica "sede suggerita" calcolata a runtime (Fase C) non usa
--     questi campi: calcola la distanza donatore↔sede + beneficiario↔sede
--     e mostra TUTTE le sedi dell'ente al donatore
--
-- Istruzioni:
--   1. Aprire Supabase SQL Editor
--   2. Incollare TUTTO il contenuto di questo file
--   3. Eseguire
--   4. Verificare:
--      SELECT column_name FROM information_schema.columns
--      WHERE table_name = 'donations'
--      AND column_name IN ('pickedUpAt', 'pickedUpAtLocationId',
--                          'deliveredAt', 'deliveredAtLocationId');
--      → 4 righe
--
-- Note: lo script è idempotente (ADD COLUMN IF NOT EXISTS, DO block su FK).
--        Eseguibile più volte senza errori.
-- =============================================================

-- 1. Aggiungi colonne a Donation (idempotente con IF NOT EXISTS)
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "pickedUpAt" TIMESTAMP(3);
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "pickedUpAtLocationId" TEXT;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3);
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "deliveredAtLocationId" TEXT;

-- 2. Foreign keys verso locations (nullable, ON DELETE SET NULL per
--    preservare la Donation se la sede viene archiviata)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'donations_pickedUpAtLocationId_fkey'
  ) THEN
    ALTER TABLE "donations"
      ADD CONSTRAINT "donations_pickedUpAtLocationId_fkey"
      FOREIGN KEY ("pickedUpAtLocationId") REFERENCES "locations"("id") ON DELETE SET NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'donations_deliveredAtLocationId_fkey'
  ) THEN
    ALTER TABLE "donations"
      ADD CONSTRAINT "donations_deliveredAtLocationId_fkey"
      FOREIGN KEY ("deliveredAtLocationId") REFERENCES "locations"("id") ON DELETE SET NULL;
  END IF;
END
$$;

-- 3. Indici per performance (query "donation per sede")
CREATE INDEX IF NOT EXISTS "donations_pickedUpAtLocationId_idx"
  ON "donations"("pickedUpAtLocationId");
CREATE INDEX IF NOT EXISTS "donations_deliveredAtLocationId_idx"
  ON "donations"("deliveredAtLocationId");

-- =============================================================
-- Fine migration 014_add_donation_location_tracking
-- =============================================================
