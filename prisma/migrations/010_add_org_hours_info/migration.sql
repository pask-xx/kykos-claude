-- =====================================================
-- KYKOS - Migration 010
-- Fix hoursInfo column name on organizations (schema expects hours_info via @map)
-- =====================================================
-- BACK-FILL MANCANTE: il campo hoursInfo è stato aggiunto allo schema
-- Prisma nel commit 684c774 (25 apr 2026) SENZA creare la migration
-- dedicata. In locale veniva creato come "hoursInfo" (camelCase, nome
-- di default Prisma senza @map), ma a un certo punto è stato aggiunto
-- @map("hours_info") allo schema → Prisma ora cerca "hours_info" che non
-- esiste nel DB di produzione (esiste ancora come "hoursInfo").
--
-- Errore riprodotto in produzione (16 giu 2026):
--   POST /api/auth/register 500
--   Invalid `prisma.user.create()` invocation:
--   The column `organizations.hours_info` does not exist in the current database
--   { code: 'P2022', modelName: 'User', column: 'organizations.hours_info' }
--
-- Strategia idempotente (DO block):
-- 1. Se esiste colonna "hoursInfo" (vecchia, camelCase) → rinomina in "hours_info"
-- 2. Altrimenti se NON esiste "hours_info" → creala come TEXT nullable
-- 3. Altrimenti (già "hours_info") → no-op
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'hoursInfo'
  ) THEN
    -- Caso produzione: colonna esiste come camelCase, rinomina per matchare @map
    ALTER TABLE "organizations" RENAME COLUMN "hoursInfo" TO "hours_info";
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'hours_info'
  ) THEN
    -- Caso DB vergine: crea direttamente con il nome corretto
    ALTER TABLE "organizations" ADD COLUMN "hours_info" TEXT;
  END IF;
END
$$;

COMMENT ON COLUMN "organizations"."hours_info" IS 'Rich text con orari di apertura e istruzioni per donatori/riceventi (campo opzionale dell''ente).';

-- =====================================================
-- Down Migration (rollback)
-- =====================================================
-- ATTENZIONE: rollback rinomina solo se è nello stato "hours_info".
-- Se la colonna è stata appena creata (caso vergine), la rimuove.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'hours_info'
  ) THEN
    ALTER TABLE "organizations" RENAME COLUMN "hours_info" TO "hoursInfo";
  END IF;
END
$$;
