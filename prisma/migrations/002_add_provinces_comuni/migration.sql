-- Migration: Add Provinces and Comuni tables for geographic data
-- Run this SQL directly on the database if Prisma migrate times out

BEGIN;

-- Create provinces table
CREATE TABLE IF NOT EXISTS "provinces" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "sigla" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "provinces_sigla_key" UNIQUE ("sigla")
);

-- Create comuni table
CREATE TABLE IF NOT EXISTS "comunes" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "istat" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "provinceSigla" TEXT NOT NULL,
    CONSTRAINT "comunes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "comunes_istat_key" UNIQUE ("istat"),
    CONSTRAINT "comunes_provinceSigla_fkey" FOREIGN KEY ("provinceSigla") REFERENCES "provinces"("sigla") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "comunes_provinceSigla_idx" ON "comunes"("provinceSigla");

COMMIT;
