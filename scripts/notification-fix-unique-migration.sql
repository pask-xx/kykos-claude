-- Fix: Replace unique constraints with composite unique
-- The previous migration created separate UNIQUE constraints for recipientUserId
-- and recipientOperatorId, which caused errors when creating notifications
-- because a notification can only have ONE of them set (the other is NULL)

-- Step 1: Drop the incorrect unique constraints
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notification_recipient_user_unique,
DROP CONSTRAINT IF EXISTS notification_recipient_operator_unique;

-- Step 2: Add composite unique constraint (allows multiple rows with same
-- recipientUserId as long as recipientOperatorId is NULL, and vice versa)
ALTER TABLE notifications
ADD CONSTRAINT notification_recipient_composite_unique
UNIQUE ("recipientUserId", "recipientOperatorId");