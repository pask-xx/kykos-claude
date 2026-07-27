-- Migration 015: multi-slot hours su Organization + Location.notes.
-- Aggiunge colonne strutturate mantenendo retrocompat totale.

ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "hours" JSONB;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "notes" TEXT;

ALTER TABLE "locations" ADD COLUMN IF NOT EXISTS "notes" TEXT;

COMMENT ON COLUMN "organizations"."hours" IS 'Orari di apertura strutturati per giorno (multi-slot JSON). Forma: {day: [{open, close}, ...] | null}. Coesiste con hours_info (legacy TipTap) per retrocompat.';
COMMENT ON COLUMN "organizations"."notes" IS 'Note libere sulla sede principale (es. "Suonare il campanello"). Plain text, escape HTML in render.';
COMMENT ON COLUMN "locations"."notes" IS 'Note libere sulla sede aggiuntiva. Plain text, escape HTML in render.';