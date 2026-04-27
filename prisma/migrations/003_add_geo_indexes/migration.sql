-- Additional indexes for geo tables

BEGIN;

-- Enable pg_trgm extension for trigram indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index on comune name for search (GIN trigram for fast LIKE searches)
CREATE INDEX IF NOT EXISTS "comunes_name_idx" ON "comunes" USING gin ("name" gin_trgm_ops);

-- Index on comune latitude/longitude for geo queries
CREATE INDEX IF NOT EXISTS "comunes_coords_idx" ON "comunes"("latitude", "longitude")
WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL;

COMMIT;
