-- =====================================================
-- KYKOS - Migration 011
-- Fix 4 colonne deposit* camelCase→snake_case su objects + goods_requests
-- + aggiunge goods_requests.description (mancante dal commit 1c0652b)
-- =====================================================
-- BACK-FILL: i campi depositLocation/depositNotes sono stati aggiunti
-- ai modelli Object (commit d4a4d18, 25 apr 2026) e GoodsRequest
-- (commit 240ad24, 29 apr 2026) SENZA creare migration dedicata.
-- In locale venivano creati come camelCase (default Prisma senza @map),
-- poi è stato aggiunto @map("deposit_location"/"deposit_notes") allo
-- schema → Prisma ora cerca snake_case che non esiste in produzione
-- (esiste ancora come camelCase).
--
-- INOLTRE: la colonna description su goods_requests (schema:
-- description String? @map("description") @db.Text) NON è mai stata
-- creata nello script di migration manuale scripts/goods-request-migration.sql
-- del commit 1c0652b (26 apr 2026). Il campo description è stato aggiunto
-- allo schema Prisma dopo la creazione della tabella.
--
-- Errori riprodotti in produzione (16 giu 2026):
--   GET /api/donor/objects 500
--     Invalid prisma.object.findMany() invocation:
--     The column `objects.deposit_location` does not exist
--     { code: 'P2022', modelName: 'Object', column: 'objects.deposit_location' }
--   GET /api/operator/requests-entity 500 (preventivo, description mancante)
--
-- Strategia idempotente (DO block per ciascuna colonna):
-- 1. Se esiste camelCase "depositLocation"/"depositNotes" → RENAME → snake_case
-- 2. Altrimenti se NON esiste snake_case → ADD COLUMN TEXT NULLABLE
-- 3. Altrimenti (già snake_case) → no-op
--
-- Esegue TUTTE le correzioni in un colpo solo: in caso di errori
-- successivi su altre route, lo script è già pronto e non servirà
-- un'altra esecuzione.
-- =====================================================

-- 1. objects.depositLocation → objects.deposit_location
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'objects'
      AND column_name = 'depositLocation'
  ) THEN
    ALTER TABLE "objects" RENAME COLUMN "depositLocation" TO "deposit_location";
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'objects'
      AND column_name = 'deposit_location'
  ) THEN
    ALTER TABLE "objects" ADD COLUMN "deposit_location" TEXT;
  END IF;
END
$$;

-- 2. objects.depositNotes → objects.deposit_notes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'objects'
      AND column_name = 'depositNotes'
  ) THEN
    ALTER TABLE "objects" RENAME COLUMN "depositNotes" TO "deposit_notes";
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'objects'
      AND column_name = 'deposit_notes'
  ) THEN
    ALTER TABLE "objects" ADD COLUMN "deposit_notes" TEXT;
  END IF;
END
$$;

-- 3. goods_requests.depositLocation → goods_requests.deposit_location
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'goods_requests'
      AND column_name = 'depositLocation'
  ) THEN
    ALTER TABLE "goods_requests" RENAME COLUMN "depositLocation" TO "deposit_location";
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'goods_requests'
      AND column_name = 'deposit_location'
  ) THEN
    ALTER TABLE "goods_requests" ADD COLUMN "deposit_location" TEXT;
  END IF;
END
$$;

-- 4. goods_requests.depositNotes → goods_requests.deposit_notes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'goods_requests'
      AND column_name = 'depositNotes'
  ) THEN
    ALTER TABLE "goods_requests" RENAME COLUMN "depositNotes" TO "deposit_notes";
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'goods_requests'
      AND column_name = 'deposit_notes'
  ) THEN
    ALTER TABLE "goods_requests" ADD COLUMN "deposit_notes" TEXT;
  END IF;
END
$$;

-- 5. goods_requests.description (TEXT, nullable)
-- Aggiunta allo schema Prisma DOPO la creazione iniziale della tabella
-- (commit 1c0652b non includeva questo campo). Vedi header.
ALTER TABLE "goods_requests" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Commenti per retro-tracciabilità
COMMENT ON COLUMN "objects"."deposit_location" IS 'Scaffale/doposito dove è stato placed. Aggiunto commit d4a4d18 (25 apr 2026) senza migration. Rinominato camelCase→snake_case in migration 011 (16 giu 2026) per matchare @map.';
COMMENT ON COLUMN "objects"."deposit_notes" IS 'Note aggiuntive sulla consegna oggetto.';
COMMENT ON COLUMN "goods_requests"."deposit_location" IS 'Scaffale/dove è stato depositato. Aggiunto commit 240ad24 (29 apr 2026) senza migration. Rinominato camelCase→snake_case in migration 011 (16 giu 2026).';
COMMENT ON COLUMN "goods_requests"."deposit_notes" IS 'Note aggiuntive sulla consegna richiesta beni.';
COMMENT ON COLUMN "goods_requests"."description" IS 'Descrizione testuale della richiesta (TEXT, nullable). Aggiunto allo schema Prisma dopo commit 1c0652b (26 apr 2026) ma mai migrato a DB. Back-fill migration 011 (16 giu 2026).';
