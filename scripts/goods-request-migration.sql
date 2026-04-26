-- =============================================
-- KYKOS - Goods Request System Migration
-- Run this manually on the database
-- =============================================

-- 1. Add canRequestGoods and canRequestServices to organizations
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "canRequestGoods" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "canRequestServices" BOOLEAN NOT NULL DEFAULT false;

-- 2. Add canProvideServices to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "canProvideServices" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "canProvideServicesAt" TIMESTAMP(3);

-- 3. Create NotificationType enum value (if notifications table already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "NotificationType" AS ENUM (
      'DONATION_CONFIRMED', 'REQUEST_APPROVED', 'REQUEST_REJECTED',
      'OBJECT_AVAILABLE', 'OBJECT_RESERVED', 'OBJECT_DELIVERED', 'OBJECT_WITHDRAWN',
      'REPORT_RECEIVED', 'REPORT_RESOLVED', 'MESSAGE_FROM_OPERATOR',
      'NEW_REQUEST', 'NEW_REPORT', 'REQUEST_EXPIRED', 'OBJECT_BLOCKED',
      'GOODS_REQUEST_CREATED', 'GOODS_REQUEST_APPROVED', 'GOODS_REQUEST_REJECTED',
      'GOODS_REQUEST_FULFILLED', 'GOODS_OFFER_RECEIVED'
    );
  ELSE
    -- Add new values if they don't exist
    ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'GOODS_REQUEST_CREATED';
    ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'GOODS_REQUEST_APPROVED';
    ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'GOODS_REQUEST_REJECTED';
    ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'GOODS_REQUEST_FULFILLED';
    ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'GOODS_OFFER_RECEIVED';
  END IF;
END $$;

-- 4. Create RequestType enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RequestType') THEN
    CREATE TYPE "RequestType" AS ENUM ('GOODS', 'SERVICES');
  END IF;
END $$;

-- 5. Create GoodsRequestStatus enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GoodsRequestStatus') THEN
    CREATE TYPE "GoodsRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'FULFILLED', 'CANCELLED');
  END IF;
END $$;

-- 6. Create goods_requests table
CREATE TABLE IF NOT EXISTS "goods_requests" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
  "title" TEXT NOT NULL,
  "category" "Category" NOT NULL,
  "description" TEXT,
  "type" "RequestType" NOT NULL DEFAULT 'GOODS',
  "status" "GoodsRequestStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "beneficiaryId" TEXT NOT NULL,
  "intermediaryId" TEXT NOT NULL,
  "fulfilledById" TEXT,
  "fulfilledAt" TIMESTAMP(3),
  CONSTRAINT "goods_requests_beneficiary_fk" FOREIGN KEY ("beneficiaryId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "goods_requests_intermediary_fk" FOREIGN KEY ("intermediaryId") REFERENCES "organizations"("id"),
  CONSTRAINT "goods_requests_fulfilledBy_fk" FOREIGN KEY ("fulfilledById") REFERENCES "users"("id") ON DELETE SET NULL
);

-- 7. Create goods_offers table
CREATE TABLE IF NOT EXISTS "goods_offers" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
  "message" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "requestId" TEXT NOT NULL,
  "offeredById" TEXT NOT NULL,
  CONSTRAINT "goods_offers_request_fk" FOREIGN KEY ("requestId") REFERENCES "goods_requests"("id") ON DELETE CASCADE,
  CONSTRAINT "goods_offers_offeredBy_fk" FOREIGN KEY ("offeredById") REFERENCES "users"("id") ON DELETE CASCADE
);

-- 8. Create indexes
CREATE INDEX IF NOT EXISTS "goods_requests_beneficiary_idx" ON "goods_requests"("beneficiaryId");
CREATE INDEX IF NOT EXISTS "goods_requests_intermediary_idx" ON "goods_requests"("intermediaryId");
CREATE INDEX IF NOT EXISTS "goods_requests_status_idx" ON "goods_requests"("status");
CREATE INDEX IF NOT EXISTS "goods_offers_request_idx" ON "goods_offers"("requestId");

-- =============================================
-- Verify with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- =============================================