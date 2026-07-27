-- =============================================================
-- 015_add_hours_multi_slot_and_notes.sql
-- Migration manuale per Supabase SQL Editor
-- =============================================================
--
-- Data: 2026-07-28
-- Scopo: supporto multi-apertura orari (mattina + pomeriggio) + note libere
--        sulle sedi (principale + periferiche).
--
-- Cosa fa:
--   1. Aggiunge colonna "hours" JSONB a "organizations":
--      Orari strutturati multi-slot per giorno, forma:
--        { "monday": [{ "open": "09:00", "close": "12:00" },
--                    { "open": "15:00", "close": "18:00" }],
--          "tuesday": [{ "open": "09:00", "close": "18:00" }],
--          "sunday":  null }
--      Coesiste con "hours_info" (legacy TipTap) per retrocompat.
--   2. Aggiunge colonna "notes" TEXT a "organizations":
--      Note libere sede principale (es. "Suonare il campanello").
--   3. Aggiunge colonna "notes" TEXT a "locations":
--      Note libere sede aggiuntiva (punto di raccolta).
--
-- Retrocompatibilità: TOTALE.
--   - Tutte le colonne sono NULLABLE: i record esistenti restano intatti.
--   - "hours_info" NON viene toccato: resta leggibile da tutte le route
--     email/QR esistenti come fallback.
--   - "locations.hours" (colonna Postgres JSONB) NON viene rinominato:
--     cambia solo la SHAPE LOGICA del payload (single-slot → array).
--     Un helper "normalizeLocationHours()" wrappa i record legacy
--     single-slot in array lato read.
--
-- Istruzioni:
--   1. Aprire Supabase SQL Editor
--   2. Incollare TUTTO il contenuto di questo file
--   3. Eseguire
--   4. Verificare:
--        SELECT column_name FROM information_schema.columns
--        WHERE table_name='organizations' AND column_name IN ('hours','notes');
--        → 2 righe attese
--        SELECT column_name FROM information_schema.columns
--        WHERE table_name='locations' AND column_name='notes';
--        → 1 riga attesa
--
-- Note: lo script è idempotente (ADD COLUMN IF NOT EXISTS).
--        Eseguibile più volte senza errori.
-- =============================================================

-- 1. Orari strutturati multi-slot sulla sede principale
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "hours" JSONB;
COMMENT ON COLUMN "organizations"."hours" IS 'Orari di apertura strutturati per giorno (multi-slot JSON). Forma: {day: [{open, close}, ...] | null}. Coesiste con hours_info (legacy TipTap) per retrocompat.';

-- 2. Note libere sulla sede principale
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "notes" TEXT;
COMMENT ON COLUMN "organizations"."notes" IS 'Note libere sulla sede principale (es. "Suonare il campanello"). Plain text, escape HTML in render.';

-- 3. Note libere sulle sedi aggiuntive (punti di raccolta)
ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "notes" TEXT;
COMMENT ON COLUMN "locations"."notes" IS 'Note libere sulla sede aggiuntiva. Plain text, escape HTML in render.';

-- =============================================================
-- Fine migration 015_add_hours_multi_slot_and_notes
-- =============================================================