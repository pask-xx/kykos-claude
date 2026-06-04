-- =====================================================
-- KYKOS - Migration 009 (idempotent version)
-- Add legal_document_versions + admin_actions tables
-- + LegalDocumentStatus enum
-- =====================================================
-- USAGE:
--   1. Apri Supabase Dashboard > SQL Editor
--   2. Scegli il DB (STAGING o PRODUCTION)
--   3. Incolla e clicca RUN
--   4. Verifica lo stato finale in fondo
-- =====================================================
-- Prerequisito: migration 008 gia' applicata (legal_consents + LegalDocumentType)
-- Idempotente: eseguibile piu' volte senza errori.
-- =====================================================

-- Step 1: Crea enum LegalDocumentStatus (se non esiste)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LegalDocumentStatus') THEN
    CREATE TYPE "LegalDocumentStatus" AS ENUM ('scheduled', 'active', 'archived');
    RAISE NOTICE 'Created enum LegalDocumentStatus';
  ELSE
    RAISE NOTICE 'Enum LegalDocumentStatus already exists, skipping';
  END IF;
END $$;

-- Step 2: Crea tabella legal_document_versions (se non esiste)
CREATE TABLE IF NOT EXISTS "legal_document_versions" (
    "id" TEXT NOT NULL,
    "type" "LegalDocumentType" NOT NULL,
    "version" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "status" "LegalDocumentStatus" NOT NULL DEFAULT 'scheduled',
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "notes" TEXT,
    CONSTRAINT "legal_document_versions_pkey" PRIMARY KEY ("id")
);

-- Step 3: Indici (IF NOT EXISTS supportato da PG 9.5+)
CREATE UNIQUE INDEX IF NOT EXISTS "legal_document_versions_type_version_key"
  ON "legal_document_versions"("type", "version");
CREATE INDEX IF NOT EXISTS "legal_document_versions_type_status_idx"
  ON "legal_document_versions"("type", "status");
CREATE INDEX IF NOT EXISTS "legal_document_versions_uploadedById_idx"
  ON "legal_document_versions"("uploadedById");

-- Step 4: FK verso users (se non esiste)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'legal_document_versions_uploadedById_fkey'
  ) THEN
    ALTER TABLE "legal_document_versions"
      ADD CONSTRAINT "legal_document_versions_uploadedById_fkey"
      FOREIGN KEY ("uploadedById") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    RAISE NOTICE 'Added FK legal_document_versions_uploadedById_fkey';
  ELSE
    RAISE NOTICE 'FK legal_document_versions_uploadedById_fkey already exists, skipping';
  END IF;
END $$;

-- Step 5: Crea tabella admin_actions (se non esiste)
CREATE TABLE IF NOT EXISTS "admin_actions" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- Step 6: Indici admin_actions
CREATE INDEX IF NOT EXISTS "admin_actions_adminId_idx" ON "admin_actions"("adminId");
CREATE INDEX IF NOT EXISTS "admin_actions_action_idx" ON "admin_actions"("action");
CREATE INDEX IF NOT EXISTS "admin_actions_createdAt_idx" ON "admin_actions"("createdAt");

-- Step 7: FK admin_actions verso users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_actions_adminId_fkey'
  ) THEN
    ALTER TABLE "admin_actions"
      ADD CONSTRAINT "admin_actions_adminId_fkey"
      FOREIGN KEY ("adminId") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
    RAISE NOTICE 'Added FK admin_actions_adminId_fkey';
  ELSE
    RAISE NOTICE 'FK admin_actions_adminId_fkey already exists, skipping';
  END IF;
END $$;

-- =====================================================
-- Verifica finale
-- =====================================================
SELECT
  'legal_document_versions' AS table_name,
  COUNT(*) AS column_count
FROM information_schema.columns WHERE table_name = 'legal_document_versions'
UNION ALL
SELECT
  'admin_actions' AS table_name,
  COUNT(*) AS column_count
FROM information_schema.columns WHERE table_name = 'admin_actions';

-- Output atteso:
--  table_name               | column_count
--  -------------------------+--------------
--  legal_document_versions  |           14
--  admin_actions            |            7

-- Verifica enum
SELECT e.enumlabel
FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
WHERE t.typname = 'LegalDocumentStatus'
ORDER BY e.enumsortorder;

-- Atteso: scheduled, active, archived
