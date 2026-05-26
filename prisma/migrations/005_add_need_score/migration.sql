-- Migration: 005_add_need_score
-- Created: 2026-05-27
-- Desc: Aggiunge campo need_score ai beneficiari per ordinamento per bisogno

-- ================================================
-- Up Migration
-- ================================================

ALTER TABLE "users" ADD COLUMN "need_score" INTEGER DEFAULT 50;

COMMENT ON COLUMN "users"."need_score" IS 'Indice di bisogno del beneficiario (0-100). Editabile solo dagli admin dell''ente.';

-- ================================================
-- Down Migration (rollback)
-- =============================================

ALTER TABLE "users" DROP COLUMN IF EXISTS "need_score";