-- =============================================================
-- 017_user_can_request_fresh.sql
-- Migration manuale per Supabase SQL Editor
-- =============================================================
--
-- Data: 2026-09-15
-- Scopo: aggiungere flag esplicito User.canRequestFresh per abilitare
--        i beneficiari alla prenotazione di slot prodotti freschi.
--
-- Contesto:
--   Esistono già canRequestGoods (default true) e canRequestServices
--   (default false). Manca il flag dedicato al fresco. Senza questo
--   flag, un beneficiario autorizzato (`authorized=true`) vedrebbe il
--   link Prodotti freschi anche se l'ente non vuole concedergli
--   l'accesso al fresco (es. non ha mai aderito a quel programma).
--
-- Decisione governance (utente 2026-09-15):
--   DEFAULT FALSE (restrittivo, come canRequestServices).
--   Tutti i beneficiari attuali NON vedranno il link finché l'ente
--   non abilita esplicitamente il flag.
--   Approccio conservativo: l'ente concede il fresco solo a chi
--   aderisce al programma specifico.
--
-- Cosa fa:
--   1. Aggiunge colonna can_request_fresh BOOLEAN DEFAULT FALSE
--      alla tabella users (nullable per retro-compatibilità).
--   2. Crea indice parziale per query efficienti "beneficiari
--      abilitati al fresco".
--
-- Retrocompatibilità: TOTALE.
--   - Colonna nullable con DEFAULT FALSE: i record esistenti non
--     vengono toccati (ricevono FALSE = restrittivo).
--   - Nessuna route esistente si rompe: il flag è solo ADD-ON.
--   - Il controllo in canReserveFreshSlot viene aggiunto in parallelo
--     (vedi src/lib/fresh-events.ts).
--
-- Istruzioni:
--   1. Aprire Supabase SQL Editor
--   2. Incollare TUTTO il contenuto di questo file
--   3. Eseguire
--   4. Verificare:
--      SELECT column_name, data_type, column_default
--      FROM information_schema.columns
--      WHERE table_name = 'users'
--      AND column_name = 'canRequestFresh';
--      → 1 riga, data_type=boolean, column_default=false
--
-- Note: lo script è idempotente (ADD COLUMN IF NOT EXISTS,
--       CREATE INDEX IF NOT EXISTS). Eseguibile più volte senza errori.
-- =============================================================

-- 1. Aggiungi colonna can_request_fresh (idempotente con IF NOT EXISTS)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "canRequestFresh" BOOLEAN DEFAULT FALSE;

-- 2. Indice parziale: solo beneficiari abilitati al fresco.
--    Ottimizza query future "lista beneficiari che possono richiedere fresco"
--    usata da operatori/admin per statistiche/audit.
CREATE INDEX IF NOT EXISTS "users_can_request_fresh_idx"
  ON "users"("canRequestFresh")
  WHERE "canRequestFresh" = TRUE;

-- =============================================================
-- Fine migration 017_user_can_request_fresh
-- =============================================================
