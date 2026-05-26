-- ================================================
-- Aggiunta campo needScore per beneficiari
-- ================================================
-- Lo score rappresenta l'indice di bisogno del beneficiario:
-- 0 = poco bisogno
-- 100 = molto bisogno
-- Valore proposto automaticamente in base all'ISEE,
-- ma editabile solo dagli amministratori dell'ente

ALTER TABLE users
ADD COLUMN IF NOT EXISTS need_score INTEGER DEFAULT 50;

-- Valore default 50 (neutro)
-- Update sui record esistenti per impostare score basato su ISEE (se presente)
-- Formula: score = LEAST(GREATEST((100 - CAST(isee AS NUMERIC) / 100), 0), 100)
-- Oppure score = 50 per chi non ha ISEE

-- Per impostare score iniziale basato su ISEE (esempio):
-- UPDATE users SET need_score =
--   CASE
--     WHEN isee IS NULL THEN 50
--     WHEN isee <= 5000 THEN 100  -- Massima necessità
--     WHEN isee <= 10000 THEN 75
--     WHEN isee <= 20000 THEN 50
--     WHEN isee <= 35000 THEN 25
--     ELSE 10  -- Bassa necessità
--   END
-- WHERE role = 'RECIPIENT';

COMMENT ON COLUMN users.need_score IS 'Indice di bisogno del beneficiario (0-100). Editabile solo dagli admin dell''ente.';