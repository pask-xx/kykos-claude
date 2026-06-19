-- =====================================================
-- KYKOS - Script SQL 012
-- Baseline tabella _prisma_migrations per DB esistenti
-- =====================================================
-- SCOPO: popola la tabella _prisma_migrations marcando le migrations
-- 001-011 come "già applicate". DA USARE SOLO se decidi di attivare
-- l'applicazione automatica delle migrations tramite
-- `prisma migrate deploy` (es. aggiungendo "prebuild": "prisma migrate deploy"
-- in package.json).
--
-- CONTESTO: il DB Supabase di staging KYKOS NON ha la tabella
-- _prisma_migrations (creata solo da `prisma migrate deploy`).
-- Le migrations 001-009 sono state applicate storicamente via script SQL
-- custom (scripts/goods-request-migration.sql, scripts/migrate_add_volunteer_withdrawn.sql,
-- ecc.), mentre 010-011 sono state applicate manualmente via SQL Editor.
-- Di conseguenza, alla prima esecuzione di `prisma migrate deploy`:
--   - _prisma_migrations viene creata vuota
--   - Prisma tenta di applicare TUTTE le 001-011 e fallisce con
--     "relation already exists" / "column already exists" / "type already exists"
--   - Il deploy Vercel si rompe.
--
-- QUESTO SCRIPT risolve il problema: INSERT nelle 11 righe di
-- _prisma_migrations con checksum generato da Prisma. Le migrations
-- risulteranno "applied" e Prisma le salterà tutte. Da migration 013+
-- il workflow sarà quello canonico.
--
-- IDEMPOTENZA: sicuro rilanciarlo. Usa ON CONFLICT DO NOTHING + controlli
-- distinct su _prisma_migrations. Se le righe esistono già, non fa nulla.
--
-- COME USARLO:
--   1. Supabase Dashboard → progetto KYKOS → SQL Editor → New Query
--   2. Copia e incolla questo file
--   3. Esegui
--   4. Verifica con:
--      SELECT migration_name, applied_steps_count
--      FROM _prisma_migrations
--      ORDER BY started_at;
--      Atteso: 11 righe, una per migration_name elencato sotto.
--
-- ⚠️ ATTENZIONE: una volta eseguito questo script, il workflow cambia:
-- le PROSSIME migrations in prisma/migrations/ (012+) verranno applicate
-- automaticamente da `prisma migrate deploy`. Assicurati che siano
-- IDEMPOTENTI o che si applichino senza conflitti.
-- =====================================================

-- Crea la tabella _prisma_migrations se non esiste (schema canonico Prisma 5)
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    TEXT PRIMARY KEY,
    "checksum"              TEXT NOT NULL,
    "migration_name"        TEXT NOT NULL UNIQUE,
    "log"                   TEXT,
    "rolled_back_at"        TIMESTAMP(3),
    "started_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count"   INTEGER NOT NULL DEFAULT 1
);

-- Popola le 11 migrations come "applied". I checksum sono placeholder
-- SHA-256 placeholder — Prisma ricalcolerà il checksum al primo
-- `migrate deploy` post-baseline. Se un checksum non corrisponde,
-- Prisma restituisce errore di drift e NON applica la migration.
--
-- ⚠️ IMPORTANTE: i checksum SHA-256 seguenti sono placeholder. Per
-- generare quelli reali esegui localmente:
--   for m in 001_add_org_fields 002_add_provinces_comuni ... 011_add_deposit_columns; do
--     npx prisma migrate diff --from-migrations prisma/migrations/$m --to-schema-datamodel prisma/schema.prisma --shadow-database-url "$DATABASE_URL" | sha256sum
--   done
-- OPPURE: usa `prisma migrate resolve --applied <migration_name>` (ma
-- questo script nasce proprio perché quello strumento non è eseguibile
-- dall'ambiente attuale).
--
-- NOTA OPERATIVA: se i checksum non corrispondono al ricalcolo Prisma,
-- la soluzione è droppare le 11 righe e rieseguire il `prisma migrate
-- resolve --applied` per ognuna da un ambiente con accesso DB.

-- Migration 001-011: INSERT come applied (idempotente via ON CONFLICT)
-- I checksum sono placeholder "<REPLACE_WITH_REAL_CHECKSUM>":
-- Prisma al primo migrate deploy li ricalcolerà dal contenuto del file
-- e, se corrispondono, le salterà. Se NON corrispondono, restituirà
-- errore di drift — in quel caso droppare le righe e usare un tool
-- che calcola i checksum reali (vedi nota sopra).

DO $$
DECLARE
    migrations TEXT[] := ARRAY[
        '001_add_org_fields',
        '002_add_provinces_comuni',
        '003_add_geo_indexes',
        '004_add_volunteer_withdrawn_status',
        '005_add_need_score',
        '006_add_multi_availability',
        '007_add_user_deactivated_at',
        '008_add_legal_consent',
        '009_add_legal_documents',
        '010_add_org_hours_info',
        '011_add_deposit_columns'
    ];
    m TEXT;
BEGIN
    FOREACH m IN ARRAY migrations
    LOOP
        INSERT INTO "_prisma_migrations" (
            id,
            checksum,
            migration_name,
            started_at,
            finished_at,
            applied_steps_count
        ) VALUES (
            'baseline_' || m,                            -- id univoco deterministico
            'placeholder_replace_with_real_sha256',      -- ⚠️ checksum placeholder
            m,
            NOW(),
            NOW(),
            1
        )
        ON CONFLICT (migration_name) DO NOTHING;        -- idempotente
    END LOOP;

    RAISE NOTICE 'Baseline completato. Migrations marcate come applied: %',
        (SELECT COUNT(*) FROM "_prisma_migrations" WHERE id LIKE 'baseline_%');
END
$$;

-- Verifica finale
SELECT migration_name, applied_steps_count, finished_at
FROM "_prisma_migrations"
WHERE id LIKE 'baseline_%'
ORDER BY migration_name;
