-- =============================================
-- KYKOS - Notification System Migration Script
-- Run this manually on the database
-- =============================================

-- 1. Add BLOCKED value to ObjectStatus enum (if not exists)
ALTER TYPE "ObjectStatus" ADD VALUE IF NOT EXISTS 'BLOCKED';

-- 2. Create NotificationType enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "NotificationType" AS ENUM (
      'DONATION_CONFIRMED',
      'REQUEST_APPROVED',
      'REQUEST_REJECTED',
      'OBJECT_AVAILABLE',
      'OBJECT_RESERVED',
      'OBJECT_DELIVERED',
      'OBJECT_WITHDRAWN',
      'REPORT_RECEIVED',
      'REPORT_RESOLVED',
      'MESSAGE_FROM_OPERATOR',
      'NEW_REQUEST',
      'NEW_REPORT',
      'REQUEST_EXPIRED',
      'OBJECT_BLOCKED'
    );
  END IF;
END $$;

-- 3. Create RecipientType enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RecipientType') THEN
    CREATE TYPE "RecipientType" AS ENUM ('USER', 'OPERATOR');
  END IF;
END $$;

-- 4. Create notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "link" TEXT,
  "data" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "recipientId" TEXT NOT NULL,
  "recipientType" "RecipientType" NOT NULL DEFAULT 'USER',
  "reportId" TEXT,
  CONSTRAINT "notification_user_fk" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "notification_operator_fk" FOREIGN KEY ("recipientId") REFERENCES "operators"("id") ON DELETE CASCADE,
  CONSTRAINT "notification_report_fk" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE SET NULL
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS "notifications_recipient_idx" ON "notifications"("recipientId", "recipientType");
CREATE INDEX IF NOT EXISTS "notifications_read_created_idx" ON "notifications"("read", "createdAt");