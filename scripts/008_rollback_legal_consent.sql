-- =====================================================
-- KYKOS - Migration 008 ROLLBACK
-- Drop legal_consents table + LegalDocumentType enum
-- =====================================================
-- USAGE:
--   Solo se devi annullare la migration 008 per problemi
--   gravi. L'azione è IRREVERSIBILE: tutti i consensi
--   tracciati andranno persi.
-- =====================================================
-- ATTENZIONE: questa migration è già stata deployata in
-- produzione. Eseguire il rollback SOLO se sai cosa stai
-- facendo (es. bug critico nel flusso GDPR).
-- =====================================================

-- Step 1: Drop tabella (CASCADE rimuove indici e FK automaticamente)
DROP TABLE IF EXISTS "legal_consents" CASCADE;

-- Step 2: Drop enum (solo se nessun'altra tabella lo usa)
--         IF EXISTS rende lo script idempotente
DROP TYPE IF EXISTS "LegalDocumentType";

-- =====================================================
-- Verifica finale: tutto è stato rimosso?
-- =====================================================
SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'legal_consents') AS table_exists,
  (SELECT COUNT(*) FROM pg_type WHERE typname = 'LegalDocumentType') AS enum_exists;

-- Output atteso dopo rollback completo:
--  table_exists | enum_exists
--  --------------+-------------
--             0 |           0
