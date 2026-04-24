-- Migration: Add Organization nullable fields
-- Safe to run multiple times - uses IF NOT EXISTS

BEGIN;

ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "vatNumber" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "houseNumber" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "cap" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "province" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "email" TEXT;

COMMIT;
