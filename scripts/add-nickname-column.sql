-- Migration: Add nickname column to User table
-- Run this script on your Supabase PostgreSQL database

-- Add nullable nickname column (no unique constraint - it's just for display)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nickname" TEXT;

-- Optional: Set a default fantasy nickname for existing users
-- UPDATE "users" SET "nickname" = 'kind.heart.' || substr("id", 1, 8) WHERE "nickname" IS NULL;
