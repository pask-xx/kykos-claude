-- Migration 014_add_donation_location_tracking
-- Aggiunge tracciamento sede effettiva sulle Donation (Fase C).
--
-- Schema impattato:
--   - 3 campi nullable su Donation (pickedUpAt, pickedUpAtLocationId,
--     deliveredAt, deliveredAtLocationId, deliveredAt)
--   - 2 indici per query future su "donation per sede"
--
-- NOTA: la migration è SOLO ADDITIVE. Le donation esistenti avranno
-- tutti i campi NULL (nessuna scansione QR tracciata prima di Fase C).
-- Le route di scan QR esistenti NON vengono modificate in questa fase.
-- Il popolamento dei campi avverrà in una fase successiva, quando
-- integreremo la logica "operatore scansiona → sede inferred".
--
-- Workflow KYKOS: applicare manualmente via Supabase SQL Editor.
-- Lo script è idempotente (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

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
