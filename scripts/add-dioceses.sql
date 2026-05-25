-- Migration: Add Diocese model and link to Organization
-- Run this script on your Supabase PostgreSQL database

-- Create dioceses table
CREATE TABLE IF NOT EXISTS "dioceses" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "name" TEXT NOT NULL UNIQUE,
  "seat" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL
);

-- Add dioceseId to organizations
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "dioceseId" TEXT;
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_dioceseId_fkey"
  FOREIGN KEY ("dioceseId") REFERENCES "dioceses"("id") ON DELETE SET NULL;

-- Index for faster geo queries
CREATE INDEX IF NOT EXISTS "idx_dioceses_location" ON "dioceses"("latitude", "longitude");
