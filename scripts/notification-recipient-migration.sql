-- Fix migration: column names were created as snake_case but Prisma expects camelCase
-- This script renames the existing columns to match Prisma's expectations

-- Step 1: Check if old snake_case columns exist and rename to camelCase
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS "recipientUserId" VARCHAR(255);

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS "recipientOperatorId" VARCHAR(255);

-- Copy data from snake_case columns if they exist
UPDATE notifications
SET "recipientUserId" = recipient_user_id
WHERE "recipientUserId" IS NULL AND recipient_user_id IS NOT NULL;

UPDATE notifications
SET "recipientOperatorId" = recipient_operator_id
WHERE "recipientOperatorId" IS NULL AND recipient_operator_id IS NOT NULL;

-- Drop old snake_case columns if they still exist
ALTER TABLE notifications
DROP COLUMN IF EXISTS recipient_user_id,
DROP COLUMN IF EXISTS recipient_operator_id;

-- Step 2: Drop old foreign keys (might still exist from before)
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notification_user_fk,
DROP CONSTRAINT IF EXISTS notification_operator_fk,
DROP CONSTRAINT IF EXISTS notification_recipient_user_unique,
DROP CONSTRAINT IF EXISTS notification_recipient_operator_unique,
DROP CONSTRAINT IF EXISTS notification_recipient_check;

-- Step 3: Add unique constraints for either column (one must be null)
ALTER TABLE notifications
ADD CONSTRAINT notification_recipient_user_unique UNIQUE ("recipientUserId"),
ADD CONSTRAINT notification_recipient_operator_unique UNIQUE ("recipientOperatorId");

-- Step 4: Add new foreign keys
ALTER TABLE notifications
ADD CONSTRAINT notification_user_fk FOREIGN KEY ("recipientUserId") REFERENCES users(id) ON DELETE CASCADE,
ADD CONSTRAINT notification_operator_fk FOREIGN KEY ("recipientOperatorId") REFERENCES operators(id) ON DELETE CASCADE;

-- Step 5: Add NOT NULL check (one of the two must be set)
ALTER TABLE notifications
ADD CONSTRAINT notification_recipient_check
CHECK ("recipientUserId" IS NOT NULL OR "recipientOperatorId" IS NOT NULL);

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_created_at
ON notifications ("createdAt");