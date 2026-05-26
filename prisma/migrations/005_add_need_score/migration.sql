-- Migration: add_need_score
-- Desc: Aggiunge campo needScore ai beneficiari per ordinamento per bisogno

-- ================================================
-- Up Migration
-- =============================================

ALTER TABLE "users" ADD COLUMN "needScore" INTEGER DEFAULT 50;

COMMENT ON COLUMN "users"."needScore" IS 'Indice di bisogno del beneficiario (0-100). Editabile solo dagli admin dell''ente.';

-- ================================================
-- Down Migration (rollback)
-- =============================================

ALTER TABLE "users" DROP COLUMN IF EXISTS "needScore";