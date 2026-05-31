-- =============================================
-- KYKOS - Add STREET_OBJECT_DEPOSITED Notification Type
-- Run this manually on the database after prisma migrate
-- =============================================

-- Add STREET_OBJECT_DEPOSITED value to NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'STREET_OBJECT_DEPOSITED';
