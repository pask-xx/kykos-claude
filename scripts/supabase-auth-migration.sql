-- =============================================
-- KYKOS - Supabase Auth Migration Script
-- Run this manually on the database
-- =============================================

-- 1. Add authUserId to users table (links to Supabase Auth user)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "authUserId" TEXT UNIQUE;

-- 2. Add supabaseAuthId to operators table
ALTER TABLE "operators" ADD COLUMN IF NOT EXISTS "supabaseAuthId" TEXT UNIQUE;

-- 3. Make passwordHash nullable in users (null for Supabase Auth users)
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- 4. Make passwordHash nullable in operators (null for Supabase Auth users)
ALTER TABLE "operators" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- 5. Remove PendingRegistration table (no longer needed with Supabase Auth)
DROP TABLE IF EXISTS "pending_registrations";
