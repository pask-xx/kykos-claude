-- =====================================================
-- KYKOS - Migration Script
-- Add WITHDRAWN status to VolunteerStatus enum
-- =====================================================
-- Run this script directly on your Supabase database
-- via SQL Editor in Supabase Dashboard or via psql
-- =====================================================

-- Step 1: Add WITHDRAWN value to VolunteerStatus enum
ALTER TYPE "VolunteerStatus" ADD VALUE 'WITHDRAWN';

-- Step 2: Verify the change
SELECT enumlabel FROM pg_enum WHERE enumname = 'VolunteerStatus';

-- =====================================================
-- Expected output after running:
--  enumlabel
-- -----------
--  PENDING
--  APPROVED
--  REJECTED
--  SUSPENDED
--  WITHDRAWN
-- (5 rows)
-- =====================================================