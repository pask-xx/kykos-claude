-- Migration 013_add_locations
-- Aggiunge il supporto per sedi aggiuntive (punti di raccolta) degli enti.
-- La sede principale resta su Organization (campi address/coordinates/hoursInfo
-- esistenti) — questa migration è SOLO ADDITIVE e 100% retrocompatibile.
--
-- Schema impattato:
--   - Nuovo enum LocationKind (COLLECTION_POINT)
--   - Nuova tabella locations (sedi aggiuntive)
--   - Nuova tabella operator_locations (abilitazioni N-N operatore↔sede)
--
-- Workflow KYKOS: applicare manualmente via Supabase SQL Editor.
-- Lo script è idempotente (IF NOT EXISTS / DO block su CREATE TYPE).

-- 1. Crea enum LocationKind (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LocationKind') THEN
    CREATE TYPE "LocationKind" AS ENUM ('COLLECTION_POINT');
  END IF;
END
$$;

-- 2. Crea tabella locations
CREATE TABLE IF NOT EXISTS "locations" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "kind" "LocationKind" NOT NULL DEFAULT 'COLLECTION_POINT',
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "province" TEXT,
  "country" TEXT NOT NULL DEFAULT 'IT',
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "hours" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- 3. Indici per locations
CREATE INDEX IF NOT EXISTS "locations_organizationId_idx"
  ON "locations"("organizationId");
CREATE INDEX IF NOT EXISTS "locations_organizationId_isActive_idx"
  ON "locations"("organizationId", "isActive");
CREATE INDEX IF NOT EXISTS "locations_latitude_longitude_idx"
  ON "locations"("latitude", "longitude");

-- 4. Crea tabella operator_locations (N-N)
CREATE TABLE IF NOT EXISTS "operator_locations" (
  "id" TEXT PRIMARY KEY,
  "operatorId" TEXT NOT NULL REFERENCES "operators"("id") ON DELETE CASCADE,
  "locationId" TEXT NOT NULL REFERENCES "locations"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Vincolo unique + indici per operator_locations
CREATE UNIQUE INDEX IF NOT EXISTS "operator_locations_operatorId_locationId_key"
  ON "operator_locations"("operatorId", "locationId");
CREATE INDEX IF NOT EXISTS "operator_locations_operatorId_idx"
  ON "operator_locations"("operatorId");
CREATE INDEX IF NOT EXISTS "operator_locations_locationId_idx"
  ON "operator_locations"("locationId");
