-- Migration: Add nickname column to User table
-- Run this script on your Supabase PostgreSQL database

-- Add nullable nickname column first
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nickname" TEXT UNIQUE;

-- Optional: Set a default fantasy nickname for existing users
-- UPDATE "users" SET "nickname" = 'user_' || substr("id", 1, 8) WHERE "nickname" IS NULL;

-- Make nickname required after all existing users have one (run after updating existing users)
-- ALTER TABLE "users" ALTER COLUMN "nickname" SET NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_users_nickname" ON "users"("nickname");
