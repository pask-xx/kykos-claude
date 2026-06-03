-- =====================================================
-- KYKOS - Migration 008 (idempotent version)
-- Add legal_consents table + LegalDocumentType enum
-- GDPR-compliant consent tracking (Privacy + ToS)
-- =====================================================
-- USAGE:
--   1. Apri Supabase Dashboard > SQL Editor
--   2. Scegli il DB giusto (STAGING o PRODUCTION)
--   3. Incolla questo script e clicca RUN
--   4. Verifica lo stato finale in fondo allo script
-- =====================================================
-- Questo script è IDEMPOTENTE: se la migration è già stata applicata
-- (es. da Vercel build, o un altro dev), non genera errori.
-- Eseguibile più volte senza side-effect.
-- =====================================================

-- Step 1: Crea l'enum LegalDocumentType (se non esiste già)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LegalDocumentType') THEN
    CREATE TYPE "LegalDocumentType" AS ENUM ('TERMS', 'PRIVACY');
    RAISE NOTICE 'Created enum LegalDocumentType';
  ELSE
    RAISE NOTICE 'Enum LegalDocumentType already exists, skipping';
  END IF;
END $$;

-- Step 2: Crea la tabella legal_consents (se non esiste già)
CREATE TABLE IF NOT EXISTS "legal_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" "LegalDocumentType" NOT NULL,
    "version" TEXT NOT NULL,
    "documentHash" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "legal_consents_pkey" PRIMARY KEY ("id")
);

-- Step 3: Crea indici (IF NOT EXISTS è supportato da PG 9.5+)
CREATE UNIQUE INDEX IF NOT EXISTS "legal_consents_userId_documentType_version_key"
  ON "legal_consents"("userId", "documentType", "version");
CREATE INDEX IF NOT EXISTS "legal_consents_userId_idx"
  ON "legal_consents"("userId");
CREATE INDEX IF NOT EXISTS "legal_consents_documentType_version_idx"
  ON "legal_consents"("documentType", "version");

-- Step 4: Aggiungi il foreign key verso users (se non esiste già)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'legal_consents_userId_fkey'
  ) THEN
    ALTER TABLE "legal_consents"
      ADD CONSTRAINT "legal_consents_userId_fkey"
      FOREIGN KEY ("userId")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
    RAISE NOTICE 'Added FK legal_consents_userId_fkey';
  ELSE
    RAISE NOTICE 'FK legal_consents_userId_fkey already exists, skipping';
  END IF;
END $$;

-- =====================================================
-- Verifica finale: la tabella esiste con la struttura attesa?
-- =====================================================
SELECT
  'legal_consents' AS table_name,
  COUNT(*) AS column_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'legal_consents') AS index_count,
  (SELECT COUNT(*) FROM pg_constraint WHERE conname = 'legal_consents_userId_fkey') AS fk_count
FROM information_schema.columns
WHERE table_name = 'legal_consents';

-- Output atteso (su applicazione fresca):
--  table_name        | column_count | index_count | fk_count
--  ------------------+--------------+-------------+----------
--  legal_consents    |            8 |           3 |        1
--
-- Se vedi 0 colonne, la tabella NON è stata creata — rileggi lo script.
-- Se vedi 8 colonne ma 0 indici o 0 FK, qualcosa è andato storto.

-- =====================================================
-- Verifica enum
-- =====================================================
SELECT enumlabel
FROM pg_enum
WHERE enumname = 'LegalDocumentType'
ORDER BY enumsortorder;

-- Output atteso:
--  enumlabel
--  ----------
--  TERMS
--  PRIVACY

-- =====================================================
-- Verifica che la relazione Prisma funzioni
-- (deve tornare 0 perché nessun utente ha ancora accettato)
-- =====================================================
SELECT COUNT(*) AS total_legal_consents FROM "legal_consents";
-- Atteso: 0 (nessun consenso registrato finché non arriva un utente nuovo)
