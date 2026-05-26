-- ================================================
-- Correzione: elimina colonna con underscore, usa camelCase
-- ================================================

-- Elimina la colonna errata (underscore)
ALTER TABLE users DROP COLUMN IF EXISTS need_score;

-- Aggiunge la colonna corretta (camelCase per Prisma)
ALTER TABLE users ADD COLUMN IF NOT EXISTS "needScore" INTEGER DEFAULT 50;

COMMENT ON COLUMN users."needScore" IS 'Indice di bisogno del beneficiario (0-100). Editabile solo dagli admin dell''ente.';