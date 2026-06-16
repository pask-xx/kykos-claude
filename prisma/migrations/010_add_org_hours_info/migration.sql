-- =====================================================
-- KYKOS - Migration 010
-- Add hours_info column to organizations
-- =====================================================
-- BACK-FILL MANCANTE: il campo hoursInfo è stato aggiunto allo schema
-- Prisma nel commit 684c774 (25 apr 2026) SENZA creare la migration
-- dedicata. In locale funzionava per db push, in produzione
-- (Supabase migrations) la colonna non è mai stata creata.
--
-- Errore riprodotto in produzione (16 giu 2026):
--   POST /api/auth/register 500
--   Invalid `prisma.user.create()` invocation:
--   The column `organizations.hours_info` does not exist in the current database
--   { code: 'P2022', modelName: 'User', column: 'organizations.hours_info' }
--
-- Idempotente (ADD COLUMN IF NOT EXISTS) per sicurezza.
-- =====================================================

ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "hours_info" TEXT;

COMMENT ON COLUMN "organizations"."hours_info" IS 'Rich text con orari di apertura e istruzioni per donatori/riceventi (campo opzionale dell''ente).';

-- =====================================================
-- Down Migration (rollback)
-- =====================================================

ALTER TABLE "organizations" DROP COLUMN IF EXISTS "hours_info";
