-- Migration: Organization code format change
-- Previously codes were generated from orgName (e.g., "CARITAS-ROM-A")
-- Now codes are 6-character hex strings (e.g., "A1B2C3")
--
-- ~16.7 million combinations = practically zero collision probability
-- No retry loop needed, collision handled at app level with error

-- The code is generated in application code (src/lib/utils.ts:generateOrgCode)
-- and in src/app/api/auth/register/route.ts

-- Example: Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0')
