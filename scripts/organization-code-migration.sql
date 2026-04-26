-- Migration: Organization code format change
-- Previously codes were generated from orgName (e.g., "CARITAS-ROM-A")
-- Now codes are 4-digit numeric strings (e.g., "1234")
--
-- This migration:
-- 1. Updates the code generation to use 4-digit format for NEW organizations
-- 2. Existing codes remain valid (no data change needed)
--
-- The code is generated in application code (src/lib/utils.ts:generateOrgCode)
-- and in src/app/api/auth/register/route.ts

-- Verify the code field exists (for documentation)
-- ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "code" VARCHAR(30);

-- Example: How the new code generation works:
-- Math.floor(1000 + Math.random() * 9000).toString() => "1234", "5678", etc.
--
-- The code is guaranteed unique by checking for existing codes before insert.
